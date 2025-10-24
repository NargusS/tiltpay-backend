import { TapToPayAuthorization, TapToPayRequest } from '#domains/tap-to-pay/models/tap_to_pay.model'
import {
  ApproveTapToPayRequestResponse,
  CreateTapToPayAuthorizationResponse,
  CreateTapToPayRequestResponse,
} from '#domains/tap-to-pay/types/response.types'
import {
  TapToPayException,
  TapToPayInvalidAuthorizationException,
  TapToPayRequestNotFoundException,
} from '#domains/tap-to-pay/exceptions/tap_to_pay.exception'
import { inject } from '@adonisjs/core'
import { WalletService } from '#domains/wallet/services/wallet.service'
import { DateTime } from 'luxon'

@inject()
export default class TapToPayService {
  constructor(private walletService: WalletService) {}

  async createRequest(
    fromUserId: number,
    amount: number,
    currency: string
  ): Promise<CreateTapToPayRequestResponse> {
    await TapToPayRequest.query()
      .where('fromUserId', fromUserId)
      .where('status', 'pending')
      .update({
        status: 'cancelled',
      })
    console.log('request created')
    const request = await TapToPayRequest.create({
      fromUserId,
      amount,
      currency,
    })
    return {
      id: request.id,
      amount: request.amount,
      currency: request.currency,
    }
  }

  async createAuthorization(userId: number): Promise<CreateTapToPayAuthorizationResponse> {
    await TapToPayAuthorization.query().where('userId', userId).where('status', 'active').update({
      status: 'revoked',
    })
    const authorization = await TapToPayAuthorization.create({
      userId,
    })
    return {
      secret: authorization.secret,
    }
  }

  async approveRequest(
    userId: number,
    requestId: number,
    secret: string
  ): Promise<ApproveTapToPayRequestResponse> {
    const request = await TapToPayRequest.query()
      .where('id', requestId)
      .where('fromUserId', userId)
      .where('status', 'pending')
      .first()
    if (!request) {
      throw new TapToPayRequestNotFoundException()
    }
    const authorization = await TapToPayAuthorization.query()
      .where('secret', secret)
      .where('status', 'active')
      .first()
    if (!authorization) {
      throw new TapToPayInvalidAuthorizationException()
    }
    if (authorization.authorizedAt < DateTime.now().minus({ minutes: 1 })) {
      await authorization
        .merge({
          status: 'revoked',
        })
        .save()
      throw new TapToPayInvalidAuthorizationException()
    }
    await authorization
      .merge({
        status: 'revoked',
      })
      .save()
    try {
      console.log('transferring money')
      console.log('from', authorization.userId)
      console.log('to', request.fromUserId)
      console.log('amount', request.amount)
      await this.walletService.transfer_to_user(
        authorization.userId,
        request.fromUserId,
        request.amount
      )
    } catch (error) {
      console.error(error)
      await request
        .merge({
          status: 'failed',
        })
        .save()
      throw new TapToPayException('Failed to transfer money')
    }
    await request
      .merge({
        status: 'approved',
        toUserId: authorization.userId,
      })
      .save()
    return {
      id: request.id,
      amount: request.amount,
      currency: request.currency,
    }
  }
}
