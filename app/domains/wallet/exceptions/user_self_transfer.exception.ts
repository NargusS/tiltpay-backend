import { Exception } from '@adonisjs/core/exceptions'

export class UserSelfTransferException extends Exception {
  static status = 400
  static code = 'USER_SELF_TRANSFER'

  constructor(message: string = 'User self transfer') {
    super(message, { status: 400, code: 'USER_SELF_TRANSFER' })
  }
}
