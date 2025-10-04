export interface SendSmsResult {
  success: boolean
  messageId?: string
  error?: string
}

export interface SmsAdapter {
  send(phoneNumber: string, message: string): Promise<SendSmsResult>
}
