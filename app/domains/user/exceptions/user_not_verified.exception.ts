import { Exception } from '@adonisjs/core/exceptions'

export class UserNotVerifiedException extends Exception {
  static status = 412
  static code = 'USER_NOT_VERIFIED'

  constructor(message: string = 'User not verified') {
    super(message, { status: 401, code: 'USER_NOT_VERIFIED' })
  }
}
