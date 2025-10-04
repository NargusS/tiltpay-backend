import { Exception } from '@adonisjs/core/exceptions'

export class InvalidCredentialsException extends Exception {
  static status = 401
  static code = 'INVALID_CREDENTIALS'
  message = 'Invalid credentials'
  constructor(message: string = 'Invalid credentials') {
    super(message, { status: 401, code: 'INVALID_CREDENTIALS' })
  }
}
