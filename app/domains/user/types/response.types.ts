import { ApiProperty } from '@foadonis/openapi/decorators'

export class UserInformation {
  @ApiProperty({
    type: Number,
    description: 'The ID of the user',
  })
  declare id: number
  @ApiProperty({
    type: String,
    description: 'The full name of the user',
  })
  declare fullName: string
  @ApiProperty({
    type: String,
    description: 'The tag name of the user',
  })
  declare tagname: string
}

export class ListUsersResponse {
  @ApiProperty({
    type: [UserInformation],
    description: 'The list of users',
  })
  declare users: UserInformation[]
}
