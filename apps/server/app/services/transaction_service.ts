import Account from '#models/account'
import Transaction from '#models/transaction'
import TransactionCategory from '#models/transaction_category'
import { CreateTransactionPayload, UpdateTransactionData } from '#validators/transaction'
import db from '@adonisjs/lucid/services/db'
import {
  transactionCategoryBookTypes,
  transactionVatTypes,
} from '@bir-notebook/shared/models/transaction'
import { DateTime } from 'luxon'

export class TransactionService {
  constructor() {}

  async createTransaction(data: CreateTransactionPayload) {
    const category = await TransactionCategory.find(data.categoryId)
    if (!category) {
      return { status: 'not_found', message: 'Transaction category not found' } as const
    }

    if (data.debitAccountId === data.creditAccountId) {
      return {
        status: 'bad_request',
        message: 'Debit and credit accounts must be different',
      } as const
    }

    const bookType = category.bookType

    const transaction = await Transaction.create({
      userId: data.userId,
      categoryId: data.categoryId,
      amount: data.amount,
      description: data.description,
      transactionDate: DateTime.fromJSDate(data.transactionDate),
      debitAccountId: data.debitAccountId,
      creditAccountId: data.creditAccountId,
      bookType,
      referenceNumber: data.referenceNumber,
      vatType: data.vatType || transactionVatTypes.vatExempt,
    })

    return {
      status: 'success',
      data: transaction,
    } as const
  }

  async paginate(page = 1, limit = 10, filters: Record<string, any>) {
    const query = Transaction.query()
      .preload('category')
      .preload('debitAccount')
      .preload('creditAccount')
      .where('userId', filters.userId)

    if (filters.bookType) {
      query.where('bookType', filters.bookType)
    }
    if (filters.categoryId) {
      query.where('categoryId', filters.categoryId)
    }
    if (filters.dateFrom) {
      query.where('transactionDate', '>=', filters.dateFrom)
    }
    if (filters.dateTo) {
      query.where('transactionDate', '<=', filters.dateTo)
    }
    if (filters.search) {
      query
        .whereILike('description', `%${filters.search}%`)
        .orWhereILike('referenceNumber', `%${filters.search}%`)
    }
    if (filters?.record) {
      const recordType = filters.record
      query.if(recordType === 'draft', (rtQuery) => {
        rtQuery.whereNull('recordedAt')
      })
      query.if(recordType === 'recorded', (rtQuery) => {
        rtQuery.whereNotNull('recordedAt')
      })
    }

    const transactions = await query.orderBy('transactionDate', 'desc').paginate(page, limit)
    return transactions
  }

  async findById(id: number, opts: { userId?: number }) {
    return Transaction.query()
      .preload('category')
      .preload('debitAccount')
      .preload('creditAccount')
      .if(opts.userId, (query) => {
        query.where('userId', opts.userId!)
      })
      .where('id', id)
      .first()
  }

  async summary(userId: number) {
    const totalIncomeAmount = await Transaction.query()
      .sum('amount')
      .where('bookType', transactionCategoryBookTypes.cashReceiptJournal)
      .andWhere('userId', userId)

    const totalIncome = +totalIncomeAmount[0].$extras.sum

    const totalExpensesAmount = await Transaction.query()
      .sum('amount')
      .where('bookType', transactionCategoryBookTypes.cashDisbursementJournal)
      .andWhere('userId', userId)

    const totalExpenses = +totalExpensesAmount[0].$extras.sum

    const chartOfAccounts = await this.userChartOfAccountsQuery(userId)
    const totalChartOfAccounts = chartOfAccounts.length

    const netIncome = totalIncome - totalExpenses
    return {
      totalIncome,
      totalExpenses,
      netIncome,
      totalChartOfAccounts,
    }
  }

  async updateTransaction(id: number, updateWith: UpdateTransactionData) {
    const transaction = await Transaction.find(id)
    if (!transaction) {
      return { status: 'not_found', message: 'Transaction not found' } as const
    }

    const category = await TransactionCategory.find(updateWith.categoryId)
    if (!category) {
      return { status: 'not_found', message: 'Transaction category not found' } as const
    }

    if (updateWith.debitAccountId === updateWith.creditAccountId) {
      return {
        status: 'bad_request',
        message: 'Debit and credit accounts must be different',
      } as const
    }

    transaction.merge({
      ...updateWith,
      bookType: category.bookType,
      transactionDate: DateTime.fromJSDate(updateWith.transactionDate),
    })

    await transaction.save()
    return {
      status: 'updated',
      data: transaction,
    } as const
  }

  userChartOfAccountsQuery(userId: number) {
    return db
      .query()
      .from('transactions')
      .select('debit_account_id as accountId')
      .where('user_id', userId)
      .union((query) => {
        query.from('transactions').select('credit_account_id as accountId').where('user_id', userId)
      })
  }

  async getUsedChartOfAccounts(userId: number) {
    const rawAccountIds: Array<{ accountId: number }> = await this.userChartOfAccountsQuery(userId)
    const accountIds = rawAccountIds.map((raw) => raw.accountId)

    const accounts = await Account.query().whereIn('id', accountIds).andWhereNull('deletedAt')

    return accounts
  }

  async recordTransaction(transactionId: number) {
    const transaction = await Transaction.find(transactionId)

    if (!transaction) {
      return {
        status: 'not_found',
        message: `Transaction not found with ${transactionId} ID`,
      } as const
    }

    transaction.recordedAt = DateTime.now()
    await transaction.save()

    return {
      status: 'success',
      message: `Transaction has been recorded`,
      data: transaction,
    } as const
  }

  async undoRecordTransaction(transactionId: number) {
    const transaction = await Transaction.find(transactionId)

    if (!transaction) {
      return {
        status: 'not_found',
        message: `Transaction not found with ${transactionId} ID`,
      } as const
    }

    transaction.recordedAt = null
    await transaction.save()

    return {
      status: 'success',
      message: `Transaction record has been undo`,
      data: transaction,
    } as const
  }

  async bulkRecordTransactions(transactionIds: number[], bulkBy = 20) {
    const results = []

    for (let i = 0; i < transactionIds.length; i += bulkBy) {
      const batch = transactionIds.slice(i, i + bulkBy)

      const batchResults = await Promise.allSettled(
        batch.map((transactionId) => this.recordTransaction(transactionId))
      )

      for (const [index, result] of batchResults.entries()) {
        const transactionId = batch[index]

        if (result.status === 'fulfilled') {
          results.push(result.value)
        } else {
          results.push({
            status: 'error',
            message: `Failed to record transaction ${transactionId}`,
            transactionId,
          })
        }
      }
    }

    const successful = results.filter((r) => r.status === 'success')
    const failed = results.filter((r) => r.status !== 'success')

    return {
      status: failed.length === 0 ? 'success' : 'partial',
      message: `Recorded ${successful.length} transactions${failed.length > 0 ? `, ${failed.length} failed` : ''}`,
      data: results,
      summary: {
        total: transactionIds.length,
        successful: successful.length,
        failed: failed.length,
      },
    } as const
  }

  async bulkUndoRecordTransactions(transactionIds: number[], bulkBy = 20) {
    const results = []

    for (let i = 0; i < transactionIds.length; i += bulkBy) {
      const batch = transactionIds.slice(i, i + bulkBy)

      const batchResults = await Promise.allSettled(
        batch.map((transactionId) => this.undoRecordTransaction(transactionId))
      )

      for (const [index, result] of batchResults.entries()) {
        const transactionId = batch[index]

        if (result.status === 'fulfilled') {
          results.push(result.value)
        } else {
          results.push({
            status: 'error',
            message: `Failed to undo record transaction ${transactionId}`,
            transactionId,
          })
        }
      }
    }

    const successful = results.filter((r) => r.status === 'success')
    const failed = results.filter((r) => r.status !== 'success')

    return {
      status: failed.length === 0 ? 'success' : 'partial',
      message: `Recorded ${successful.length} transactions${failed.length > 0 ? `, ${failed.length} failed` : ''}`,
      data: results,
      summary: {
        total: transactionIds.length,
        successful: successful.length,
        failed: failed.length,
      },
    } as const
  }
}
