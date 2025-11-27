import { ApiProperty } from '@foadonis/openapi/decorators'

export class Transaction {
  @ApiProperty({
    description: 'The ID of the transaction',
    example: 1,
  })
  declare id: number

  @ApiProperty({
    description: 'The signature of the transaction',
    example: '1234567890',
  })
  declare signature: string

  @ApiProperty({
    description: 'The block time of the transaction',
    example: '2021-01-01T00:00:00.000Z',
  })
  declare createdAt: string

  @ApiProperty({
    description: 'The amount of the transaction in cents',
    example: 1000000,
  })
  declare amount: number

  @ApiProperty({
    description: 'The currency of the transaction (usd)',
    example: 'usd',
  })
  declare currency: 'usd'

  @ApiProperty({
    description: 'The type of the transaction (debit - or credit +)',
    example: 'debit',
  })
  declare type: 'debit' | 'credit'
}

export class TransactionResponse {
  @ApiProperty({
    description: 'The transactions',
    type: [Transaction],
  })
  declare transactions: Transaction[]
}
