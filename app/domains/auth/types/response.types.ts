import { ApiProperty } from '@foadonis/openapi/decorators'

export class MeResponse {
  @ApiProperty({
    type: Number,
    required: true,
    description: 'The ID of the user',
    example: 1,
  })
  declare id: number
  @ApiProperty({
    type: String,
    required: true,
    description: 'The full name of the user',
    example: 'John Doe',
  })
  declare fullName: string
  @ApiProperty({
    type: String,
    required: true,
    description: 'The tag name of the user',
    example: 'john_doe',
  })
  declare tagname: string
  @ApiProperty({
    type: String,
    required: true,
    description: 'The phone number of the user',
    example: '+1234567890',
  })
  declare phoneNumber: string
  @ApiProperty({
    type: Boolean,
    required: true,
    description: 'The verified status of the user',
    example: true,
  })
  declare verified: boolean
  @ApiProperty({
    type: String,
    required: true,
    description: 'The created at date of the user',
    example: '2021-01-01T00:00:00.000Z',
  })
  declare createdAt: string
}
