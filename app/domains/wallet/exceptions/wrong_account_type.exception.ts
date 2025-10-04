import { Exception } from '@adonisjs/core/exceptions'

export class WrongAccountTypeException extends Exception {
  static status = 400
  static code = 'WRONG_ACCOUNT_TYPE'

  constructor(message: string = 'Wrong account type') {
    super(message, { status: 400, code: 'WRONG_ACCOUNT_TYPE' })
  }
}
