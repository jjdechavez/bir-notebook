import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'transactions'
  protected userTableName = 'users'
  protected transactionCategoryTableName = 'transaction_categories'
  protected accountTableName = 'accounts'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id').primary()
      table.integer('user_id').unsigned().references('id').inTable(this.userTableName).notNullable()
      table
        .integer('category_id')
        .unsigned()
        .references('id')
        .inTable(this.transactionCategoryTableName)
        .notNullable()
      table.integer('amount').notNullable()
      table.text('description')
      table.timestamp('transaction_date', { useTz: true })
      table
        .integer('debit_account_id')
        .unsigned()
        .references('id')
        .inTable(this.accountTableName)
        .notNullable()
      table
        .integer('credit_account_id')
        .unsigned()
        .references('id')
        .inTable(this.accountTableName)
        .notNullable()
      table.string('book_type', 100).notNullable()
      table.string('reference_number')
      table.string('vat_type', 100)
      table.timestamp('created_at', { useTz: true })

      table.check('?? <> ??', ['debit_account_id', 'credit_account_id'], 'check_debit_not_credit')
      table.check('amount > 0', [], 'check_amount_positive')
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}
