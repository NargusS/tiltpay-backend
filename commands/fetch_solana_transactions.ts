import { BaseCommand } from '@adonisjs/core/ace'
import type { CommandOptions } from '@adonisjs/core/types/ace'
import { SolanaService } from '#domains/transaction/services/solana.service'
import TokenTransaction from '#domains/transaction/models/token_transaction'
import { JobLockService } from '#domains/job/services/job_lock.service'
import { SolanaRateLimiterService } from '#domains/job/services/solana_rate_limiter.service'
import { DateTime } from 'luxon'

export default class FetchSolanaTransactions extends BaseCommand {
  static commandName = 'fetch:solana-transactions'
  static description =
    'Récupère les détails des transactions Solana indexées et met à jour la table token_transactions'

  static options: CommandOptions = {
    startApp: true,
  }

  async run() {
    const lockName = 'fetch_solana_transactions'

    const acquired = await JobLockService.tryAcquire(lockName)
    if (!acquired) {
      this.logger.info('Job déjà en cours, sortie.')
      return
    }

    this.logger.info('Démarrage du fetch des transactions Solana...')

    const solanaService = new SolanaService()
    const BATCH_SIZE = 20 // Nombre total de transactions à traiter

    try {
      const toProcess = await TokenTransaction.query()
        .where('status', 'indexed')
        .orderBy('slot', 'desc')
        .limit(BATCH_SIZE)

      if (toProcess.length === 0) {
        this.logger.info('Aucune transaction à traiter.')
        return
      }

      const mint = toProcess[0].mint

      // Traiter chaque transaction une par une avec rate limiting
      for (const row of toProcess) {
        // Attendre avant chaque requête RPC pour respecter le rate limit partagé
        await SolanaRateLimiterService.waitIfNeeded()

        try {
          const parsedTx = await solanaService.getGlobalTokenTransactionForSignature(
            mint,
            row.signature
          )

          if (!parsedTx) {
            row.status = 'failed'
            row.error = 'Could not parse transaction'
            await row.save()
            continue
          }

          row.amount = String(parsedTx.amount)
          row.decimals = parsedTx.decimals
          row.fromAddress = parsedTx.from
          row.toAddress = parsedTx.to
          row.fromTokenAccount = parsedTx.fromTokenAccount || null
          row.toTokenAccount = parsedTx.toTokenAccount || null
          row.blockTime =
            parsedTx.blockTime !== null ? DateTime.fromSeconds(parsedTx.blockTime) : row.blockTime
          row.raw = null
          row.status = 'fetched'
          row.error = null

          await row.save()
        } catch (error: any) {
          this.logger.error(
            `Erreur lors du fetch de la transaction ${row.signature}: ${error.message}`
          )
          row.status = 'failed'
          row.error = error.message || 'Error fetching transaction'
          await row.save()
        }
      }

      this.logger.success('Fetch des transactions Solana terminé.')
    } finally {
      await JobLockService.release(lockName)
    }
  }
}
