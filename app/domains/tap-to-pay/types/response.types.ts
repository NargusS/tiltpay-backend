import { ApiProperty } from '@foadonis/openapi/decorators'

export class CreateTapToPayRequestResponse {
  @ApiProperty({
    description: 'The ID of the request',
    example: 1,
  })
  declare id: number

  @ApiProperty({
    description: 'The amount of the request',
    example: 100,
  })
  declare amount: number

  @ApiProperty({
    description: 'The currency of the request',
    example: 'USD',
  })
  declare currency: string
}

export class CreateTapToPayAuthorizationResponse {
  @ApiProperty({
    description: 'The secret of the authorization',
    example: '1234567890',
  })
  declare secret: string
}

export class ApproveTapToPayRequestResponse {
  @ApiProperty({
    description: 'The ID of the request',
    example: 1,
  })
  declare id: number
  @ApiProperty({
    description: 'The amount of the request',
    example: 100,
  })
  declare amount: number
  @ApiProperty({
    description: 'The currency of the request',
    example: 'USD',
  })
  declare currency: string
}
