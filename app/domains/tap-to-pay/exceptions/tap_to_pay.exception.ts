import { Exception } from '@adonisjs/core/exceptions'

export class TapToPayException extends Exception {
  static status = 500
  static code = 'TAP_TO_PAY_EXCEPTION'

  constructor(message: string = 'Tap to pay exception') {
    super(message)
  }
}

export class TapToPayRequestNotFoundException extends TapToPayException {
  static status = 404
  static code = 'TAP_TO_PAY_REQUEST_NOT_FOUND'

  constructor(message: string = 'Tap to pay request not found') {
    super(message)
  }
}

export class TapToPayInvalidAuthorizationException extends TapToPayException {
  static status = 400
  static code = 'TAP_TO_PAY_INVALID_AUTHORIZATION'
  message = 'Tap to pay invalid authorization'
  constructor(message: string = 'Tap to pay invalid authorization') {
    super(message)
  }
}
