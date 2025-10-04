import type { HttpContext } from '@adonisjs/core/http'
import AuthService from '#domains/auth/services/auth_service'
import { loginValidator } from '#domains/auth/validators/login_validator'
import { createAccountValidator } from '#domains/auth/validators/create_account_validator'
import { inject } from '@adonisjs/core'
import { UserNotFoundException } from '#domains/user/exceptions/user_not_found.exception'
import { TooManyAttemptsException } from '../exceptions/too_many_attempt.exception.js'
import { LoginFailedException } from '../exceptions/login_failed.exception.js'
import { UserNotVerifiedException } from '#domains/user/exceptions/user_not_verified.exception'
import { MissmatchCodeException } from '../exceptions/missmatch_code.exception.js'
import { UserAlreadyExistsException } from '#domains/user/exceptions/user_already_exist.exception'
import { verifyAccountValidator } from '../validators/verify_account.validator.js'

@inject()
export default class AuthController {
  constructor(private auth_service: AuthService) {}

  async login({ auth, request, response }: HttpContext) {
    try {
      const { phoneNumber, code } = await request.validateUsing(loginValidator)
      const user = await this.auth_service.login(phoneNumber, code)
      const generatedToken = await auth.use('api').createToken(user)
      const token = generatedToken.value!.release()
      return response.status(200).json({ access_token: token })
    } catch (error) {
      if (error instanceof UserNotVerifiedException) {
        return response.status(401).json({ message: 'User not verified' })
      }
      if (error instanceof UserNotFoundException) {
        return response.status(404).json({ message: 'User not found' })
      }
      if (error instanceof TooManyAttemptsException) {
        return response.status(429).json({ message: 'Too many attempts' })
      }
      if (error instanceof LoginFailedException) {
        return response.status(401).json({ message: 'Invalid code' })
      }
      return response.status(error.status).json({ message: error.message })
    }
  }

  async createAccount({ request, response }: HttpContext) {
    try {
      const { email, fullName, tagName, code, confirmCode } =
        await request.validateUsing(createAccountValidator)
      await this.auth_service.createAccount(email, fullName, tagName, code, confirmCode)
      return response.status(201).json({ message: 'Account created successfully' })
    } catch (error) {
      if (error instanceof UserAlreadyExistsException) {
        return response.status(400).json({ message: 'User already exists' })
      }
      if (error instanceof MissmatchCodeException) {
        return response.status(400).json({ message: 'Code does not match' })
      }
      return response.status(error.status).json({ message: error.message })
    }
  }

  async verifyAccount({ request, response }: HttpContext) {
    try {
      const { phoneNumber, token } = await request.validateUsing(verifyAccountValidator)
      await this.auth_service.verifyAccount(phoneNumber, token)
      return response.status(200).json({ message: 'Account verified successfully' })
    } catch (error) {
      return response.status(error.status).json({ message: error.message })
    }
  }

  async logout({ auth, response }: HttpContext) {
    try {
      await auth.use('api').invalidateToken()
      return response.status(200).json({ message: 'Logout successful' })
    } catch (error) {
      return response.status(error.status).json({ message: error.message })
    }
  }
}
