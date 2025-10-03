import { Exception } from '@adonisjs/core/exceptions'

export class LoginFailedException extends Exception {
  static status = 401
  static code = 'LOGIN_FAILED'

  constructor(message: string = 'Login failed') {
    super(message, { status: 401, code: 'LOGIN_FAILED' })
  }
}
