import { Exception } from '@adonisjs/core/exceptions'

export class InsufficientFundsException extends Exception {
  static status = 400
  static code = 'INSUFFICIENT_FUNDS'

  constructor(message: string = 'Insufficient funds in wallet') {
    super(message, { status: 400, code: 'INSUFFICIENT_FUNDS' })
  }
}

export class TransactionNotFoundException extends Exception {
  static status = 404
  static code = 'TRANSACTION_NOT_FOUND'

  constructor(message: string = 'Transaction not found') {
    super(message, { status: 404, code: 'TRANSACTION_NOT_FOUND' })
  }
}

export class InvalidTransactionException extends Exception {
  static status = 400
  static code = 'INVALID_TRANSACTION'

  constructor(message: string = 'Invalid transaction') {
    super(message, { status: 400, code: 'INVALID_TRANSACTION' })
  }
}

export class WalletNotFoundException extends Exception {
  static status = 404
  static code = 'WALLET_NOT_FOUND'

  constructor(message: string = 'Wallet not found') {
    super(message, { status: 404, code: 'WALLET_NOT_FOUND' })
  }
}
