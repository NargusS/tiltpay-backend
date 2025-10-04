import { UserNotFoundException } from '#domains/user/exceptions/user_not_found.exception'
import { UserService } from '#domains/user/services/user.service'
import { inject } from '@adonisjs/core'
import User from '#domains/user/models/user'
import { UserAlreadyExistsException } from '#domains/user/exceptions/user_already_exist.exception'
import { MissmatchCodeException } from '../exceptions/missmatch_code.exception.js'
import { TooManyAttemptsException } from '../exceptions/too_many_attempt.exception.js'
import { UserNotVerifiedException } from '#domains/user/exceptions/user_not_verified.exception'
import { UnabledToVerifyException } from '../exceptions/unabled_to_verify.exception.js'

@inject()
export default class AuthService {
  constructor(private user_service: UserService) {}

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
    if (user.code !== code) {
      await this.user_service.update_attempt(user.id, user.attempt + 1)
      throw new MissmatchCodeException()
    }
    await this.user_service.update_attempt(user.id, 0)
    return user
  }

  async createAccount(
    phoneNumber: string,
    fullName: string,
    tagName: string,
    code: string,
    confirmCode: string
  ) {
    const user = await this.user_service.get_by_phone_number(phoneNumber)
    if (user) {
      throw new UserAlreadyExistsException()
    }
    if (code !== confirmCode) {
      throw new MissmatchCodeException()
    }
    const verificationCode = Math.floor(100000 + Math.random() * 900000) // 6 digits 000000 - 999999
    const newUser = await this.user_service.create(
      fullName,
      tagName,
      phoneNumber,
      code,
      verificationCode
    )
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
