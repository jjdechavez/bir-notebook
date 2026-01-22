import { formatCentsToCurrency } from '@bir-notebook/shared/helpers/currency'
import type { Transaction } from '@/types/transaction'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Check, X } from 'lucide-react'

interface GeneralJournalProps {
  transactions: Transaction[]
  selectedIds?: number[]
  onSelectionChange?: (selectedIds: number[]) => void
}

export function GeneralJournal({ 
  transactions, 
  selectedIds = [], 
  onSelectionChange 
}: GeneralJournalProps) {
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
            <th className="text-center p-3 w-12">
              <Checkbox
                checked={selectedIds.length === transactions.length}
                onCheckedChange={(checked) => {
                  if (checked) {
                    onSelectionChange?.(transactions.map(t => t.id))
                  } else {
                    onSelectionChange?.([])
                  }
                }}
              />
            </th>
            <th className="text-center p-3 w-24">Actions</th>
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
                <div className="flex items-center gap-2">
                  <div className="flex-1 space-y-1">
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
                  <Badge 
                    variant={transaction.recordedAt ? "default" : "outline"}
                    className={transaction.recordedAt ? "bg-green-100 text-green-800 hover:bg-green-200" : ""}
                  >
                    {transaction.recordedAt ? "Recorded" : "Draft"}
                  </Badge>
                </div>
              </td>
              <td className="p-3 text-right font-medium text-green-600">
                {formatCentsToCurrency(transaction.amount)}
              </td>
              <td className="p-3 text-right font-medium text-red-600">
                {formatCentsToCurrency(transaction.amount)}
              </td>
              <td className="p-3 text-center">
                <Checkbox
                  checked={selectedIds.includes(transaction.id)}
                  onCheckedChange={(checked) => {
                    if (checked) {
                      onSelectionChange?.([...selectedIds, transaction.id])
                    } else {
                      onSelectionChange?.(selectedIds.filter(id => id !== transaction.id))
                    }
                  }}
                />
              </td>
              <td className="p-3">
                <div className="flex justify-center">
                  {transaction.recordedAt ? (
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-orange-600 hover:text-orange-700 hover:bg-orange-50"
                      onClick={() => console.log('Undo record transaction:', transaction.id)}
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  ) : (
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                      onClick={() => console.log('Record transaction:', transaction.id)}
                    >
                      <Check className="w-4 h-4" />
                    </Button>
                  )}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
        <tfoot>
          <tr className="border-t-2 border-gray-300 bg-gray-100 font-bold">
            <td colSpan={4} className="p-3 text-right">
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