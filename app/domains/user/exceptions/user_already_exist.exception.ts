import { Exception } from '@adonisjs/core/exceptions'

export class UserAlreadyExistsException extends Exception {
  static status = 409
  static code = 'USER_ALREADY_EXISTS'

  constructor(message: string = 'User with this email already exists') {
    super(message, { status: 409, code: 'USER_ALREADY_EXISTS' })
  }
}
