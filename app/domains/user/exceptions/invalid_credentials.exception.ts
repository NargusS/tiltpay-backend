import { Exception } from '@adonisjs/core/exceptions'

export class InvalidCredentialsException extends Exception {
  static status = 401
  static code = 'INVALID_CREDENTIALS'

  constructor(message: string = 'Invalid credentials') {
    super(message, { status: 401, code: 'INVALID_CREDENTIALS' })
  }
}
