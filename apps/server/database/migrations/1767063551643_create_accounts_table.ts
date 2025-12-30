import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'accounts'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id').primary()
      table.string('code', 10).unique().notNullable()
      table.string('name', 100).notNullable()
      table.string('type').notNullable()

      table.timestamp('created_at', { useTz: true })
      table.timestamp('updated_at', { useTz: true })
      table.timestamp('deleted_at', { useTz: true })
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}
