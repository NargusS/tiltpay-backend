import { ApiProperty } from '@foadonis/openapi/decorators'

export class ErrorResponse {
  @ApiProperty({
    type: String,
    required: true,
    description: 'The name of the error',
    example: 'Error',
  })
  declare name: string
  @ApiProperty({
    type: String,
    required: true,
    description: 'The message of the error',
    example: 'Error message',
  })
  declare message: string
  @ApiProperty({
    type: String,
    required: true,
    description: 'The code of the error',
    example: 'ERROR_CODE',
  })
  declare code: string
}
