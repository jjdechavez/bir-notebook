import { formatCentsToCurrency } from '@bir-notebook/shared/helpers/currency'
import { getChartOfAccounts } from '../utils'
import type { Transaction } from '@/types/transaction'

interface CashDisbursementsFooterProps {
  transactions: Transaction[]
  columnCount?: number
}

const DEFAULT_COLUMN_COUNT = 6

export function CashDisbursementsFooter({
  transactions,
  columnCount = DEFAULT_COLUMN_COUNT,
}: CashDisbursementsFooterProps) {
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
  const totalCreditCash = transactions
    .filter(
      (t) =>
        t.creditAccount?.name?.toLowerCase().includes('cash') ||
        t.creditAccount?.code === '1000',
    )
    .reduce((sum, t) => sum + t.amount, 0)

  const accountTotals = allAccountColumns.map((account) => {
    const total = transactions
      .filter((t) => t.debitAccount?.id === account.id)
      .reduce((sum, t) => sum + t.amount, 0)
    return { account, total }
  })

  const sundryTotal = transactions
    .filter(
      (t) =>
        t.debitAccount?.name &&
        !t.debitAccount.name.toLowerCase().includes('cash') &&
        !allAccountColumns.some((acc) => acc.id === t.debitAccount?.id),
    )
    .reduce((sum, t) => sum + t.amount, 0)

  const totalDebitAccounts =
    accountTotals.reduce((sum, { total }) => sum + total, 0) + sundryTotal
  const grandTotal = totalCreditCash

  // Calculate total number of columns for colspan
  // Date + Description + Reference = 3 columns
  const staticColumns = 3
  // +4 for Credit Cash, Debit Sundry, Debit Sundry Amount, Actions

  return (
    <tfoot>
      <tr className="bg-gray-100 font-bold">
        <td colSpan={staticColumns + 1} className="p-3 text-right">
          Totals:
        </td>

        {/* Credit Cash Total */}
        <td className="p-3 text-right text-destructive-foreground">
          {formatCentsToCurrency(totalCreditCash)}
        </td>

        {/* Debit Account Totals */}
        {accountTotals.map(({ account, total }) => (
          <td key={account.id} className="p-3 text-right text-green-600">
            {formatCentsToCurrency(total)}
          </td>
        ))}

        {/* Debit Sundry Total */}
        <td className="p-3 text-right text-green-600">
          {formatCentsToCurrency(sundryTotal)}
        </td>

        {/* Debit Sundry Amount Total */}
        <td className="p-3 text-right text-green-600">
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
          Grand Total (Credit = Debit):
        </td>
        <td className="p-3 text-right text-destructive-foreground">
          {formatCentsToCurrency(grandTotal)}
        </td>
        <td className="p-3 text-right text-green-600">
          {formatCentsToCurrency(totalDebitAccounts)}
        </td>
        <td></td>
      </tr>
    </tfoot>
  )
}
