import { DateTime } from 'luxon'
import { BaseModel, belongsTo, column, computed, hasMany } from '@adonisjs/lucid/orm'
import User from './user.js'
import type { BelongsTo, HasMany } from '@adonisjs/lucid/types/relations'
import { toCents } from '@bir-notebook/shared/helpers/currency'
import TransactionCategory from './transaction_category.js'
import Account from './account.js'
import {
  type TransactionVatType,
  type TransactionCategoryBookType,
  calculateVatAmount,
} from '@bir-notebook/shared/models/transaction'

export default class Transaction extends BaseModel {
  @column({ isPrimary: true })
  declare id: number

  @column()
  declare userId: number

  @belongsTo(() => User)
  declare user: BelongsTo<typeof User>

  @column()
  declare categoryId: number

  @belongsTo(() => TransactionCategory, {
    foreignKey: 'categoryId',
  })
  declare category: BelongsTo<typeof TransactionCategory>

  @column({
    prepare: (value) => toCents(value),
  })
  declare amount: number

  @column()
  declare description: string

  @column.dateTime()
  declare transactionDate: DateTime

  @column()
  declare creditAccountId: number

  @belongsTo(() => Account, {
    foreignKey: 'creditAccountId',
  })
  declare creditAccount: BelongsTo<typeof Account>

  @column()
  declare debitAccountId: number

  @belongsTo(() => Account, {
    foreignKey: 'debitAccountId',
  })
  declare debitAccount: BelongsTo<typeof Account>

  @column()
  declare bookType: TransactionCategoryBookType

  @column()
  declare referenceNumber: string

  @column()
  declare vatType: TransactionVatType

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @computed()
  get vatAmount() {
    return calculateVatAmount(this.amount, this.vatType)
  }

  @column.dateTime()
  declare recordedAt: DateTime | null

  @column.dateTime()
  declare transferredToGlAt: DateTime | null

  @column()
  declare glPostingMonth: string | null

  @column()
  declare glId: number | null

  @belongsTo(() => Transaction, {
    foreignKey: 'glId',
  })
  declare generalLedger: BelongsTo<typeof Transaction>

  @hasMany(() => Transaction, {
    foreignKey: 'glId',
  })
  declare children: HasMany<typeof Transaction>

  @computed()
  get isParentGl(): boolean {
    return this.bookType === 'general_ledger' && this.glId === null
  }

  @computed()
  get isChildTransaction(): boolean {
    return this.glId !== null
  }
}
