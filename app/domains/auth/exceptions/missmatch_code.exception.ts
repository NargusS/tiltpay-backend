import { Exception } from '@adonisjs/core/exceptions'

export class MissmatchCodeException extends Exception {
  static status = 412
  static code = 'MISSMATCH_CODE'
  message = 'Missmatch code'
  constructor(message: string = 'Missmatch code') {
    super(message, { status: 412, code: 'MISSMATCH_CODE' })
  }
}
