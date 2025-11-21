import { BaseCommand, flags } from '@adonisjs/core/ace'
import type { CommandOptions } from '@adonisjs/core/types/ace'
import Wallet from '#domains/wallet/models/wallet.model'
import { WalletService } from '#domains/wallet/services/wallet.service'

export default class UpdateExistingWalletTokenAccount extends BaseCommand {
  static commandName = 'update:existing-wallet-token-account'
  static description =
    "Met à jour les adresses de token account USDC pour les wallets existants qui ne l'ont pas encore"

  static options: CommandOptions = {
    startApp: true,
  }

  @flags.boolean({ alias: 'f', description: "Forcer la mise à jour même si l'adresse existe déjà" })
  declare force: boolean

  @flags.number({ alias: 'l', description: 'Limiter le nombre de wallets à traiter' })
  declare limit: number

  async run() {
    this.logger.info('Début de la mise à jour des adresses de token account USDC...')

    const walletService = new WalletService()
    const force = this.force || false
    const limit = this.limit || undefined

    try {
      // Récupérer tous les wallets Solana
      let walletsQuery = Wallet.query().where('provider', 'solana').where('tag', 'primary')

      // Si on ne force pas, ne prendre que ceux qui n'ont pas encore l'adresse USDC
      if (!force) {
        walletsQuery = walletsQuery.whereNull('usdc_token_account_address')
      }

      // Limiter si demandé
      if (limit) {
        walletsQuery = walletsQuery.limit(limit)
      }

      const wallets = await walletsQuery

      this.logger.info(`\n${wallets.length} wallet(s) à traiter\n`)

      if (wallets.length === 0) {
        this.logger.success('Aucun wallet à mettre à jour.')
        return
      }

      let successCount = 0
      let errorCount = 0
      const errors: Array<{ walletId: number; address: string; error: string }> = []

      // Traiter chaque wallet
      for (const wallet of wallets) {
        try {
          this.logger.info(`Traitement du wallet ${wallet.id} (${wallet.address})...`)

          const usdcTokenAccountAddress = await walletService.calculateUsdcTokenAccountAddress(
            wallet.address
          )

          if (usdcTokenAccountAddress) {
            await wallet.merge({ usdcTokenAccountAddress }).save()
            this.logger.success(`  ✅ Wallet ${wallet.id}: ${usdcTokenAccountAddress}`)
            successCount++
          } else {
            this.logger.info(`  ⚠️  Wallet ${wallet.id}: Impossible de calculer l'adresse USDC`)
            errors.push({
              walletId: wallet.id,
              address: wallet.address,
              error: "Impossible de calculer l'adresse USDC",
            })
            errorCount++
          }
        } catch (error: any) {
          this.logger.error(`  ❌ Wallet ${wallet.id}: ${error.message}`)
          errors.push({
            walletId: wallet.id,
            address: wallet.address,
            error: error.message || 'Erreur inconnue',
          })
          errorCount++
        }
      }

      // Afficher le résumé
      this.logger.info(`\n📊 Résumé:`)
      this.logger.info(`  ✅ Succès: ${successCount}`)
      this.logger.info(`  ❌ Erreurs: ${errorCount}`)
      this.logger.info(`  📝 Total traité: ${wallets.length}`)

      if (errors.length > 0) {
        this.logger.info(`\n❌ Détails des erreurs:`)
        errors.forEach((err) => {
          this.logger.info(`  - Wallet ${err.walletId} (${err.address}): ${err.error}`)
        })
      }

      this.logger.success(`\n✅ Mise à jour terminée!`)
    } catch (error: any) {
      this.logger.error(`Erreur lors de la mise à jour: ${error.message}`)
      process.exit(1)
    }
  }
}
