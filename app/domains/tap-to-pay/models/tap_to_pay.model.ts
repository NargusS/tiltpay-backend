import { DateTime } from 'luxon'
import { BaseModel, beforeSave, belongsTo, column } from '@adonisjs/lucid/orm'
import User from '#domains/user/models/user'
import type { BelongsTo } from '@adonisjs/lucid/types/relations'
import { randomBytes } from 'node:crypto'

export class TapToPayRequest extends BaseModel {
  @column({ isPrimary: true })
  declare id: number

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime

  @column()
  declare fromUserId: number

  @column({ serializeAs: null })
  declare toUserId: number | null

  @column()
  declare amount: number

  @column()
  declare currency: string

  @column()
  declare status: 'pending' | 'approved' | 'cancelled' | 'failed'

  @belongsTo(() => User, {
    foreignKey: 'fromUserId',
  })
  declare fromUser: BelongsTo<typeof User>

  @belongsTo(() => User, {
    foreignKey: 'toUserId',
  })
  declare toUser: BelongsTo<typeof User> | null
}

export class TapToPayAuthorization extends BaseModel {
  @column({ isPrimary: true })
  declare id: number

  @column()
  declare userId: number

  @column()
  declare secret: string

  @column()
  declare status: 'revoked' | 'active'

  @belongsTo(() => User, {
    foreignKey: 'userId',
  })
  declare user: BelongsTo<typeof User>

  @column.dateTime({ autoCreate: true })
  declare authorizedAt: DateTime

  @beforeSave()
  static async generateSecret(authorization: TapToPayAuthorization) {
    authorization.secret = randomBytes(32).toString('hex')
  }
}
