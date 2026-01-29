import { formatCentsToCurrency } from '@bir-notebook/shared/helpers/currency'
import type { Transaction } from '@/types/transaction'

interface GeneralJournalFooterProps {
  transactions: Transaction[]
}

export function GeneralJournalFooter({
  transactions,
}: GeneralJournalFooterProps) {
  const totalDebits = transactions.reduce((sum, t) => sum + t.amount, 0)
  const totalCredits = transactions.reduce((sum, t) => sum + t.amount, 0)

  return (
    <tfoot>
      <tr className="border-t-2 border-accent bg-muted font-bold">
        <td colSpan={3} className="p-2 text-right">
          Totals:
        </td>
        <td className="p-2 text-right text-success-foreground">
          {formatCentsToCurrency(totalDebits)}
        </td>
        <td className="p-2 text-right text-destructive-foreground">
          {formatCentsToCurrency(totalCredits)}
        </td>
        <td />
      </tr>
    </tfoot>
  )
}
