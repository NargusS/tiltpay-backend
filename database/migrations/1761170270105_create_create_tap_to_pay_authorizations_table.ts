import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'tap_to_pay_authorizations'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id')
      table.integer('user_id').notNullable().references('id').inTable('users').onDelete('CASCADE')
      table.timestamp('authorized_at').notNullable().defaultTo(this.raw('CURRENT_TIMESTAMP'))
      table.string('secret').notNullable()
      table.enum('status', ['revoked', 'active']).notNullable().defaultTo('active')
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}
