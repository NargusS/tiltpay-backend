import { UserNotFoundException } from '#domains/user/exceptions/user_not_found.exception'
import { UserService } from '#domains/user/services/user.service'
import { inject } from '@adonisjs/core'
import User from '#domains/user/models/user'
import { UserAlreadyExistsException } from '#domains/user/exceptions/user_already_exist.exception'
import { MissmatchCodeException } from '#domains/auth/exceptions/missmatch_code.exception'
import { TooManyAttemptsException } from '#domains/auth/exceptions/too_many_attempt.exception'
import { UserNotVerifiedException } from '#domains/user/exceptions/user_not_verified.exception'
import { UnabledToVerifyException } from '#domains/auth/exceptions/unabled_to_verify.exception'
import hash from '@adonisjs/core/services/hash'
import NotificationService from '#domains/notification/services/notification.service'
import { WalletService } from '#domains/wallet/services/wallet.service'

@inject()
export default class AuthService {
  constructor(
    private user_service: UserService,
    private wallet_service: WalletService,
    private notification_service: NotificationService
  ) {}

  async login(phoneNumber: string, code: string): Promise<User> {
    const user = await this.user_service.get_by_phone_number(phoneNumber)
    if (!user) {
      throw new UserNotFoundException()
    }
    if (!user.verified) {
      throw new UserNotVerifiedException()
    }
    if (user.attempt >= 3) {
      throw new TooManyAttemptsException()
    }
    const verified = await hash.verify(user.code, code)
    if (!verified) {
      await this.user_service.update_attempt(user.id, user.attempt + 1)
      throw new MissmatchCodeException()
    }
    await this.user_service.update_attempt(user.id, 0)
    return user
  }

  async createAccount(phoneNumber: string, fullName: string, tagName: string, code: string) {
    const user = await this.user_service.get_by_phone_number(phoneNumber)
    if (user) {
      throw new UserAlreadyExistsException()
    }
    const verificationCode = 111111
    const newUser = await this.user_service.create(
      fullName,
      tagName,
      phoneNumber,
      code,
      verificationCode
    )
    await this.wallet_service.create(newUser.id)
    await this.notification_service.sendVerificationCode(phoneNumber, verificationCode.toString())
    return newUser
  }

  async verifyAccount(phoneNumber: string, token: string) {
    const user = await this.user_service.get_by_phone_number(phoneNumber)
    if (!user) {
      throw new UserNotFoundException()
    }
    if (user.verificationToken !== token) {
      throw new UnabledToVerifyException()
    }
    user.verified = true
    user.verificationToken = null
    await user.save()
    return user
  }
}
