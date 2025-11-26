import { BaseCommand } from '@adonisjs/core/ace'
import type { CommandOptions } from '@adonisjs/core/types/ace'
import env from '#start/env'
import Wallet from '#domains/wallet/models/wallet.model'
import TokenTransaction from '#domains/transaction/models/token_transaction'
import { SolanaService } from '#domains/transaction/services/solana.service'
import { DateTime } from 'luxon'

export default class IndexSolanaSignatures extends BaseCommand {
  static commandName = 'index:solana-signatures'
  static description =
    'Indexe les signatures de transactions pour les wallets Solana dans la table token_transactions'

  static options: CommandOptions = {
    startApp: true,
  }

  async run() {
    this.logger.info('Démarrage de l’indexation des signatures Solana...')

    const usdcMint = env.get('USDC_MINT_ADDRESS')
    const solanaService = new SolanaService()

    const wallets = await Wallet.query().where('provider', 'solana').where('tag', 'primary')

    if (wallets.length === 0) {
      this.logger.info('Aucun wallet Solana trouvé.')
      return
    }

    for (const wallet of wallets) {
      if (!wallet.usdcTokenAccountAddress) {
        this.logger.info(
          `Wallet ${wallet.id} (${wallet.address}) sans usdcTokenAccountAddress, ignoré.`
        )
        continue
      }

      this.logger.info(`Indexation des signatures pour le wallet ${wallet.id}...`)

      const limit = 1000

      const signatures = await solanaService.getSignaturesForAddress(
        wallet.usdcTokenAccountAddress,
        {
          limit,
        }
      )
      const transactions: Partial<TokenTransaction>[] = signatures.map((sigInfo) => ({
        mint: usdcMint,
        signature: sigInfo.signature,
        slot: BigInt(sigInfo.slot),
        blockTime: sigInfo.blockTime ? DateTime.fromSeconds(sigInfo.blockTime) : null,
        status: 'indexed',
      }))

      await TokenTransaction.fetchOrCreateMany('signature', transactions)
    }

    this.logger.success('Indexation des signatures terminée.')
  }
}
