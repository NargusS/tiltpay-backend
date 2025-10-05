import { HttpContext } from '@adonisjs/core/http'
import { WalletService } from '#domains/wallet/services/wallet.service'
import { inject } from '@adonisjs/core'
import {
  ApiBody,
  ApiHeader,
  ApiOperation,
  ApiQuery,
  ApiResponse,
} from '@foadonis/openapi/decorators'
import { ErrorResponseSchema } from '#shared/error.schema'
import { GetBalanceValidator } from '#domains/wallet/validators/grid.validators'
import { TransferMoneyByTagValidator } from '#domains/wallet/validators/transfer_money_by_tag.validator'
import { UserService } from '#domains/user/services/user.service'
import { UserNotFoundException } from '#domains/user/exceptions/user_not_found.exception'
import { UserSelfTransferException } from '#domains/wallet/exceptions/user_self_transfer.exception'
import {
  GetVirtualAccountValidator,
  SourceDepositInstructionsValidator,
} from '#domains/wallet/validators/get_virtual_account.validator'

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
  constructor(
    private wallet_service: WalletService,
    private user_service: UserService
  ) {}

  @ApiOperation({
    summary: 'Get Wallet balance',
    description: 'Get Wallet balance',
  })
  @ApiResponse({
    status: 200,
    description: 'Wallet balance',
    type: () => GetBalanceValidator,
  })
  async getBalance({ auth, response }: HttpContext) {
    const user = auth.user!
    const wallet = await this.wallet_service.get_balance(user.id)
    return response.status(200).json(wallet)
  }

  @ApiOperation({
    summary: 'Get Wallet address',
    description: 'Get Wallet address',
  })
  @ApiResponse({
    status: 200,
    description: 'Wallet address',
  })
  async getAddress({ auth, response }: HttpContext) {
    const user = auth.user!
    const address = await this.wallet_service.get_address(user.id)
    return response.status(200).json({
      address: address,
    })
  }

  @ApiOperation({
    summary: 'Transfer money by tag',
    description: 'Transfer money by tag',
  })
  @ApiResponse({
    status: 201,
    description: 'Transfer money by tag',
  })
  @ApiResponse({
    status: 400,
    description: 'User self transfer',
    type: () => ErrorResponseSchema,
  })
  @ApiBody({
    type: () => TransferMoneyByTagValidator,
  })
  async transferByTag({ request, auth, response }: HttpContext) {
    const user = auth.user!
    const { amount, tag } = await request.validateUsing(TransferMoneyByTagValidator)
    const toUser = await this.user_service.get_by_tagname(tag)
    if (!toUser) {
      throw new UserNotFoundException()
    }
    if (user.id === toUser.id) {
      throw new UserSelfTransferException()
    }
    await this.wallet_service.transfer(user.id, toUser.id, amount)
    return response.status(201).json({ message: 'Transfer money by tag' })
  }

  // Get Virtual Account for deposit EUR | USD
  @ApiOperation({
    summary: 'Get Virtual Account for deposit EUR | USD',
    description: 'Get Virtual Account for deposit EUR | USD',
  })
  @ApiResponse({
    status: 200,
    description: 'Virtual Account',
    type: () => SourceDepositInstructionsValidator,
  })
  @ApiQuery({
    name: 'currency',
    description: 'Currency',
    required: true,
    type: () => GetVirtualAccountValidator,
  })
  async getVirtualAccount({ request, response, auth }: HttpContext) {
    const user = auth.user!
    const { currency } = await request.validateUsing(GetVirtualAccountValidator)
    const virtualAccounts = await this.wallet_service.get_virtual_account(user.id, currency)
    return response.status(200).json({
      virtual_accounts: virtualAccounts,
    })
  }
}
