import { UserNotFoundException } from '#domains/user/exceptions/user_not_found.exception'
import { UserService } from '#domains/user/services/user.service'
import { inject } from '@adonisjs/core'
import { LoginFailedException } from '../exceptions/login_failed.exception.js'
import User from '#domains/user/models/user'
import { UserAlreadyExistsException } from '#domains/user/exceptions/user_already_exist.exception'
import { MissmatchCodeException } from '../exceptions/missmatch_code.exception.js'
import { TooManyAttemptsException } from '../exceptions/too_many_attempt.exception.js'
import { UserNotVerifiedException } from '#domains/user/exceptions/user_not_verified.exception'

@inject()
export default class AuthService {
  constructor(private user_service: UserService) {}

  async login(email: string, code: string): Promise<User> {
    const user = await this.user_service.get_by_email(email)
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
      throw new LoginFailedException()
    }
    await this.user_service.update_attempt(user.id, 0)
    return user
  }

  async createAccount(
    email: string,
    fullName: string,
    tagName: string,
    code: string,
    confirmCode: string
  ) {
    const user = await this.user_service.get_by_email(email)
    if (user) {
      throw new UserAlreadyExistsException()
    }
    if (code !== confirmCode) {
      throw new MissmatchCodeException()
    }
    const newUser = await this.user_service.create(fullName, tagName, email, code)
    return newUser
  }

  async logout() {
    throw new Error('Not implemented')
  }
}
