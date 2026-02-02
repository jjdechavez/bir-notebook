import { formatCentsToCurrency } from '@bir-notebook/shared/helpers/currency'
import type { Transaction } from '@/types/transaction'
import { useQuery } from '@tanstack/react-query'
import { tuyau } from '@/main'

type GeneralLedgerProps = {
  transactions: Transaction[]
}

export function GeneralLedger({ transactions }: GeneralLedgerProps) {
  const calculateAccountTotals = (transactions: Transaction[]) => {
    const totals: Record<
      string,
      { debit: number; credit: number; name: string; code: string }
    > = {}

    transactions.forEach((transaction) => {
      if (transaction.debitAccount) {
        const key = transaction.debitAccount.id
        if (!totals[key]) {
          totals[key] = {
            debit: 0,
            credit: 0,
            name: transaction.debitAccount.name,
            code: transaction.debitAccount.code,
          }
        }
        totals[key].debit += transaction.amount
      }

      if (transaction.creditAccount) {
        const key = transaction.creditAccount.id
        if (!totals[key]) {
          totals[key] = {
            debit: 0,
            credit: 0,
            name: transaction.creditAccount.name,
            code: transaction.creditAccount.code,
          }
        }
        totals[key].credit += transaction.amount
      }
    })

    return totals
  }

  const accountTotals = calculateAccountTotals(transactions)
  const accountsArray = Object.entries(accountTotals).map(([id, data]) => ({
    id,
    ...data,
  }))

  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse">
        <thead>
          <tr className="border-b bg-gray-50">
            <th className="text-left p-3">Account Code</th>
            <th className="text-left p-3">Account Name</th>
            <th className="text-right p-3">Total Debits</th>
            <th className="text-right p-3">Total Credits</th>
            <th className="text-right p-3">Balance</th>
          </tr>
        </thead>
        <tbody>
          {accountsArray.map((account, index) => {
            const balance = account.debit - account.credit
            return (
              <tr
                key={account.id}
                className={`border-b ${index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}`}
              >
                <td className="p-3 font-medium">{account.code}</td>
                <td className="p-3">{account.name}</td>
                <td className="p-3 text-right font-medium text-success-foreground">
                  {formatCentsToCurrency(account.debit)}
                </td>
                <td className="p-3 text-right font-medium text-destructive-foreground">
                  {formatCentsToCurrency(account.credit)}
                </td>
                <td
                  className={`p-3 text-right font-medium ${balance >= 0 ? 'text-success-foreground' : 'text-destructive-foreground'}`}
                >
                  {formatCentsToCurrency(Math.abs(balance))}
                </td>
              </tr>
            )
          })}
        </tbody>
        <tfoot>
          <tr className="border-t-2 border-gray-300 bg-gray-100 font-bold">
            <td colSpan={2} className="p-3 text-right">
              Grand Totals:
            </td>
            <td className="p-3 text-right text-success-foreground">
              {formatCentsToCurrency(
                accountsArray.reduce((sum, acc) => sum + acc.debit, 0),
              )}
            </td>
            <td className="p-3 text-right text-destructive-foreground">
              {formatCentsToCurrency(
                accountsArray.reduce((sum, acc) => sum + acc.credit, 0),
              )}
            </td>
            <td className="p-3 text-right">
              {formatCentsToCurrency(
                Math.abs(
                  accountsArray.reduce((sum, acc) => sum + acc.debit, 0) -
                    accountsArray.reduce((sum, acc) => sum + acc.credit, 0),
                ),
              )}
            </td>
          </tr>
        </tfoot>
      </table>
    </div>
  )
}

type ChartOfAccountsProps = {
  onAccountSelect?: (accountId: number) => void
}

export function ChartOfAccounts({ onAccountSelect }: ChartOfAccountsProps) {
  const { data, status } = useQuery(
    tuyau.api['transaction-accounts'].accounts.$get.queryOptions(),
  )

  if (status === 'pending') {
    return (
      <div className="space-y-4">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-300 rounded w-1/4 mb-4"></div>
          <div className="space-y-2">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-3 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  if (!data) return <div>No accounts found</div>

  const groupByFirstLetter = (accounts: (typeof data)['data']) => {
    const grouped: Record<string, (typeof data)['data']> = {}

    accounts.forEach((account) => {
      const firstLetter = account.name.charAt(0).toUpperCase()
      if (!grouped[firstLetter]) {
        grouped[firstLetter] = []
      }
      grouped[firstLetter].push(account)
    })

    return grouped
  }

  const groupedAccounts = groupByFirstLetter(data.data)

  return (
    <div className="space-y-6 space-x-3 grid grid-cols-1 md:grid-cols-3">
      {Object.entries(groupedAccounts)
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([letter, accounts]) => (
          <div key={letter}>
            <h3 className="text-lg font-semibold text-foreground mb-3 border-b pb-1">
              {letter}
            </h3>
            <div className="space-y-2">
              {accounts.map((account) => (
                <div
                  key={account.id}
                  className={`flex items-center p-2 hover:bg-gray-50 rounded cursor-pointer transition-colors ${
                    onAccountSelect
                      ? 'hover:bg-blue-50 hover:border-blue-200'
                      : ''
                  }`}
                  onClick={() => onAccountSelect?.(account.id)}
                >
                  <span className="font-mono text-sm text-muted-foreground w-20">
                    {account.code}
                  </span>
                  <span className="ml-3 text-foreground">{account.name}</span>
                  {onAccountSelect && (
                    <span className="ml-auto text-xs text-accent-foreground">
                      View Ledger →
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>
        ))}
    </div>
  )
}
