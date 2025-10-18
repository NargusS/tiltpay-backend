import TransactionService from '#domains/transaction/services/transaction.service'
import { WalletService } from '#domains/wallet/services/wallet.service'
import { BaseCommand } from '@adonisjs/core/ace'
import type { CommandOptions } from '@adonisjs/core/types/ace'

export default class SyncTransactions extends BaseCommand {
  static commandName = 'sync:transactions'
  static description = 'Sync blockchain transactions for all wallets'

  static options: CommandOptions = {
    startApp: true,
  }

  async run() {
    this.logger.info('Syncing transactions...')

    try {
      // Resolve TransactionService from IoC container
      const transactionService = await this.app.container.make(TransactionService)
      const walletService = await this.app.container.make(WalletService)
      // Query wallets using raw db query
      const wallets = await walletService.get_all()

      this.logger.info(`Found ${wallets.length} wallets`)

      for (const wallet of wallets) {
        this.logger.info(`Syncing transactions for wallet ${wallet.address}...`)

        await transactionService.syncTransactions(wallet.address)

        this.logger.success(`Synced transactions for wallet ${wallet.address}`)
      }

      this.logger.success('All transactions synced!')
    } catch (error) {
      this.logger.error('Failed to sync transactions:')
      this.logger.error(error.message)
      this.logger.error(error.stack)
    }
  }
}
