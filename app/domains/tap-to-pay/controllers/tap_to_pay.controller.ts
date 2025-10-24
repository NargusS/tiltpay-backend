import TapToPayService from '#domains/tap-to-pay/services/tap_to_pay.service'
import { ApiBody, ApiHeader, ApiOperation, ApiResponse } from '@foadonis/openapi/decorators'
import {
  ApproveTapToPayRequestResponse,
  CreateTapToPayAuthorizationResponse,
  CreateTapToPayRequestResponse,
} from '#domains/tap-to-pay/types/response.types'
import type { HttpContext } from '@adonisjs/core/http'
import {
  ApproveTapToPayRequest,
  CreateTapToPayRequest,
} from '#domains/tap-to-pay/validators/request.validator'
import { ErrorResponse } from '#shared/error.types'
import { inject } from '@adonisjs/core'

@ApiHeader({
  name: 'Authorization',
  description: 'Bearer token',
  required: true,
})
@ApiResponse({
  status: 500,
  description: 'Failed to create tap to pay request',
  type: ErrorResponse,
})
@ApiResponse({
  status: 400,
  description: 'Invalid request',
  type: ErrorResponse,
})
@ApiResponse({
  status: 401,
  description: 'Unauthorized',
  type: ErrorResponse,
})
@ApiResponse({
  status: 422,
  description: 'Validation error',
  type: ErrorResponse,
})
@inject()
export default class TapToPayController {
  constructor(private tapToPayService: TapToPayService) {}

  @ApiOperation({
    summary: 'Create a new tap to pay request',
    description: 'Create a new tap to pay request',
  })
  @ApiBody({
    type: () => CreateTapToPayRequest,
    required: true,
  })
  @ApiResponse({
    status: 201,
    description: 'Tap to pay request created',
    type: CreateTapToPayRequestResponse,
  })
  async createTapToPayRequest({ request, response, auth }: HttpContext) {
    try {
      const { amount, currency } = await request.validateUsing(CreateTapToPayRequest)
      const tapToPayRequest = await this.tapToPayService.createRequest(
        auth.user!.id,
        amount,
        currency
      )
      return response.status(201).json(tapToPayRequest)
    } catch (error) {
      return response.status(500).json({
        message: 'Failed to create tap to pay request',
        code: 'TAP_TO_PAY_REQUEST_ERROR',
        name: 'Failed to create tap to pay request',
      })
    }
  }

  @ApiOperation({
    summary: 'Create a new tap to pay authorization',
    description: 'Create a new tap to pay authorization',
  })
  @ApiResponse({
    status: 201,
    description: 'Tap to pay authorization created',
    type: CreateTapToPayAuthorizationResponse,
  })
  async createTapToPayAuthorization({ response, auth }: HttpContext) {
    try {
      const tapToPayAuthorization = await this.tapToPayService.createAuthorization(auth.user!.id)
      return response.status(201).json(tapToPayAuthorization)
    } catch (error) {
      return response.status(500).json({
        message: 'Failed to create tap to pay authorization',
        code: 'TAP_TO_PAY_AUTHORIZATION_ERROR',
        name: 'Failed to create tap to pay authorization',
      })
    }
  }

  @ApiOperation({
    summary: 'Approve a tap to pay request',
    description: 'Approve a tap to pay request',
  })
  @ApiBody({
    type: () => ApproveTapToPayRequest,
    required: true,
  })
  @ApiResponse({
    status: 201,
    description: 'Tap to pay request approved',
    type: ApproveTapToPayRequestResponse,
  })
  async approveTapToPayRequest({ request, response, auth }: HttpContext) {
    try {
      const { requestId, secret } = await request.validateUsing(ApproveTapToPayRequest)
      const tapToPayRequest = await this.tapToPayService.approveRequest(
        auth.user!.id,
        requestId,
        secret
      )
      return response.status(201).json(tapToPayRequest)
    } catch (error) {
      return response.status(500).json({
        message: 'Failed to approve tap to pay request',
        code: 'TAP_TO_PAY_REQUEST_ERROR',
        name: 'Failed to approve tap to pay request',
      })
    }
  }
}
