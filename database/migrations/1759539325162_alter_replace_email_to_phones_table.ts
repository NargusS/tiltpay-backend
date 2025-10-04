import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'users'

  async up() {
    this.schema.alterTable(this.tableName, (table) => {
      table.dropUnique(['email'])
      table.dropColumn('email')
      table.unique(['tagname'])
      table.string('phone_number').notNullable().unique()
    })
  }

  async down() {
    this.schema.alterTable(this.tableName, (table) => {
      table.dropUnique(['phone_number'])
      table.dropColumn('phone_number')
      table.dropUnique(['tagname'])
      table.string('email').notNullable().unique()
    })
  }
}
