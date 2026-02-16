import Account from '#models/account'
import Transaction from '#models/transaction'
import { fromCentsToPrice } from '@bir-notebook/shared/helpers/currency'
import { transactionCategoryBookTypes } from '@bir-notebook/shared/models/transaction'
import { DateTime } from 'luxon'

export interface LedgerTransaction {
  id: number
  date: string
  description: string
  referenceNumber?: string
  debitAmount?: number
  creditAmount?: number
  counterpartAccount: {
    code: string
    name: string
  }
  transferGroupId?: string
  transferredAt?: string
  isTransferred?: boolean
}

export interface GeneralLedgerMonth {
  month: string // '2024-01'
  openingBalance: number
  transactions: LedgerTransaction[]
  periodClosing: {
    totalDebits: number
    totalCredits: number
    netAmount: number // positive for debit, negative for credit
    runningBalance: number
    balanceType: 'debit' | 'credit'
  }
}

export interface GeneralLedgerView {
  account: Account
  dateRange: {
    from: string
    to: string
  }
  months: GeneralLedgerMonth[]
  grandTotal: {
    totalDebits: number
    totalCredits: number
    netAmount: number
    finalBalance: number
    balanceType: 'debit' | 'credit'
  }
}

export interface TransferValidationResult {
  isValid: boolean
  errors: string[]
  warnings: string[]
  eligibleTransactions: number[]
  ineligibleTransactions: Array<{
    id: number
    reason: string
  }>
}

export interface TransactionGroup {
  debitAccountId: number
  creditAccountId: number
  transactions: Transaction[]
}

export interface ParentGlTransaction {
  id: number
  description: string
  amount: number
  accountPair: string
  debitAccountId: number
  creditAccountId: number
  targetMonth: string
}

export interface TransferResult {
  parentGlTransactions: ParentGlTransaction[]
  totalTransactions: number
  totalGroups: number
}

export interface TransferSummary {
  transferGroupId: string
  totalTransactions: number
  accountsAffected: Array<{
    account: Account
    debitCount: number
    creditCount: number
    totalDebitAmount: number
    totalCreditAmount: number
  }>
  targetMonths: Array<{
    month: string
    transactionCount: number
    totalAmount: number
  }>
}

export class GeneralLedgerService {
  constructor() {}

  /**
   * Group transactions by account pairs for hierarchical GL structure
   */
  private groupTransactionsByAccounts(transactions: Transaction[]): TransactionGroup[] {
    const groups = transactions.reduce(
      (result, transaction) => {
        const key = `${transaction.debitAccountId}-${transaction.creditAccountId}`

        if (!result[key]) {
          result[key] = {
            debitAccountId: transaction.debitAccountId,
            creditAccountId: transaction.creditAccountId,
            transactions: [],
          }
        }

        result[key].transactions.push(transaction)
        return result
      },
      {} as Record<string, TransactionGroup>
    )

    return Object.values(groups)
  }

  /**
   * Get General Ledger view for a specific account with multi-month grouping
   */
  async getGeneralLedgerView(
    accountId: number,
    dateFrom: Date,
    dateTo: Date,
    userId: number
  ): Promise<GeneralLedgerView> {
    const account = await Account.find(accountId)
    if (!account) {
      throw new Error(`Account with ID ${accountId} not found`)
    }

    const months = this.getMonthsInRange(dateFrom, dateTo)
    const monthData: GeneralLedgerMonth[] = []
    let runningBalance = await this.getOpeningBalance(accountId, dateFrom, userId)

    for (const month of months) {
      const monthTransactions = await this.getMonthTransactions(accountId, month, userId)
      const periodClosing = this.calculatePeriodClosing(monthTransactions, runningBalance)

      monthData.push({
        month,
        openingBalance: runningBalance,
        transactions: monthTransactions,
        periodClosing,
      })

      runningBalance = periodClosing.runningBalance
    }

    return {
      account,
      dateRange: {
        from: dateFrom.toISOString(),
        to: dateTo.toISOString(),
      },
      months: monthData,
      grandTotal: this.calculateGrandTotal(monthData, runningBalance),
    }
  }

  /**
   * Validate transfer eligibility for transactions
   */
  async validateTransferEligibility(
    transactionIds: number[],
    userId: number
  ): Promise<TransferValidationResult> {
    const transactions = await Transaction.query()
      .whereIn('id', transactionIds)
      .andWhere('userId', userId)

    const eligibleTransactions: number[] = []
    const ineligibleTransactions: Array<{ id: number; reason: string }> = []
    const errors: string[] = []
    const warnings: string[] = []

    for (const transaction of transactions) {
      if (!transaction.recordedAt) {
        ineligibleTransactions.push({
          id: transaction.id,
          reason: 'Transaction must be recorded before transfer',
        })
        continue
      }

      if (transaction.transferredToGlAt) {
        ineligibleTransactions.push({
          id: transaction.id,
          reason: 'Transaction already transferred to General Ledger',
        })
        continue
      }

      eligibleTransactions.push(transaction.id)
    }

    const foundIds = transactions.map((t) => t.id)
    const missingIds = transactionIds.filter((id) => !foundIds.includes(id))

    if (missingIds.length > 0) {
      errors.push(`Transactions not found: ${missingIds.join(', ')}`)
    }

    return {
      isValid: eligibleTransactions.length > 0 && errors.length === 0,
      errors,
      warnings,
      eligibleTransactions,
      ineligibleTransactions,
    }
  }

  async transferToGeneralLedger(
    transactionIds: number[],
    targetMonth: string,
    glDescription: string,
    userId: number
  ): Promise<{ status: string; result?: TransferResult; errors?: string[] }> {
    const validation = await this.validateTransferEligibility(transactionIds, userId)

    if (!validation.isValid || validation.eligibleTransactions.length === 0) {
      return {
        status: 'error',
        errors:
          validation.errors.length > 0
            ? validation.errors
            : ['No eligible transactions to transfer'],
      }
    }

    try {
      const sourceTransactions = await Transaction.query()
        .whereIn('id', validation.eligibleTransactions)
        .andWhere('userId', userId)

      const accountGroups = this.groupTransactionsByAccounts(sourceTransactions)

      const parentGlTransactions: ParentGlTransaction[] = []

      for (const group of accountGroups) {
        const totalAmount = group.transactions.reduce((sum, t) => sum + t.amount, 0)

        const generalLedger = await Transaction.create({
          bookType: transactionCategoryBookTypes.generalLedger,
          description: glDescription,
          amount: fromCentsToPrice(totalAmount),
          debitAccountId: group.debitAccountId,
          creditAccountId: group.creditAccountId,
          userId,
          glId: null,
          glPostingMonth: targetMonth,
          categoryId: undefined,
          referenceNumber: undefined,
          vatType: undefined,
        })

        parentGlTransactions.push({
          id: generalLedger.id,
          description: generalLedger.description,
          amount: generalLedger.amount,
          accountPair: `${group.debitAccountId}-${group.creditAccountId}`,
          debitAccountId: group.debitAccountId,
          creditAccountId: group.creditAccountId,
          targetMonth: targetMonth,
        })

        await this.linkChildrenToParent(group.transactions, generalLedger.id, targetMonth)
      }

      const result: TransferResult = {
        parentGlTransactions,
        totalTransactions: sourceTransactions.length,
        totalGroups: accountGroups.length,
      }

      return {
        status: 'success',
        result,
      }
    } catch (error) {
      return {
        status: 'error',
        errors: [error instanceof Error ? error.message : 'Unknown error occurred'],
      }
    }
  }

  /**
   * Get transfer history
   */
  async getTransferHistory(userId: number, transferGroupId?: string): Promise<any[]> {
    if (transferGroupId) {
      // Get specific transfer group - return both parent and children
      return await Transaction.query()
        .where('userId', userId)
        .where(function (query) {
          query
            .where('id', transferGroupId) // Parent GL
            .orWhere('glId', transferGroupId) // Child transactions
        })
        .preload('debitAccount')
        .preload('creditAccount')
        .preload('category')
        .preload('generalLedger')
        .preload('children')
        .orderBy('createdAt', 'desc')
        .exec()
    } else {
      // Return all parent GL transactions (transfer groups)
      return await Transaction.query()
        .where('userId', userId)
        .where('bookType', 'general_ledger')
        .whereNull('glId') // Parent GL only
        .preload('debitAccount')
        .preload('creditAccount')
        .preload('children', (childrenQuery) => {
          childrenQuery.preload('category')
        })
        .orderBy('createdAt', 'desc')
        .exec()
    }
  }

  /**
   * Get opening balance for an account as of a specific date
   */
  private async getOpeningBalance(
    accountId: number,
    asOfDate: Date,
    userId: number
  ): Promise<number> {
    const asOfDateTime = DateTime.fromJSDate(asOfDate)

    // Get both regular recorded transactions and GL parent transactions
    const previousTransactions = await Transaction.query()
      .where('userId', userId)
      .where(function (query) {
        // Include recorded regular transactions
        query.whereNotNull('recordedAt').where('transactionDate', '<', asOfDateTime.toSQLDate()!)

        // OR include GL parent transactions created before this date
        query.orWhere(function (subQuery) {
          subQuery
            .where('bookType', 'general_ledger')
            .whereNull('glId') // Parent GL only
            .where('createdAt', '<', asOfDateTime.toSQLDate()!)
        })
      })
      .where(function (query) {
        query.where('debit_account_id', accountId).orWhere('credit_account_id', accountId)
      })

    let totalDebits = 0
    let totalCredits = 0

    for (const transaction of previousTransactions) {
      if (transaction.debitAccountId === accountId) {
        totalDebits += transaction.amount
      } else {
        totalCredits += transaction.amount
      }
    }

    return totalDebits - totalCredits
  }

  /**
   * Get all transactions for a specific account and month
   */
  private async getMonthTransactions(
    accountId: number,
    month: string,
    userId: number
  ): Promise<LedgerTransaction[]> {
    // Query both parent GL transactions and child transactions
    const transactions = await Transaction.query()
      .where('userId', userId)
      .where('glPostingMonth', month) // Filter by posting month instead of transaction date
      .where(function (query) {
        query.where('debit_account_id', accountId).orWhere('credit_account_id', accountId)
      })
      .preload('debitAccount')
      .preload('creditAccount')
      .preload('children', (childrenQuery) => {
        childrenQuery.preload('category').preload('debitAccount').preload('creditAccount')
      })
      .preload('generalLedger') // For child transactions to get parent description
      .orderBy('created_at', 'asc')
      .orderBy('id', 'asc')

    const ledgerTransactions: LedgerTransaction[] = []

    for (const transaction of transactions) {
      // Show parent GL transactions with their description
      if (transaction.isParentGl) {
        const isDebit = transaction.debitAccountId === accountId
        const counterpartAccount = isDebit ? transaction.creditAccount : transaction.debitAccount

        ledgerTransactions.push({
          id: transaction.id,
          date: transaction.createdAt.toISODate()!, // Use created_at for GL posting date
          description: transaction.description, // Parent description like "Jan Totals sales"
          referenceNumber: undefined,
          debitAmount: isDebit ? transaction.amount : undefined,
          creditAmount: !isDebit ? transaction.amount : undefined,
          counterpartAccount: {
            code: counterpartAccount?.code || '',
            name: counterpartAccount?.name || '',
          },
          transferGroupId: transaction.id.toString(),
          transferredAt: transaction.createdAt.toString(),
          isTransferred: true,
        })
      }
    }

    return ledgerTransactions
  }

  /**
   * Calculate period closing totals
   */
  private calculatePeriodClosing(
    transactions: LedgerTransaction[],
    openingBalance: number
  ): GeneralLedgerMonth['periodClosing'] {
    const totalDebits = transactions
      .filter((t) => t.debitAmount)
      .reduce((sum, t) => sum + t.debitAmount!, 0)

    const totalCredits = transactions
      .filter((t) => t.creditAmount)
      .reduce((sum, t) => sum + t.creditAmount!, 0)

    const netAmount = totalDebits - totalCredits
    const runningBalance = openingBalance + netAmount

    return {
      totalDebits,
      totalCredits,
      netAmount,
      runningBalance,
      balanceType: runningBalance >= 0 ? 'debit' : 'credit',
    }
  }

  /**
   * Calculate grand totals for all months
   */
  private calculateGrandTotal(
    months: GeneralLedgerMonth[],
    finalBalance: number
  ): GeneralLedgerView['grandTotal'] {
    const totalDebits = months.reduce((sum, month) => sum + month.periodClosing.totalDebits, 0)
    const totalCredits = months.reduce((sum, month) => sum + month.periodClosing.totalCredits, 0)
    const netAmount = totalDebits - totalCredits

    return {
      totalDebits,
      totalCredits,
      netAmount,
      finalBalance,
      balanceType: finalBalance >= 0 ? 'debit' : 'credit',
    }
  }

  /**
   * Get array of months in date range
   */
  private getMonthsInRange(dateFrom: Date, dateTo: Date): string[] {
    const months: string[] = []
    let current = DateTime.fromJSDate(dateFrom).startOf('month')
    const end = DateTime.fromJSDate(dateTo).startOf('month')

    while (current <= end) {
      months.push(current.toFormat('yyyy-MM'))
      current = current.plus({ months: 1 })
    }

    return months
  }

  /**
   * Link child transactions to parent GL transaction
   */
  private async linkChildrenToParent(
    transactions: Transaction[],
    parentGlId: number,
    targetMonth: string
  ): Promise<void> {
    await Transaction.query()
      .whereIn(
        'id',
        transactions.map((t) => t.id)
      )
      .update({
        glId: parentGlId,
        transferredToGlAt: DateTime.now(),
        glPostingMonth: targetMonth,
      })
  }
}
