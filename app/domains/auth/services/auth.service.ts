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
import { DateTime } from 'luxon'

@inject()
export default class AuthService {
  // Cooldown duration in minutes based on attempt count
  private readonly COOLDOWN_PERIODS = [1, 5, 15]

  constructor(
    private user_service: UserService,
    private wallet_service: WalletService,
    private notification_service: NotificationService
  ) {}

  /**
   * Calculate cooldown period based on attempt count
   * After 3 failed attempts: 1 minute
   * After 6 failed attempts: 5 minutes
   * After 9+ failed attempts: 15 minutes
   */
  private getCooldownMinutes(attempt: number): number {
    if (attempt < 3) return 0 // No cooldown yet
    if (attempt < 6) return this.COOLDOWN_PERIODS[0] // 1 minute
    if (attempt < 9) return this.COOLDOWN_PERIODS[1] // 5 minutes
    return this.COOLDOWN_PERIODS[2] // 15 minutes
  }

  /**
   * Check if user is in cooldown period and return remaining seconds
   * Returns 0 if no cooldown is active
   */
  private getRemainingCooldown(user: User): number {
    // No cooldown if less than 3 attempts or no last attempt recorded
    if (!user.lastAttemptAt || user.attempt < 3) {
      return 0
    }

    const now = DateTime.now()
    const lastAttempt = user.lastAttemptAt
    if (!lastAttempt) {
      return 0
    }
    const cooldownMinutes = this.getCooldownMinutes(user.attempt)

    // No cooldown period if attempt count doesn't warrant it
    if (cooldownMinutes === 0) {
      return 0
    }

    const cooldownEnd = lastAttempt.plus({ minutes: cooldownMinutes })

    if (now < cooldownEnd) {
      return Math.ceil(cooldownEnd.diff(now, 'seconds').seconds)
    }

    return 0
  }

  async login(phoneNumber: string, code: string): Promise<User> {
    const user = await this.user_service.get_by_phone_number(phoneNumber)
    if (!user) {
      throw new UserNotFoundException()
    }
    if (!user.verified) {
      throw new UserNotVerifiedException()
    }

    // Check if user is in cooldown period
    const remainingCooldown = this.getRemainingCooldown(user)
    if (remainingCooldown > 0) {
      throw new TooManyAttemptsException(remainingCooldown)
    }

    const verified = await hash.verify(user.code, code)
    if (!verified) {
      await this.user_service.update_attempt(user.id, user.attempt + 1)
      throw new MissmatchCodeException()
    }

    // Reset attempts only on successful login
    await this.user_service.reset_attempt(user.id)
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
