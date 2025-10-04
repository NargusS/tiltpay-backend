export class UnabledToVerifyException extends Error {
  status = 400
  code = 'UNABLED_TO_VERIFY'
  message = 'Unabled to verify'
  constructor() {
    super('Unabled to verify')
  }
}
