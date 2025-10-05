import { Exception } from '@adonisjs/core/exceptions'

export class GetWalletValidationException extends Exception {
  static status = 500
  static code = 'GET_WALLET_VALIDATION_EXCEPTION'

  constructor(message: string = 'Get wallet validation exception') {
    super(message, { status: 500, code: 'GET_WALLET_VALIDATION_EXCEPTION' })
  }
}
