import Transaction from '#models/transaction'
import TransactionCategory from '#models/transaction_category'
import { CreateTransactionPayload, UpdateTransactionData } from '#validators/transaction'
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

    const netIncome = totalIncome - totalExpenses
    return {
      totalIncome,
      totalExpenses,
      netIncome,
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
}
