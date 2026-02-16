import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'transactions'

  async up() {
    this.schema.alterTable(this.tableName, (table) => {
      table.string('transfer_group_id', 50).nullable()
      table.timestamp('transferred_to_gl_at', { useTz: true }).nullable()
      table.string('gl_posting_month', 7).nullable() // Format: YYYY-MM
    })
  }

  async down() {
    this.schema.alterTable(this.tableName, (table) => {
      table.dropColumn('transfer_group_id')
      table.dropColumn('transferred_to_gl_at')
      table.dropColumn('gl_posting_month')
    })
  }
}
