import { Columns } from 'lucide-react'

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../ui/select'
import { formatCentsToCurrency } from '@bir-notebook/shared/helpers/currency'
import { getColorClasses } from './utils'

type BookCountedColumnFilterProps = {
  count: number
  setCount: (count: number) => void
}
export function BookCountedColumnFilter(props: BookCountedColumnFilterProps) {
  return (
    <div className="flex items-center gap-4 mb-6">
      <div className="flex items-center gap-2">
        <Columns className="h-4 w-4" />
        <label className="text-sm font-medium">Counted Columns:</label>
        <Select
          value={props.count.toString()}
          onValueChange={(value) => props.setCount(parseInt(value))}
        >
          <SelectTrigger className="w-20">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="6">6</SelectItem>
            <SelectItem value="10">10</SelectItem>
            <SelectItem value="14">14</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div className="text-sm text-gray-500">
        {props.count} counted columns (Reference + Cash + {props.count - 3}{' '}
        chart of accounts + Sundry + Sundry Amount)
      </div>
    </div>
  )
}

type BookTransactionTotalsProps = {
  totalDebit: number
  totalCredit: number
  color: string
}

export function BookTransactionTotals(props: BookTransactionTotalsProps) {
  return (
    <div
      className={`grid grid-cols-2 gap-4 p-4 rounded-lg border mb-6 ${getColorClasses(props.color)}`}
    >
      <div>
        <p className="text-sm font-medium text-gray-600">Total Debits</p>
        <p className="text-2xl text-foreground font-bold">
          {formatCentsToCurrency(props.totalDebit)}
        </p>
      </div>
      <div>
        <p className="text-sm font-medium text-gray-600">Total Credits</p>
        <p className="text-2xl text-foreground font-bold">
          {formatCentsToCurrency(props.totalCredit)}
        </p>
      </div>
    </div>
  )
}

export function NoTransactionFound() {
  return (
    <div className="text-center py-8 text-gray-500">
      No transactions found for the selected period.
    </div>
  )
}
