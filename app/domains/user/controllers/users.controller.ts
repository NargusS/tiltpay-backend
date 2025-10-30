import { UserService } from '#domains/user/services/user.service'
import { HttpContext } from '@adonisjs/core/http'
import { ApiHeader, ApiOperation, ApiResponse } from '@foadonis/openapi/decorators'
import { ListUsersResponse } from '#domains/user/types/response.types'
import { ErrorResponse } from '#shared/error.types'
import { inject } from '@adonisjs/core'

@ApiHeader({
  name: 'Authorization',
  description: 'Bearer token',
  required: true,
})
@ApiResponse({
  status: 401,
  description: 'Unauthorized',
  type: ErrorResponse,
})
@ApiResponse({
  status: 500,
  description: 'Internal server error',
  type: ErrorResponse,
})
@inject()
export default class UsersController {
  constructor(private readonly userService: UserService) {}

  @ApiOperation({
    summary: 'List all users',
    description: 'List all users',
  })
  @ApiResponse({
    status: 200,
    description: 'Users',
    type: ListUsersResponse,
  })
  async findAll({ response }: HttpContext) {
    const users = await this.userService.list_all_users()
    return response.status(200).json(users)
  }
}
