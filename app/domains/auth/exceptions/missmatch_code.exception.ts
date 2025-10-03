import { Exception } from '@adonisjs/core/exceptions'

export class MissmatchCodeException extends Exception {
  static status = 401
  static code = 'MISSMATCH_CODE'

  constructor(message: string = 'Missmatch code') {
    super(message, { status: 401, code: 'MISSMATCH_CODE' })
  }
}
