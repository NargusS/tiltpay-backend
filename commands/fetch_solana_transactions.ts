import { BaseCommand } from '@adonisjs/core/ace'
import type { CommandOptions } from '@adonisjs/core/types/ace'
import { SolanaService } from '#domains/transaction/services/solana.service'
import TokenTransaction from '#domains/transaction/models/token_transaction'
import { JobLockService } from '#domains/job/services/job_lock.service'
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
    const BATCH_SIZE = 50

    try {
      const toProcess = await TokenTransaction.query()
        .where('status', 'indexed')
        .orderBy('slot', 'desc')
        .limit(BATCH_SIZE)

      if (toProcess.length === 0) {
        this.logger.info('Aucune transaction à traiter.')
        return
      }

      // Construire un mapping signature -> row DB
      const rowsBySignature = new Map<string, (typeof toProcess)[number]>()
      for (const row of toProcess) {
        rowsBySignature.set(row.signature, row)
      }

      const signatures = toProcess.map((row) => row.signature)
      const mint = toProcess[0].mint

      const parsedTransactions = await solanaService.getGlobalTokenTransactionsForSignatures(
        mint,
        signatures
      )

      for (const parsedTx of parsedTransactions) {
        const row = rowsBySignature.get(parsedTx.signature)
        if (!row) {
          continue
        }

        row.amount = String(parsedTx.amount)
        row.decimals = parsedTx.decimals
        row.type = parsedTx.type
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
      }

      // Marquer les lignes sans parsedTx comme failed
      const parsedSignatures = new Set(parsedTransactions.map((tx) => tx.signature))
      for (const row of toProcess) {
        if (!parsedSignatures.has(row.signature)) {
          row.status = 'failed'
          row.error = row.error || 'No meta or could not parse transaction'
          await row.save()
        }
      }

      this.logger.success('Fetch des transactions Solana terminé.')
    } finally {
      await JobLockService.release(lockName)
    }
  }
}
