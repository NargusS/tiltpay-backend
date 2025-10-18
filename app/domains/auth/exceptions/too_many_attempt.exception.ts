import { Exception } from '@adonisjs/core/exceptions'

export class TooManyAttemptsException extends Exception {
  static status = 429
  static code = 'TOO_MANY_ATTEMPTS'
  message = 'Too many attempts'
  public retryAfter: number

  constructor(retryAfter: number, message: string = 'Too many attempts') {
    super(message, { status: 429, code: 'TOO_MANY_ATTEMPTS' })
    this.retryAfter = retryAfter
  }
}
