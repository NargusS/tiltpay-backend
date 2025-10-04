import type { SmsAdapter, SendSmsResult } from './sms_adapter.interface.js'
import logger from '@adonisjs/core/services/logger'

export class MockSmsAdapter implements SmsAdapter {
  async send(phoneNumber: string, message: string): Promise<SendSmsResult> {
    logger.info(`[MOCK SMS] Sending to ${phoneNumber}: ${message}`)

    // Simulate network delay
    await new Promise((resolve) => setTimeout(resolve, 100))

    // Simulate 95% success rate
    const success = Math.random() > 0.05

    if (success) {
      const messageId = `mock_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
      logger.info(`[MOCK SMS] Message sent successfully. ID: ${messageId}`)
      return {
        success: true,
        messageId,
      }
    } else {
      logger.error(`[MOCK SMS] Failed to send message to ${phoneNumber}`)
      return {
        success: false,
        error: 'Mock SMS service unavailable',
      }
    }
  }
}
