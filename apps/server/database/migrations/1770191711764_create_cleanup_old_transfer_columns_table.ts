import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'transactions'

  async up() {
    this.schema.alterTable(this.tableName, (table) => {
      table.dropColumn('transfer_group_id')
      table.integer('category_id').nullable().alter()
    })
  }

  async down() {
    this.schema.alterTable(this.tableName, (table) => {
      table.string('transfer_group_id', 50).nullable()
      table.integer('category_id').notNullable().alter()
    })
  }
}
