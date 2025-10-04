import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'wallets'

  async up() {
    this.schema.alterTable(this.tableName, (table) => {
      table.string('grid_user_id').notNullable()
      table.string('address').notNullable()
    })
  }

  async down() {
    this.schema.alterTable(this.tableName, (table) => {
      table.dropColumn('grid_user_id')
      table.dropColumn('address')
    })
  }
}
