import { DateTime } from 'luxon'
import { BaseModel, belongsTo, column } from '@adonisjs/lucid/orm'
import type { BelongsTo } from '@adonisjs/lucid/types/relations'
import Wallet from '#domains/wallet/models/wallet.model'
import {
  TransactionType,
  TransactionStatus,
  Network,
} from '#domains/transaction/types/transaction.types'

export default class Transaction extends BaseModel {
  @column({ isPrimary: true })
  declare id: number

  @column()
  declare type: TransactionType

  @column()
  declare status: TransactionStatus

  @column({ columnName: 'from_wallet_id' })
  declare fromWalletId: number | null

  @column({ columnName: 'to_wallet_id' })
  declare toWalletId: number | null

  @column()
  declare amount: number

  @column()
  declare currency: string

  @column()
  declare description: string | null

  @column({ columnName: 'tx_hash' })
  declare txHash: string | null

  @column()
  declare network: Network | null

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime

  @column.dateTime()
  declare completedAt: DateTime | null

  @belongsTo(() => Wallet, {
    foreignKey: 'fromWalletId',
  })
  declare fromWallet: BelongsTo<typeof Wallet>

  @belongsTo(() => Wallet, {
    foreignKey: 'toWalletId',
  })
  declare toWallet: BelongsTo<typeof Wallet>
}
