import { Exception } from '@adonisjs/core/exceptions'

export class WalletNotFoundException extends Exception {
  static status = 404
  static code = 'WALLET_NOT_FOUND'

  constructor(message: string = 'Wallet not found') {
    super(message, { status: 404, code: 'WALLET_NOT_FOUND' })
  }
}
