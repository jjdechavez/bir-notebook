import { formatCentsToCurrency } from '@bir-notebook/shared/helpers/currency'
import { createColumnHelper } from '@tanstack/react-table'
import { Checkbox } from '@/components/ui/checkbox'
import { TransactionActions } from '../transaction-actions'
import { StatusBadge } from '../status-badge'
import type { ColumnDef } from '@tanstack/react-table'
import type { Transaction } from '@/types/transaction'

const columnHelper = createColumnHelper<Transaction>()

export const createGeneralJournalColumns = (
  onRecordAction: (action: 'record' | 'undo', transaction: Transaction) => void
): ColumnDef<Transaction>[] => {
  return [
    // Selection column
    columnHelper.display({
      id: 'select',
      header: ({ table }) => (
        <Checkbox
          checked={table.getIsAllPageRowsSelected()}
          onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
          aria-label="Select all"
        />
      ),
      cell: ({ row }) => (
        <Checkbox
          checked={row.getIsSelected()}
          onCheckedChange={(value) => row.toggleSelected(!!value)}
          aria-label="Select row"
        />
      ),
      enableSorting: false,
      enableHiding: false,
    }),

    // Date column
    columnHelper.accessor('transactionDate', {
      header: 'Date',
      cell: (info) => new Date(info.getValue()).toLocaleDateString(),
    }),

    // Description with status badge
    columnHelper.display({
      id: 'description',
      header: 'Description',
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
          <div className="flex-1">
            <p className="font-medium">
              {row.original.debitAccount?.name} / {row.original.creditAccount?.name}
            </p>
            <p className="text-sm text-gray-500 pl-4">
              {row.original.description}
            </p>
            <p className="text-xs text-gray-400">#{row.original.id}</p>
          </div>
          <StatusBadge recorded={!!row.original.recorded} />
        </div>
      ),
    }),

    // Debit column
    columnHelper.display({
      id: 'debit',
      header: () => <div className="text-right">Debit</div>,
      cell: ({ row }) => (
        <div className="text-right font-medium text-green-600">
          {formatCentsToCurrency(row.original.amount)}
        </div>
      ),
    }),

    // Credit column
    columnHelper.display({
      id: 'credit', 
      header: () => <div className="text-right">Credit</div>,
      cell: ({ row }) => (
        <div className="text-right font-medium text-red-600">
          {formatCentsToCurrency(row.original.amount)}
        </div>
      ),
    }),

    // Actions column
    columnHelper.display({
      id: 'actions',
      header: () => <div className="text-center">Actions</div>,
      cell: ({ row }) => (
        <div className="flex justify-center">
          <TransactionActions
            transaction={row.original}
            onRecord={() => onRecordAction('record', row.original)}
            onUndo={() => onRecordAction('undo', row.original)}
          />
        </div>
      ),
      enableSorting: false,
      enableHiding: false,
    }),
  ]
}