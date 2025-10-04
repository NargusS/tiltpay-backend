import { Exception } from '@adonisjs/core/exceptions'

export class NotificationFailedException extends Exception {
  static status = 500
  static code = 'E_NOTIFICATION_FAILED'
  static message = 'Failed to send notification'

  constructor(message?: string) {
    super(message || NotificationFailedException.message, {
      status: NotificationFailedException.status,
      code: NotificationFailedException.code,
    })
  }
}
