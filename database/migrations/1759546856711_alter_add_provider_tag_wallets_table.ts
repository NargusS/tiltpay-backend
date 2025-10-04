import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'wallets'

  async up() {
    this.schema.alterTable(this.tableName, (table) => {
      table.string('provider').notNullable()
      table.string('tag').notNullable()
    })
  }

  async down() {
    this.schema.alterTable(this.tableName, (table) => {
      table.dropColumn('provider')
      table.dropColumn('tag')
    })
  }
}
