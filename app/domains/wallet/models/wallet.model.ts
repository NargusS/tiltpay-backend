import User from '#domains/user/models/user'
import { BaseModel, belongsTo, column } from '@adonisjs/lucid/orm'
import type { BelongsTo } from '@adonisjs/lucid/types/relations'
import { DateTime } from 'luxon'

export default class Wallet extends BaseModel {
  @column({ isPrimary: true })
  declare id: number

  @column()
  declare publicKey: string

  @column()
  declare privateKey: string

  @column()
  declare userId: number

  @column()
  declare provider: string

  @column()
  declare tag: string

  @belongsTo(() => User)
  declare user: BelongsTo<typeof User>

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime
}
