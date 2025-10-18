import { Exception } from '@adonisjs/core/exceptions'

export class WalletException extends Exception {
  static status = 500
  static code = 'WALLET_EXCEPTION'

  constructor(message: string = 'Wallet exception') {
    super(message, { status: 500, code: 'WALLET_EXCEPTION' })
  }
}

export class WalletNotFoundException extends WalletException {
  static status = 404
  static code = 'WALLET_NOT_FOUND'

  constructor(message: string = 'Wallet not found') {
    super(message)
  }
}

export class WrongAccountTypeException extends WalletException {
  static status = 400
  static code = 'WRONG_ACCOUNT_TYPE'

  constructor(message: string = 'Wrong account type') {
    super(message)
  }
}

export class UserSelfTransferException extends WalletException {
  static status = 400
  static code = 'USER_SELF_TRANSFER'

  constructor(message: string = 'User self transfer') {
    super(message)
  }
}
