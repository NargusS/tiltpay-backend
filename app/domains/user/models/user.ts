import { DateTime } from 'luxon'
import hash from '@adonisjs/core/services/hash'
import { compose } from '@adonisjs/core/helpers'
import { BaseModel, column, hasMany } from '@adonisjs/lucid/orm'
import { withAuthFinder } from '@adonisjs/auth/mixins/lucid'
import { DbAccessTokensProvider } from '@adonisjs/auth/access_tokens'
import Wallet from '#domains/wallet/models/wallet.model'
import type { HasMany } from '@adonisjs/lucid/types/relations'

const AuthFinder = withAuthFinder(() => hash.use('scrypt'), {
  uids: ['email'],
  passwordColumnName: 'code',
})

export default class User extends compose(BaseModel, AuthFinder) {
  @column({ isPrimary: true })
  declare id: number

  @column()
  declare fullName: string

  @column()
  declare tagname: string

  @column({ columnName: 'phone_number' })
  declare phoneNumber: string

  @column({ serializeAs: null })
  declare code: string

  @column()
  declare verified: boolean

  @column()
  declare verificationToken: string | null

  @column()
  declare attempt: number

  @column.dateTime()
  declare lastAttemptAt: DateTime | null

  @hasMany(() => Wallet, {
    foreignKey: 'userId',
  })
  declare wallet: HasMany<typeof Wallet>

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime | null

  static accessTokens = DbAccessTokensProvider.forModel(User)
}
