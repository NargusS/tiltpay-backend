import { BaseCommand, args, flags } from '@adonisjs/core/ace'
import type { CommandOptions } from '@adonisjs/core/types/ace'
import Wallet from '#domains/wallet/models/wallet.model'
import { SolanaService } from '#domains/transaction/services/solana.service'
import { MAP_CONTRACT_ADDRESS } from '#domains/wallet/constants/wallet.constants'

export default class UpdateTransactionHistory extends BaseCommand {
  static commandName = 'update:transaction-history'
  static description =
    "Récupère l'historique des transactions d'une adresse pour un token spécifique sur Solana"

  static options: CommandOptions = {}

  @args.string({
    description: 'Adresse du wallet ou ID utilisateur',
    default: '7T7o7CXekdSeW2743g7SwowsfzJyytJcufYfz9LUvm2J',
  })
  declare wallet: string

  @args.string({
    description: 'Adresse du token mint (ex: USDC)',
    default: '4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU',
  })
  declare tokenMint: string

  @flags.number({ alias: 'l', description: 'Nombre maximum de transactions à récupérer' })
  declare limit: number

  async run() {
    const walletIdentifier = this.wallet
    const tokenMintAddress = this.tokenMint
    const limit = this.limit || 100

    this.logger.info(`Récupération de l'historique des transactions...`)
    this.logger.info(`Wallet: ${walletIdentifier}`)
    this.logger.info(`Token Mint: ${tokenMintAddress}`)
    this.logger.info(`Limit: ${limit}`)

    try {
      // Déterminer si c'est une adresse ou un ID utilisateur
      let walletAddress: string

      if (walletIdentifier.startsWith('0x') || walletIdentifier.length > 30) {
        // C'est probablement une adresse
        walletAddress = walletIdentifier
      } else {
        // C'est probablement un ID utilisateur
        const userId = Number.parseInt(walletIdentifier)
        if (Number.isNaN(userId)) {
          this.logger.error(
            "L'identifiant du wallet doit être une adresse ou un ID utilisateur valide"
          )
          return
        }

        const wallet = await Wallet.query()
          .where('user_id', userId)
          .where('provider', 'solana')
          .where('tag', 'primary')
          .first()

        if (!wallet) {
          this.logger.error(`Aucun wallet trouvé pour l'utilisateur ${userId}`)
          return
        }

        walletAddress = wallet.address
        this.logger.info(`Adresse du wallet trouvée: ${walletAddress}`)
      }

      // Vérifier si le token mint est dans la liste des tokens connus
      const tokenInfo = MAP_CONTRACT_ADDRESS[tokenMintAddress as keyof typeof MAP_CONTRACT_ADDRESS]
      if (tokenInfo) {
        this.logger.info(`Token trouvé: ${tokenInfo.name} (${tokenInfo.symbol})`)
      }

      // Récupérer l'historique des transactions
      const solanaService = new SolanaService()
      const transactions = await solanaService.getTokenTransactionHistory(
        walletAddress,
        tokenMintAddress,
        limit
      )

      this.logger.info(`\n${transactions.length} transaction(s) trouvée(s):\n`)

      if (transactions.length === 0) {
        this.logger.info('Aucune transaction trouvée pour ce token account')
        return
      }

      // Calculer les statistiques
      const stats = solanaService.calculateTransactionStats(transactions)

      // Afficher les transactions
      transactions.forEach((tx, index) => {
        const date = tx.blockTime ? new Date(tx.blockTime * 1000).toISOString() : 'Date inconnue'
        const amount = tx.amount / Math.pow(10, tx.decimals)
        const type = tx.type === 'credit' ? '+' : '-'

        this.logger.info(`\nTransaction ${index + 1}:`)
        this.logger.info(`  Signature: ${tx.signature}`)
        this.logger.info(`  Date: ${date}`)
        this.logger.info(`  Type: ${tx.type}`)
        this.logger.info(`  Montant: ${type}${amount}`)
        this.logger.info(`  De (adresse Solana): ${tx.from}`)
        if (tx.fromTokenAccount) {
          this.logger.info(`  FromTokenAccount (adresse token account): ${tx.fromTokenAccount}`)
        }
        this.logger.info(`  Vers (adresse Solana): ${tx.to}`)
        if (tx.toTokenAccount) {
          this.logger.info(`  ToTokenAccount (adresse token account): ${tx.toTokenAccount}`)
        }
        if (tx.trackedTokenAccount) {
          this.logger.info(
            `  TrackedTokenAccount (adresse token account): ${tx.trackedTokenAccount}`
          )
        }
      })

      // Afficher les statistiques
      this.logger.info(`\n📊 Statistiques:`)
      this.logger.info(`  Total reçu: ${stats.totalReceived}`)
      this.logger.info(`  Total envoyé: ${stats.totalSent}`)
      this.logger.info(`  Nombre de transactions: ${stats.transactionCount}`)
      this.logger.info(`  Nombre d'expéditeurs uniques: ${stats.uniqueSenders.length}`)
      if (stats.uniqueSenders.length > 0) {
        this.logger.info(`  Adresses Solana des expéditeurs:`)
        stats.uniqueSenders.forEach((sender, index) => {
          this.logger.info(`    ${index + 1}. ${sender}`)
        })
      }
      this.logger.info(`  Nombre de destinataires uniques: ${stats.uniqueReceivers.length}`)
      if (stats.uniqueReceivers.length > 0) {
        this.logger.info(`  Adresses Solana des destinataires:`)
        stats.uniqueReceivers.forEach((receiver, index) => {
          this.logger.info(`    ${index + 1}. ${receiver}`)
        })
      }

      this.logger.success(`\n✅ Historique récupéré avec succès!`)
    } catch (error) {
      this.logger.error("Erreur lors de la récupération de l'historique:", error)
      process.exit(1)
    }
  }
}
