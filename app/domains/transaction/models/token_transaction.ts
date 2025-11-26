import { BaseModel, column } from '@adonisjs/lucid/orm'
import { DateTime } from 'luxon'

export default class TokenTransaction extends BaseModel {
  @column({ isPrimary: true })
  declare id: number

  @column()
  declare mint: string

  @column()
  declare signature: string

  @column()
  declare slot: bigint

  @column.dateTime({ columnName: 'block_time' })
  declare blockTime: DateTime | null

  @column()
  declare status: 'indexed' | 'fetched' | 'failed'

  @column()
  declare error?: string | null

  @column()
  declare amount?: string | null

  @column()
  declare decimals?: number | null

  @column({ columnName: 'from_address' })
  declare fromAddress?: string | null

  @column({ columnName: 'to_address' })
  declare toAddress?: string | null

  @column({ columnName: 'from_token_account' })
  declare fromTokenAccount?: string | null

  @column({ columnName: 'to_token_account' })
  declare toTokenAccount?: string | null

  @column()
  declare raw?: string | null

  @column.dateTime({ columnName: 'created_at' })
  declare createdAt: DateTime

  @column.dateTime({ columnName: 'updated_at' })
  declare updatedAt: DateTime
}
