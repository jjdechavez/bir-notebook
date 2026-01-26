import vine from '@vinejs/vine'
import { Infer } from '@vinejs/vine/types'
import {
  transactionCategoryBookTypes,
  transactionVatTypes,
} from '@bir-notebook/shared/models/transaction'

export const createTransactionValidator = vine.compile(
  vine.object({
    categoryId: vine.number().exists(async (db, value) => {
      const exist = await db
        .from('transaction_categories')
        .where('id', value)
        .whereNull('deleted_at')
        .first()
      return !!exist
    }),
    amount: vine.number().positive(),
    description: vine.string().maxLength(500),
    transactionDate: vine.date({ formats: ['YYYY-MM-DD', 'x'] }),
    debitAccountId: vine.number().exists(async (db, value) => {
      const exist = await db.from('accounts').where('id', value).whereNull('deleted_at').first()
      return !!exist
    }),
    creditAccountId: vine.number().exists(async (db, value) => {
      const exist = await db.from('accounts').where('id', value).whereNull('deleted_at').first()
      return !!exist
    }),
    referenceNumber: vine.string().maxLength(50).optional(),
    vatType: vine.enum(Object.values(transactionVatTypes)).optional(),
  })
)

export type CreateTransactionPayload = Infer<typeof createTransactionValidator> & { userId: number }

export const transactionListValidator = vine.compile(
  vine.object({
    page: vine.number().optional(),
    limit: vine.number().optional(),
    bookType: vine.enum(Object.values(transactionCategoryBookTypes)).optional(),
    categoryId: vine.number().optional(),
    dateFrom: vine.date().optional(),
    dateTo: vine.date().optional(),
    search: vine.string().optional(),
    record: vine.string().optional(),
  })
)

export const updateTransactionValidator = vine.compile(
  vine.object({
    categoryId: vine.number().exists(async (db, value) => {
      const exist = await db
        .from('transaction_categories')
        .where('id', value)
        .whereNull('deleted_at')
        .first()
      return !!exist
    }),
    amount: vine.number().positive(),
    description: vine.string().maxLength(500).optional(),
    transactionDate: vine.date({ formats: ['YYYY-MM-DD', 'x'] }),
    debitAccountId: vine.number().exists(async (db, value) => {
      const exist = await db.from('accounts').where('id', value).whereNull('deleted_at').first()
      return !!exist
    }),
    creditAccountId: vine.number().exists(async (db, value) => {
      const exist = await db.from('accounts').where('id', value).whereNull('deleted_at').first()
      return !!exist
    }),
    referenceNumber: vine.string().maxLength(50).optional(),
    vatType: vine.enum(Object.values(transactionVatTypes)).optional(),
  })
)

export type UpdateTransactionData = Infer<typeof updateTransactionValidator>

export const bulkRecordTransactionValidator = vine.compile(
  vine.object({
    transactionIds: vine.array(vine.number()),
  })
)
