import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'token_transactions'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id')

      table.string('mint').notNullable()

      table.string('signature').notNullable().unique()
      table.bigInteger('slot').notNullable()
      table.timestamp('block_time', { useTz: true }).nullable()

      table.enum('status', ['indexed', 'fetched', 'failed']).notNullable().defaultTo('indexed')
      table.string('error').nullable()

      table.bigInteger('amount').nullable()
      table.integer('decimals').nullable()
      table.string('from_address').nullable()
      table.string('to_address').nullable()
      table.string('from_token_account').nullable()
      table.string('to_token_account').nullable()

      table.text('raw').nullable()

      table.timestamp('created_at', { useTz: true }).notNullable().defaultTo(this.raw('NOW()'))
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}
