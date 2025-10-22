import type { HttpContext } from '@adonisjs/core/http'
import AuthService from '#domains/auth/services/auth.service'
import { LoginValidator } from '#domains/auth/validators/login.validator'
import { CreateAccountValidator } from '#domains/auth/validators/create_account.validator'
import { inject } from '@adonisjs/core'
import { UserNotFoundException } from '#domains/user/exceptions/user_not_found.exception'
import { TooManyAttemptsException } from '#domains/auth/exceptions/too_many_attempt.exception'
import { UserNotVerifiedException } from '#domains/user/exceptions/user_not_verified.exception'
import { UserAlreadyExistsException } from '#domains/user/exceptions/user_already_exist.exception'
import { VerifyAccountValidator } from '#domains/auth/validators/verify_account.validator'
import { ApiBody, ApiHeader, ApiOperation, ApiResponse } from '@foadonis/openapi/decorators'
import {
  CreateAccountResponseSchema,
  LoginResponseSchema,
  LogoutResponseSchema,
  VerifyAccountResponseSchema,
} from '#domains/auth/validators/response'
import { InvalidCredentialsException } from '#domains/user/exceptions/invalid_credentials.exception'
import { UnabledToVerifyException } from '#domains/auth/exceptions/unabled_to_verify.exception'
import { ErrorResponse } from '#shared/error.types'
import { MissmatchCodeException } from '../exceptions/missmatch_code.exception.js'
import { MeResponse } from '#domains/auth/types/response.types'

@ApiResponse({
  status: 500,
  description: 'Internal server error',
  type: ErrorResponse,
})
@inject()
export default class AuthController {
  constructor(private auth_service: AuthService) {}

  @ApiOperation({
    summary: 'Login',
    description: 'Login to account',
  })
  @ApiBody({
    type: () => LoginValidator,
  })
  @ApiResponse({
    status: 200,
    description: 'Login successful',
    type: () => LoginResponseSchema,
  })
  @ApiResponse({
    status: 412,
    description: 'User not verified',
    type: ErrorResponse,
  })
  @ApiResponse({
    status: 429,
    description: 'Too many attempts',
    type: ErrorResponse,
  })
  @ApiResponse({
    status: 401,
    description: 'Invalid credentials',
    type: ErrorResponse,
  })
  @ApiResponse({
    status: 404,
    description: 'User not found',
    type: ErrorResponse,
  })
  async login({ auth, request, response }: HttpContext) {
    try {
      const { phoneNumber, code } = await request.validateUsing(LoginValidator)
      const user = await this.auth_service.login(phoneNumber, code)
      const generatedToken = await auth.use('api').createToken(user)
      const token = generatedToken.value!.release()
      return response.status(200).json({ access_token: token })
    } catch (error) {
      console.log(error)
      if (error instanceof UserNotVerifiedException) {
        return response.status(412).json({
          message: 'User not verified',
          code: 'USER_NOT_VERIFIED',
          name: 'User not verified',
        })
      }
      if (error instanceof UserNotFoundException) {
        return response.status(404).json({
          message: 'User not found',
          code: 'USER_NOT_FOUND',
          name: 'User not found',
        })
      }
      if (error instanceof TooManyAttemptsException) {
        return response.status(429).header('Retry-After', error.retryAfter.toString()).json({
          message: 'Too many attempts. Please try again later.',
          code: 'TOO_MANY_ATTEMPTS',
          name: 'Too many attempts',
          retry_after: error.retryAfter,
        })
      }
      if (error instanceof InvalidCredentialsException) {
        return response.status(401).json({
          message: 'Invalid credentials',
          code: 'INVALID_CREDENTIALS',
          name: 'Invalid credentials',
        })
      }
      if (error instanceof MissmatchCodeException) {
        return response.status(412).json({
          message: 'Code does not match',
          code: 'CODE_DOES_NOT_MATCH',
          name: 'Code does not match',
        })
      }
      return response.status(500).json({
        message: 'Internal server error',
        code: 'INTERNAL_SERVER_ERROR',
        name: 'Internal server error',
      })
    }
  }

  @ApiOperation({
    summary: 'Create account',
    description: 'Create a new account',
  })
  @ApiBody({
    type: () => CreateAccountValidator,
  })
  @ApiResponse({
    status: 201,
    description: 'Account created successfully',
    type: () => CreateAccountResponseSchema,
  })
  @ApiResponse({
    status: 409,
    description: 'User already exists',
    type: ErrorResponse,
  })
  @ApiResponse({
    status: 412,
    description: 'Code does not match',
    type: ErrorResponse,
  })
  @ApiResponse({
    status: 422,
    description: 'Validation error',
    type: ErrorResponse,
  })
  async createAccount({ request, response }: HttpContext) {
    try {
      const { phoneNumber, fullName, tagName, code } =
        await request.validateUsing(CreateAccountValidator)
      await this.auth_service.createAccount(phoneNumber, fullName, tagName, code)
      return response.status(201).json({ message: 'Account created successfully' })
    } catch (error) {
      if (error instanceof UserAlreadyExistsException) {
        return response.status(error.status).json(error)
      }
      return response.status(error.status).json(error)
    }
  }

  @ApiOperation({
    summary: 'Verify account',
    description: 'Verify account with otp code phone',
  })
  @ApiBody({
    type: () => VerifyAccountValidator,
  })
  @ApiResponse({
    status: 200,
    description: 'Account verified successfully',
    type: () => VerifyAccountResponseSchema,
  })
  @ApiResponse({
    status: 404,
    description: 'User not found',
    type: ErrorResponse,
  })
  @ApiResponse({
    status: 401,
    description: 'Unabled to verify',
    type: ErrorResponse,
  })
  async verifyAccount({ request, response }: HttpContext) {
    try {
      const { phoneNumber, token } = await request.validateUsing(VerifyAccountValidator)
      await this.auth_service.verifyAccount(phoneNumber, token)
      return response.status(200).json({ message: 'Account verified successfully' })
    } catch (error) {
      if (error instanceof UnabledToVerifyException) {
        return response.status(error.status).json(error)
      }
      if (error instanceof UserNotFoundException) {
        return response.status(error.status).json(error)
      }
      return response.status(error.status).json(error)
    }
  }

  @ApiHeader({
    name: 'Authorization',
    description: 'Bearer token',
    required: true,
  })
  @ApiOperation({
    summary: 'Logout',
    description: 'Logout from account',
  })
  @ApiResponse({
    status: 200,
    description: 'Logout successful',
    type: () => LogoutResponseSchema,
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized',
    type: ErrorResponse,
  })
  async logout({ auth, response }: HttpContext) {
    try {
      await auth.use('api').invalidateToken()
      return response.status(200).json({ message: 'Logout successful' })
    } catch (error) {
      return response.status(error.status).json({ message: error.message })
    }
  }

  @ApiOperation({
    summary: 'Get user',
    description: 'Get user',
  })
  @ApiHeader({
    name: 'Authorization',
    description: 'Bearer token',
    required: true,
  })
  @ApiResponse({
    status: 200,
    description: 'User',
    type: MeResponse,
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized',
    type: ErrorResponse,
  })
  async me({ auth, response }: HttpContext) {
    try {
      const user = auth.user!
      return response.status(200).json({
        id: user.id,
        fullName: user.fullName,
        tagname: user.tagname,
        phoneNumber: user.phoneNumber,
        verified: user.verified,
        createdAt: user.createdAt,
      })
    } catch (error) {
      return response.status(error.status).json({ message: error.message })
    }
  }
}
