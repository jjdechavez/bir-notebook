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
  account: {
    id: number
    code: string
    name: string
    type: string
  }
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
    account: {
      id: number
      code: string
      name: string
    }
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

export interface TransferHistoryItem {
  id: number
  transferGroupId: string
  transferredToGlAt: string
  transactionDate: string
  description: string
  amount: number
  debitAccount: {
    id: number
    code: string
    name: string
  }
  creditAccount: {
    id: number
    code: string
    name: string
  }
  category: {
    name: string
  }
}
