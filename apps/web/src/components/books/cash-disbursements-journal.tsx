import { formatCentsToCurrency } from '@bir-notebook/shared/helpers/currency'
import type { Transaction } from '@/types/transaction'
import { getChartOfAccounts } from './utils'

interface CashDisbursementsJournalProps {
  transactions: Transaction[]
  columnCount: number
}

export function CashDisbursementsJournal({
  transactions,
  columnCount,
}: CashDisbursementsJournalProps) {
  const chartOfAccounts = getChartOfAccounts(transactions)
  const cashAccount = chartOfAccounts.find(
    (account) =>
      account.name.toLowerCase().includes('cash') || account.code === '1000',
  )
  const otherAccounts = chartOfAccounts.filter(
    (account) =>
      (!account.name.toLowerCase().includes('cash') &&
        account.code !== '1000') ||
      account.id !== cashAccount?.id,
  )

  const accountColumnsToShow = columnCount - 3
  const displayAccounts = otherAccounts.slice(0, accountColumnsToShow)
  const remainingAccountSlots = accountColumnsToShow - displayAccounts.length
  const placeholderAccounts = Array.from(
    { length: remainingAccountSlots },
    (_, i) => ({
      id: `placeholder-${i}`,
      name: `Account ${i + 1}`,
      code: `000${i + 1}`,
    }),
  )

  const allAccountColumns = [...displayAccounts, ...placeholderAccounts]

  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse">
        <thead>
          <tr className="border-b bg-gray-50">
            <th className="text-left p-3 w-24">Date</th>
            <th className="text-left p-3">Description</th>
            <th className="text-left p-3 w-32">Reference</th>
            <th className="text-right p-3 w-32">Credit Cash</th>
            {allAccountColumns.map((account) => (
              <th key={account.id} className="text-right p-3 text-xs">
                <div>{account.name}</div>
                <div className="text-gray-500">(Debit)</div>
              </th>
            ))}
            <th className="text-right p-3 w-32">Debit Sundry</th>
            <th className="text-right p-3 w-32">Debit Sundry Amount</th>
          </tr>
        </thead>
        <tbody>
          {transactions.map((transaction, index) => (
            <tr
              key={transaction.id}
              className={`border-b ${index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}`}
            >
              <td className="p-3">
                {new Date(transaction.transactionDate).toLocaleDateString()}
              </td>
              <td className="p-3">
                <div>
                  <p className="font-medium">{transaction.description}</p>
                  <p className="text-sm text-gray-500">#{transaction.id}</p>
                </div>
              </td>
              <td className="p-3">{transaction.referenceNumber || '-'}</td>
              <td className="p-3 text-right font-medium text-red-600">
                {transaction.creditAccount?.name
                  ?.toLowerCase()
                  .includes('cash')
                  ? formatCentsToCurrency(transaction.amount)
                  : '-'}
              </td>
              {allAccountColumns.map((account) => (
                <td
                  key={account.id}
                  className="p-3 text-right font-medium text-green-600"
                >
                  {transaction.debitAccount?.id === account.id
                    ? formatCentsToCurrency(transaction.amount)
                    : '-'}
                </td>
              ))}
              <td className="p-3 text-right">
                {transaction.debitAccount?.name &&
                !transaction.debitAccount.name
                  .toLowerCase()
                  .includes('cash') &&
                !allAccountColumns.some(
                  (acc) => acc.id === transaction.debitAccount?.id,
                )
                  ? transaction.debitAccount.name
                  : '-'}
              </td>
              <td className="p-3 text-right font-medium text-green-600">
                {transaction.debitAccount?.name &&
                !transaction.debitAccount.name
                  .toLowerCase()
                  .includes('cash') &&
                !allAccountColumns.some(
                  (acc) => acc.id === transaction.debitAccount?.id,
                )
                  ? formatCentsToCurrency(transaction.amount)
                  : '-'}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}