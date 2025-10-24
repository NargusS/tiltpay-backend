import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'tap_to_pay_requests'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id')
      table.timestamp('created_at').notNullable().defaultTo(this.raw('NOW()'))
      table.timestamp('updated_at').notNullable().defaultTo(this.raw('NOW()'))
      table
        .integer('from_user_id')
        .notNullable()
        .references('id')
        .inTable('users')
        .onDelete('CASCADE')
      table.integer('to_user_id').nullable().references('id').inTable('users').onDelete('CASCADE')
      table.decimal('amount', 10, 2).notNullable()
      table.string('currency').notNullable()
      table
        .enum('status', ['pending', 'approved', 'cancelled', 'failed'])
        .notNullable()
        .defaultTo('pending')
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}
