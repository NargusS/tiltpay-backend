import { inject } from '@adonisjs/core'
import type { SmsAdapter } from '../adapters/sms_adapter.interface.js'
import { MockSmsAdapter } from '../adapters/mock_sms_adapter.js'
import { NotificationFailedException } from '../exceptions/notification_failed.exception.js'
import logger from '@adonisjs/core/services/logger'

@inject()
export default class NotificationService {
  private smsAdapter: SmsAdapter

  constructor() {
    // Use mock adapter by default
    // Later, you can inject based on config: env.get('SMS_PROVIDER')
    this.smsAdapter = new MockSmsAdapter()
  }

  async sendSms(phoneNumber: string, message: string): Promise<void> {
    try {
      const result = await this.smsAdapter.send(phoneNumber, message)

      if (!result.success) {
        throw new NotificationFailedException(result.error || 'Failed to send SMS')
      }

      logger.info(`SMS sent successfully to ${phoneNumber}. Message ID: ${result.messageId}`)
    } catch (error) {
      logger.error(`Failed to send SMS to ${phoneNumber}:`, error)
      throw error instanceof NotificationFailedException
        ? error
        : new NotificationFailedException('An unexpected error occurred while sending SMS')
    }
  }

  async sendVerificationCode(phoneNumber: string, code: string): Promise<void> {
    const message = `Your TiltPay verification code is: ${code}. This code will expire in 10 minutes.`
    await this.sendSms(phoneNumber, message)
  }
}
