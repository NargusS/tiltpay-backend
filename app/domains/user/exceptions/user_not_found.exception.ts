import { Exception } from '@adonisjs/core/exceptions'

export class UserNotFoundException extends Exception {
  static status = 404
  static code = 'USER_NOT_FOUND'

  constructor(message: string = 'User not found') {
    super(message, { status: 404, code: 'USER_NOT_FOUND' })
  }
}
