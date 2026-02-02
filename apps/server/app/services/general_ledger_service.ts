import Account from '#models/account'
import Transaction from '#models/transaction'
import { cuid } from '@adonisjs/core/helpers'
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

  /**
   * Transfer transactions to General Ledger
   */
  async transferToGeneralLedger(
    transactionIds: number[],
    targetMonth: string,
    userId: number
  ): Promise<{ status: string; summary: TransferSummary; errors?: string[] }> {
    const validation = await this.validateTransferEligibility(transactionIds, userId)

    if (!validation.isValid || validation.eligibleTransactions.length === 0) {
      return {
        status: 'error',
        summary: {} as TransferSummary,
        errors:
          validation.errors.length > 0
            ? validation.errors
            : ['No eligible transactions to transfer'],
      }
    }

    const transferGroupId = `transfer_${cuid()}`

    const results = await Promise.allSettled(
      validation.eligibleTransactions.map((transactionId) =>
        this.transferSingleTransaction(transactionId, targetMonth, transferGroupId)
      )
    )

    const successful = results.filter((r) => r.status === 'fulfilled').length
    const failed = results.filter((r) => r.status === 'rejected').length

    if (failed > 0) {
      const errors = results
        .filter((r): r is PromiseRejectedResult => r.status === 'rejected')
        .map((r) => r.reason as string)

      return {
        status: successful > 0 ? 'partial' : 'error',
        summary: {} as TransferSummary,
        errors,
      }
    }

    const summary = await this.generateTransferSummary(
      validation.eligibleTransactions,
      targetMonth,
      transferGroupId
    )

    return {
      status: 'success',
      summary,
    }
  }

  /**
   * Get transfer history
   */
  async getTransferHistory(userId: number, transferGroupId?: string): Promise<any[]> {
    const query = Transaction.query()
      .where('userId', userId)
      .whereNotNull('transferGroupId')
      .preload('debitAccount')
      .preload('creditAccount')
      .preload('category')

    if (transferGroupId) {
      query.where('transferGroupId', transferGroupId)
    }

    return query.orderBy('transferredToGlAt', 'desc').exec()
  }

  /**
   * Get opening balance for an account as of a specific date
   */
  private async getOpeningBalance(
    accountId: number,
    asOfDate: Date,
    userId: number
  ): Promise<number> {
    const previousTransactions = await Transaction.query()
      .where('userId', userId)
      .whereNotNull('recordedAt')
      .where('transactionDate', '<', DateTime.fromJSDate(asOfDate).toSQLDate()!)
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
    const [year, monthNumber] = month.split('-').map(Number)
    const startDate = DateTime.fromObject({ year, month: monthNumber, day: 1 })
    const endDate = startDate.endOf('month')

    const transactions = await Transaction.query()
      .where('userId', userId)
      .whereNotNull('recordedAt')
      .where('transactionDate', '>=', startDate.toSQLDate()!)
      .where('transactionDate', '<=', endDate.toSQLDate()!)
      .where(function (query) {
        query.where('debit_account_id', accountId).orWhere('credit_account_id', accountId)
      })
      .preload('debitAccount')
      .preload('creditAccount')
      .orderBy('transactionDate', 'asc')
      .orderBy('id', 'asc')

    const ledgerTransactions: LedgerTransaction[] = []

    for (const transaction of transactions) {
      const isDebit = transaction.debitAccountId === accountId
      const counterpartAccount = isDebit ? transaction.creditAccount : transaction.debitAccount

      ledgerTransactions.push({
        id: transaction.id,
        date: transaction.transactionDate.toISODate()!,
        description: transaction.description,
        referenceNumber: transaction.referenceNumber,
        debitAmount: isDebit ? transaction.amount : undefined,
        creditAmount: !isDebit ? transaction.amount : undefined,
        counterpartAccount: {
          code: counterpartAccount?.code || '',
          name: counterpartAccount?.name || '',
        },
        transferGroupId: transaction.transferGroupId || undefined,
        transferredAt: transaction.transferredToGlAt?.toString(),
        isTransferred: !!transaction.transferredToGlAt,
      })
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
   * Transfer a single transaction
   */
  private async transferSingleTransaction(
    transactionId: number,
    targetMonth: string,
    transferGroupId: string
  ): Promise<void> {
    const transaction = await Transaction.find(transactionId)
    if (!transaction) {
      throw new Error(`Transaction ${transactionId} not found`)
    }

    transaction.transferGroupId = transferGroupId
    transaction.transferredToGlAt = DateTime.now()
    transaction.glPostingMonth = targetMonth

    await transaction.save()
  }

  /**
   * Generate transfer summary
   */
  private async generateTransferSummary(
    transactionIds: number[],
    targetMonth: string,
    transferGroupId: string
  ): Promise<TransferSummary> {
    const transactions = await Transaction.query()
      .whereIn('id', transactionIds)
      .preload('debitAccount')
      .preload('creditAccount')

    // Group by accounts affected
    const accountsMap = new Map<number, any>()

    for (const transaction of transactions) {
      // Handle debit account
      if (!accountsMap.has(transaction.debitAccountId)) {
        accountsMap.set(transaction.debitAccountId, {
          account: transaction.debitAccount,
          debitCount: 0,
          creditCount: 0,
          totalDebitAmount: 0,
          totalCreditAmount: 0,
        })
      }
      const debitAccountData = accountsMap.get(transaction.debitAccountId)!
      debitAccountData.debitCount++
      debitAccountData.totalDebitAmount += transaction.amount

      // Handle credit account
      if (!accountsMap.has(transaction.creditAccountId)) {
        accountsMap.set(transaction.creditAccountId, {
          account: transaction.creditAccount,
          debitCount: 0,
          creditCount: 0,
          totalDebitAmount: 0,
          totalCreditAmount: 0,
        })
      }
      const creditAccountData = accountsMap.get(transaction.creditAccountId)!
      creditAccountData.creditCount++
      creditAccountData.totalCreditAmount += transaction.amount
    }

    return {
      transferGroupId,
      totalTransactions: transactionIds.length,
      accountsAffected: Array.from(accountsMap.values()),
      targetMonths: [
        {
          month: targetMonth,
          transactionCount: transactionIds.length,
          totalAmount: transactions.reduce((sum, t) => sum + t.amount, 0),
        },
      ],
    }
  }
}
