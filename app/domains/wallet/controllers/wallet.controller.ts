import { HttpContext } from '@adonisjs/core/http'
import { WalletService } from '#domains/wallet/services/wallet.service'
import { inject } from '@adonisjs/core'
import {
  ApiBody,
  ApiHeader,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiResponse,
} from '@foadonis/openapi/decorators'
import { GetBalanceValidator } from '#domains/wallet/validators/grid.validators'
import { TransferMoneyByTagValidator } from '#domains/wallet/validators/transfer_money_by_tag.validator'
import { UserService } from '#domains/user/services/user.service'
import { UserNotFoundException } from '#domains/user/exceptions/user_not_found.exception'
import {
  GetVirtualAccountValidator,
  RequestVirtualAccountValidator,
} from '#domains/wallet/validators/get_virtual_account.validator'
import {
  UserSelfTransferException,
  WalletNotFoundException,
} from '#domains/wallet/exceptions/wallet.exception'
import {
  GetKycStatusResponse,
  GetVirtualAccountsResponse,
  GetWalletAddressResponse,
  RequestKycLinkResponse,
  RequestVirtualAccountResponse,
  TransferMoneyByTagResponse,
} from '#domains/wallet/types/wallet.response.types'
import { ErrorResponse } from '#shared/error.types'

@ApiHeader({
  name: 'Authorization',
  description: 'Bearer token',
  required: true,
})
@ApiResponse({
  status: 500,
  description: 'Wallet balance error',
  type: ErrorResponse,
})
@ApiResponse({
  status: 401,
  description: 'Unauthorized',
  type: ErrorResponse,
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
  async getBalance({ auth, logger, response }: HttpContext) {
    try {
      const user = auth.user!
      logger.info(`Getting wallet balance for user ${user.id}`)
      const wallet = await this.wallet_service.get_balance(user.id)
      logger.info(`Wallet balance for user ${user.id} fetched successfully`, { wallet: wallet })
      return response.status(200).json(wallet)
    } catch (error) {
      if (error instanceof WalletNotFoundException) {
        logger.error(`Wallet not found`, { error: error.message })
        return response.status(404).json({
          message: 'Wallet not found',
          code: 'WALLET_NOT_FOUND',
          name: 'Wallet not found',
        })
      }
      logger.error(`Internal server error`, { error: error.message })
      return response.status(500).json({
        message: 'Internal server error',
        code: 'INTERNAL_SERVER_ERROR',
        name: 'Internal server error',
      })
    }
  }

  @ApiOperation({
    summary: 'Get Wallet address',
    description: 'Get Wallet address',
  })
  @ApiResponse({
    status: 200,
    description: 'Wallet address',
    type: GetWalletAddressResponse,
  })
  async getAddress({ auth, response, logger }: HttpContext) {
    try {
      logger.info(`Fetching wallet address for user ${auth.user!.id}`)
      const user = auth.user!
      const address = await this.wallet_service.get_address(user.id)
      logger.info(`Wallet address for user ${user.id} fetched successfully`)
      return response.status(200).json({
        address: address,
      })
    } catch (error) {
      if (error instanceof WalletNotFoundException) {
        return response.status(404).json({
          message: 'Wallet not found',
          code: 'WALLET_NOT_FOUND',
          name: 'Wallet not found',
        })
      }
      logger.error(error)
      return response.status(500).json({
        message: 'Internal server error',
        code: 'INTERNAL_SERVER_ERROR',
        name: 'Internal server error',
      })
    }
  }

  @ApiOperation({
    summary: 'Transfer money by tag',
    description: 'Transfer money by tag',
  })
  @ApiResponse({
    status: 201,
    description: 'Transfer money by tag',
    type: TransferMoneyByTagResponse,
  })
  @ApiResponse({
    status: 400,
    description: 'User self transfer',
    type: ErrorResponse,
  })
  @ApiResponse({
    status: 404,
    description: 'Wallet not found | User not found',
    type: ErrorResponse,
  })
  @ApiBody({
    type: () => TransferMoneyByTagValidator,
  })
  async transferByTag({ request, logger, auth, response }: HttpContext) {
    try {
      const user = auth.user!
      const { amount, tag } = await request.validateUsing(TransferMoneyByTagValidator)
      logger.info(
        `Transferring money by tag for user ${user.id} to user ${tag} with amount ${amount}`
      )
      const toUser = await this.user_service.get_by_tagname(tag)
      if (!toUser) {
        throw new UserNotFoundException()
      }
      if (user.id === toUser.id) {
        throw new UserSelfTransferException()
      }
      await this.wallet_service.transfer(user.id, toUser.id, amount)
      logger.info(`Money transferred successfully for user ${user.id} to user ${toUser.id}`)
      return response.status(201).json({ message: 'Transfer money by tag' })
    } catch (error) {
      if (error instanceof UserNotFoundException) {
        logger.error(`User not found for tag`, { error: error.message })
        return response.status(404).json({
          message: 'User not found',
          code: 'USER_NOT_FOUND',
          name: 'User not found',
        })
      }
      if (error instanceof UserSelfTransferException) {
        logger.error(`User self transfer`, { error: error.message })
        return response.status(400).json({
          message: 'User self transfer',
          code: 'USER_SELF_TRANSFER',
          name: 'User self transfer',
        })
      }
      if (error instanceof WalletNotFoundException) {
        logger.error(`Wallet not found`, { error: error.message })
        return response.status(404).json({
          message: 'Wallet not found',
          code: 'WALLET_NOT_FOUND',
          name: 'Wallet not found',
        })
      }
      logger.error(`Internal server error ${error.message}`)
      return response.status(error.status).json(error)
    }
  }

  @ApiOperation({
    summary: 'Request Virtual Account',
    description: 'Request Virtual Account',
  })
  @ApiResponse({
    status: 200,
    description: 'Virtual Account',
    type: RequestVirtualAccountResponse,
  })
  @ApiQuery({
    name: 'currency',
    description: 'Currency',
    required: true,
  })
  async requestVirtualAccount({ request, logger, response, auth }: HttpContext) {
    try {
      const user = auth.user!
      const { currency } = await request.validateUsing(RequestVirtualAccountValidator)
      logger.info(`Requesting virtual account for user ${user.id} with currency ${currency}`)
      const virtualAccount = await this.wallet_service.request_virtual_account(user.id, currency)
      logger.info(`Virtual account requested successfully`, { virtualAccount: virtualAccount })
      return response.status(200).json({
        virtual_account: virtualAccount,
      })
    } catch (error) {
      if (error instanceof WalletNotFoundException) {
        logger.error(`Wallet not found`, { error: error.message })
        return response.status(404).json({
          message: 'Wallet not found',
          code: 'WALLET_NOT_FOUND',
          name: 'Wallet not found',
        })
      }
      logger.error(`Internal server error`, { error: error.message })
      return response.status(500).json({
        message: 'Internal server error',
        code: 'INTERNAL_SERVER_ERROR',
        name: 'Internal server error',
      })
    }
  }

  @ApiOperation({
    summary: 'Get Virtual Account for deposit EUR | USD',
    description: 'Get Virtual Account for deposit EUR | USD',
  })
  @ApiResponse({
    status: 200,
    description: 'Virtual Account',
    type: GetVirtualAccountsResponse,
  })
  @ApiQuery({
    name: 'currency',
    description: 'Currency',
    required: true,
  })
  async getVirtualAccount({ request, logger, response, auth }: HttpContext) {
    try {
      const user = auth.user!
      const { currency } = await request.validateUsing(GetVirtualAccountValidator)
      logger.info(`Getting virtual accounts for user ${user.id} with currency ${currency}`)
      const virtualAccounts = await this.wallet_service.get_virtual_account(user.id, currency)
      logger.info(`Virtual accounts fetched successfully`, { virtualAccounts: virtualAccounts })
      return response.status(200).json({
        virtual_accounts: virtualAccounts,
      })
    } catch (error) {
      if (error instanceof WalletNotFoundException) {
        logger.error(`Wallet not found`, { error: error.message })
        return response.status(404).json({
          message: 'Wallet not found',
          code: 'WALLET_NOT_FOUND',
          name: 'Wallet not found',
        })
      }
      logger.error(`Internal server error`, { error: error.message })
      return response.status(500).json({
        message: 'Internal server error',
        code: 'INTERNAL_SERVER_ERROR',
        name: 'Internal server error',
      })
    }
  }

  @ApiOperation({
    summary: 'Request KYC Link',
    description: 'Request KYC Link',
  })
  @ApiResponse({
    status: 201,
    description: 'KYC Link',
    type: RequestKycLinkResponse,
  })
  async requestKycLink({ logger, response, auth }: HttpContext) {
    const user = auth.user!
    try {
      logger.info(`Requesting KYC link for user ${user.id}`)
      const kycLink = await this.wallet_service.request_kyc_link(
        user.id,
        'test@test.com', // TODO: Email should be from user
        user.fullName
      )
      logger.info(`KYC link requested successfully`, { kycLink: kycLink })
      return response.status(201).json(kycLink)
    } catch (error) {
      if (error instanceof WalletNotFoundException) {
        logger.error(`Wallet not found`, { error: error.message })
        return response.status(404).json({
          message: 'Wallet not found',
          code: 'WALLET_NOT_FOUND',
          name: 'Wallet not found',
        })
      }
      logger.error(`Internal server error`, { error: error.message })
      return response.status(500).json({
        message: 'Internal server error',
        code: 'INTERNAL_SERVER_ERROR',
        name: 'Internal server error',
      })
    }
  }

  @ApiOperation({
    summary: 'Get KYC Status',
    description: 'Get KYC Status',
  })
  @ApiParam({
    name: 'kyc_id',
    description: 'KYC ID',
    required: true,
  })
  @ApiResponse({
    status: 200,
    description: 'KYC Status',
    type: GetKycStatusResponse,
  })
  async getKycStatus({ params, logger, response, auth }: HttpContext) {
    try {
      const user = auth.user!
      logger.info(`Getting KYC status for user ${user.id} with kyc id ${params.kyc_id}`)
      const kycStatus = await this.wallet_service.get_kyc_status(user.id, params.kyc_id)
      logger.info(`KYC status fetched successfully`, { kycStatus: kycStatus })
      return response.status(200).json(kycStatus)
    } catch (error) {
      if (error instanceof WalletNotFoundException) {
        logger.error(`Wallet not found`, { error: error.message })
        return response.status(404).json({
          message: 'Wallet not found',
          code: 'WALLET_NOT_FOUND',
          name: 'Wallet not found',
        })
      }
      logger.error(`Internal server error`, { error: error.message })
      return response.status(500).json({
        message: 'Internal server error',
        code: 'INTERNAL_SERVER_ERROR',
        name: 'Internal server error',
      })
    }
  }
}
