import { DateTime } from 'luxon'
import { BaseModel, belongsTo, column } from '@adonisjs/lucid/orm'
import { type TransactionCategoryBookType } from '@bir-notebook/shared/models/transaction'
import Account from './account.js'
import type { BelongsTo } from '@adonisjs/lucid/types/relations'

export default class TransactionCategory extends BaseModel {
  @column({ isPrimary: true })
  declare id: number

  @column()
  declare name: string

  @column()
  declare bookType: TransactionCategoryBookType

  @column()
  declare defaultDebitAccountId: number

  @belongsTo(() => Account, {
    foreignKey: 'defaultDebitAccountId',
  })
  declare defaultDebitAccount: BelongsTo<typeof Account>

  @column()
  declare defaultCreditAccountId: number

  @belongsTo(() => Account, {
    foreignKey: 'defaultCreditAccountId',
  })
  declare defaultCreditAccount: BelongsTo<typeof Account>

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime

  @column.dateTime({ serializeAs: null })
  declare deletedAt: DateTime | null
}
