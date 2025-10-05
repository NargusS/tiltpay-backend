import { HttpContext } from '@adonisjs/core/http'
import { WalletService } from '#domains/wallet/services/wallet.service'
import { inject } from '@adonisjs/core'
import { ApiHeader, ApiOperation, ApiResponse } from '@foadonis/openapi/decorators'
import { ErrorResponseSchema } from '#shared/error.schema'
import { GetBalanceValidator } from '#domains/wallet/validators/grid.validators'

@ApiHeader({
  name: 'Authorization',
  description: 'Bearer token',
  required: true,
})
@ApiResponse({
  status: 500,
  description: 'Wallet balance error',
  type: () => ErrorResponseSchema,
})
@ApiResponse({
  status: 401,
  description: 'Unauthorized',
  type: () => ErrorResponseSchema,
})
@inject()
export default class WalletController {
  constructor(private walletService: WalletService) {}

  @ApiOperation({
    summary: 'Get wallet balance',
    description: 'Get wallet balance',
  })
  @ApiResponse({
    status: 200,
    description: 'Wallet balance',
    type: () => GetBalanceValidator,
  })
  async getBalance({ auth, response }: HttpContext) {
    const user = auth.user!
    const wallet = await this.walletService.get_balance(user.id)
    return response.status(200).json(wallet)
  }
}
