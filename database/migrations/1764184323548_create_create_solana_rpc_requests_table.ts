import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'solana_rpc_requests'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id')
      table.bigInteger('timestamp').notNullable().index()
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}
