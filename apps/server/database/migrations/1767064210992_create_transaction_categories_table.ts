import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'transaction_categories'
  protected accountTableName = 'accounts'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id').primary()
      table.string('name', 100).notNullable()
      table.string('book_type', 100).notNullable()
      table
        .integer('default_debit_account_id')
        .unsigned()
        .references('id')
        .inTable(this.accountTableName)
      table
        .integer('default_credit_account_id')
        .unsigned()
        .references('id')
        .inTable(this.accountTableName)

      table.timestamp('created_at', { useTz: true })
      table.timestamp('updated_at', { useTz: true })
      table.timestamp('deleted_at', { useTz: true })
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}
