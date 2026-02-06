import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'transactions'

  async up() {
    this.schema.alterTable(this.tableName, (table) => {
      table
        .integer('gl_id')
        .nullable()
        .references('id')
        .inTable('transactions')
        .onDelete('SET NULL')

      table.index(['gl_id'], 'idx_transactions_gl_id')
      table.index(['book_type', 'gl_id'], 'idx_transactions_gl_parent')
    })
  }

  async down() {
    this.schema.alterTable(this.tableName, (table) => {
      table.dropIndex('idx_transactions_gl_id')
      table.dropIndex('idx_transactions_gl_parent')
      table.dropColumn('gl_id')
      table.integer('category_id').notNullable().alter()
    })
  }
}
