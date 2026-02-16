import type { Transaction, TransactionAccount } from '@/types/transaction'

export const getChartOfAccounts = (transactions: Transaction[]) => {
  const accounts = new Set()
  transactions.forEach((transaction) => {
    if (transaction.debitAccount) {
      accounts.add(JSON.stringify(transaction.debitAccount))
    }
    if (transaction.creditAccount) {
      accounts.add(JSON.stringify(transaction.creditAccount))
    }
  })
  return Array.from(accounts).map(
    (account) => JSON.parse(account as string) as TransactionAccount,
  )
}

export const getColorClasses = (color: string) => {
  const colors = {
    green: 'border-success bg-success/50 dark:bg-success/30',
    red: 'border-destructive/20 dark:border-destructive bg-destructive/20 dark:bg-destructive/30',
    blue: 'border-blue-200 bg-blue-50',
    purple: 'border-purple-200 bg-purple-50',
  }
  return colors[color as keyof typeof colors] || colors.blue
}
