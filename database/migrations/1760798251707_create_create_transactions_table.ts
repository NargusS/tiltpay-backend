import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'transactions'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id').primary()

      // Transaction type and status
      table
        .enum('type', ['deposit', 'withdraw', 'transfer'])
        .notNullable()
        .comment('Type of transaction')
      table
        .enum('status', ['pending', 'completed', 'failed'])
        .notNullable()
        .defaultTo('pending')
        .comment('Transaction status')

      // Wallets involved
      table
        .integer('from_wallet_id')
        .unsigned()
        .nullable()
        .references('id')
        .inTable('wallets')
        .onDelete('CASCADE')
        .comment('Source wallet (null for deposits)')
      table
        .integer('to_wallet_id')
        .unsigned()
        .nullable()
        .references('id')
        .inTable('wallets')
        .onDelete('CASCADE')
        .comment('Destination wallet (null for withdrawals)')

      // Amount and currency
      table.decimal('amount', 19, 4).notNullable().comment('Transaction amount')
      table.string('currency', 10).notNullable().defaultTo('EUR').comment('Currency code')

      // Description
      table.text('description').nullable().comment('Transaction description')

      // Blockchain info
      table.string('tx_hash').nullable().comment('Blockchain transaction hash')
      table
        .enum('network', ['solana', 'ethereum', 'polygon'])
        .nullable()
        .comment('Blockchain network')

      // Timestamps
      table.timestamp('created_at').notNullable().defaultTo(this.now())
      table.timestamp('updated_at').notNullable().defaultTo(this.now())
      table.timestamp('completed_at').nullable().comment('When transaction was completed')

      // Indexes for performance
      table.index(['from_wallet_id'], 'idx_from_wallet')
      table.index(['to_wallet_id'], 'idx_to_wallet')
      table.index(['type', 'status'], 'idx_type_status')
      table.index(['created_at'], 'idx_created_at')
      table.index(['tx_hash'], 'idx_tx_hash')
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}
