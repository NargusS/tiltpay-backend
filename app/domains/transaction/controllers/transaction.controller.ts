import { HttpContext } from '@adonisjs/core/http'
import { ApiHeader, ApiOperation, ApiResponse } from '@foadonis/openapi/decorators'
import { ErrorResponse } from '#shared/error.types'
import { TransactionResponse } from '#domains/transaction/types/response.types'
import TransactionService from '../services/transaction.service.js'
import { WalletService } from '#domains/wallet/services/wallet.service'
@ApiHeader({
  name: 'Authorization',
  description: 'Bearer token',
  required: true,
})
@ApiResponse({
  status: 401,
  description: 'Unauthorized',
  type: ErrorResponse,
})
@ApiResponse({
  status: 500,
  description: 'Internal server error',
  type: ErrorResponse,
})
export default class TransactionController {
  constructor(
    private transactionService: TransactionService,
    private walletService: WalletService
  ) {}

  @ApiOperation({
    summary: 'Get transactions',
    description: 'Get transactions',
  })
  @ApiResponse({
    status: 200,
    description: 'Transactions',
    type: TransactionResponse,
  })
  async getTransactions({ auth, response }: HttpContext) {
    const user = auth.user!
    const wallet = await this.walletService.get_address(user.id)
    const transactions = await this.transactionService.getTransactions(wallet.address)
    return response.status(200).json({ transactions })
  }
}
