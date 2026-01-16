import { formatCentsToCurrency } from '@bir-notebook/shared/helpers/currency'
import type { Transaction } from '@/types/transaction'

interface GeneralJournalProps {
  transactions: Transaction[]
}

export function GeneralJournal({ transactions }: GeneralJournalProps) {
  const totalDebits = transactions.reduce((sum, t) => sum + t.amount, 0)
  const totalCredits = transactions.reduce((sum, t) => sum + t.amount, 0)

  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse">
        <thead>
          <tr className="border-b bg-gray-50">
            <th className="text-left p-3 w-24">Date</th>
            <th className="text-left p-3">Description</th>
            <th className="text-right p-3 w-32">Debit</th>
            <th className="text-right p-3 w-32">Credit</th>
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
                <div className="space-y-1">
                  <p className="font-medium">
                    {transaction.debitAccount?.name &&
                    transaction.creditAccount?.name
                      ? `${transaction.debitAccount.name} / ${transaction.creditAccount.name}`
                      : transaction.debitAccount?.name ||
                        transaction.creditAccount?.name}
                  </p>
                  <p className="text-sm text-gray-500 pl-4">
                    {transaction.description}
                  </p>
                </div>
              </td>
              <td className="p-3 text-right font-medium text-green-600">
                {formatCentsToCurrency(transaction.amount)}
              </td>
              <td className="p-3 text-right font-medium text-red-600">
                {formatCentsToCurrency(transaction.amount)}
              </td>
            </tr>
          ))}
        </tbody>
        <tfoot>
          <tr className="border-t-2 border-gray-300 bg-gray-100 font-bold">
            <td colSpan={2} className="p-3 text-right">
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
    </div>
  )
}