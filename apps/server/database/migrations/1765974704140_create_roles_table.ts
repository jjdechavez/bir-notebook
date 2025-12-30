import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'roles'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id').primary()
      table.string('name', 100).notNullable()

      table.timestamp('created_at', { useTz: true })
      table.timestamp('updated_at', { useTz: true })
    })

    this.schema.alterTable('users', (table) => {
      table.integer('role_id').unsigned().references('id').inTable(this.tableName)
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}
