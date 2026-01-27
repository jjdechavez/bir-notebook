import { formatCentsToCurrency } from '@bir-notebook/shared/helpers/currency'
import { getChartOfAccounts } from '../utils'
import type { Transaction } from '@/types/transaction'

type CashReceiptsFooterProps = {
  transactions: Transaction[]
  columnCount?: number
}

const DEFAULT_COLUMN_COUNT = 6

export function CashReceiptsFooter({
  transactions,
  columnCount = DEFAULT_COLUMN_COUNT,
}: CashReceiptsFooterProps) {
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
    }),
  )

  const allAccountColumns = [...displayAccounts, ...placeholderAccounts]

  // Calculate totals
  const totalDebitCash = transactions
    .filter(
      (t) =>
        t.debitAccount?.name?.toLowerCase().includes('cash') ||
        t.debitAccount?.code === '1000',
    )
    .reduce((sum, t) => sum + t.amount, 0)

  const accountTotals = allAccountColumns.map((account) => {
    const total = transactions
      .filter((t) => t.creditAccount?.id === account.id)
      .reduce((sum, t) => sum + t.amount, 0)
    return { account, total }
  })

  const sundryTotal = transactions
    .filter(
      (t) =>
        t.creditAccount?.name &&
        !t.creditAccount.name.toLowerCase().includes('cash') &&
        !allAccountColumns.some((acc) => acc.id === t.creditAccount?.id),
    )
    .reduce((sum, t) => sum + t.amount, 0)

  const totalCreditAccounts =
    accountTotals.reduce((sum, { total }) => sum + total, 0) + sundryTotal
  const grandTotal = totalDebitCash

  // Calculate total number of columns for colspan
  // Date + Description + Reference = 3 columns
  const staticColumns = 3
  // +4 for Debit Cash, Credit Sundry, Credit Sundry Amount, Actions

  return (
    <tfoot>
      <tr className="bg-gray-100 font-bold">
        <td colSpan={staticColumns + 1} className="p-3 text-right">
          Totals:
        </td>

        {/* Debit Cash Total */}
        <td className="p-3 text-right text-green-600">
          {formatCentsToCurrency(totalDebitCash)}
        </td>

        {/* Credit Account Totals */}
        {accountTotals.map(({ account, total }) => (
          <td
            key={account.id}
            className="p-3 text-right text-destructive-foreground"
          >
            {formatCentsToCurrency(total)}
          </td>
        ))}

        {/* Credit Sundry Total */}
        <td className="p-3 text-right text-destructive-foreground">
          {formatCentsToCurrency(sundryTotal)}
        </td>

        {/* Credit Sundry Amount Total */}
        <td className="p-3 text-right text-destructive-foreground">
          {formatCentsToCurrency(sundryTotal)}
        </td>

        {/* Actions column (empty) */}
        <td></td>
      </tr>

      {/* Grand Total Verification Row */}
      <tr className="bg-gray-50 font-semibold border-t">
        <td
          colSpan={staticColumns + allAccountColumns.length + 2}
          className="p-3 text-right"
        >
          Grand Total (Debit = Credit):
        </td>
        <td className="p-3 text-right text-green-600">
          {formatCentsToCurrency(grandTotal)}
        </td>
        <td className="p-3 text-right text-destructive-foreground">
          {formatCentsToCurrency(totalCreditAccounts)}
        </td>
        <td></td>
      </tr>
    </tfoot>
  )
}
