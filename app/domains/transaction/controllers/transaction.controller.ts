import type { HttpContext } from '@adonisjs/core/http'
import { inject } from '@adonisjs/core'
import TransactionService from '#domains/transaction/services/transaction.service'

@inject()
export default class TransactionController {
  constructor(private transactionService: TransactionService) {}

  /**
   * GET /transactions
   * Get all transactions for authenticated user's wallet
   */
  async index({ auth, request, response }: HttpContext) {
    try {
      const user = auth.getUserOrFail()

      // Get pagination params
      const page = request.input('page', 1)
      const limit = request.input('limit', 20)

      // Get user's wallet
      await user.load('wallet')
      if (!user.wallet || user.wallet.length === 0) {
        return response.status(200).json({
          data: [],
          meta: { page, limit, total: 0 },
        })
      }

      const walletId = user.wallet[0].id

      // Get transactions
      const transactions = await this.transactionService.getWalletTransactions(
        walletId,
        page,
        limit
      )

      return response.status(200).json({
        data: transactions,
        meta: { page, limit },
      })
    } catch (error) {
      return response.status(500).json({
        message: 'Internal server error',
        code: 'INTERNAL_SERVER_ERROR',
      })
    }
  }
}
