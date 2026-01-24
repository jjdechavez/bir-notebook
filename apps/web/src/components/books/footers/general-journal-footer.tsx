import { formatCentsToCurrency } from '@bir-notebook/shared/helpers/currency'
import type { Transaction } from '@/types/transaction'

interface GeneralJournalFooterProps {
  transactions: Transaction[]
}

export function GeneralJournalFooter({ transactions }: GeneralJournalFooterProps) {
  const totalDebits = transactions.reduce((sum, t) => sum + t.amount, 0)
  const totalCredits = transactions.reduce((sum, t) => sum + t.amount, 0)

  return (
    <table className="w-full">
      <tfoot>
        <tr className="border-t-2 border-gray-300 bg-gray-100 font-bold">
          <td colSpan={3} className="p-3 text-right">
            Totals:
          </td>
          <td className="p-3 text-right text-green-600">
            {formatCentsToCurrency(totalDebits)}
          </td>
          <td className="p-3 text-right text-red-600">
            {formatCentsToCurrency(totalCredits)}
          </td>
        </tr>
      </tfoot>
    </table>
  )
}