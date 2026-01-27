import { formatCentsToCurrency } from '@bir-notebook/shared/helpers/currency'
import { createColumnHelper } from '@tanstack/react-table'
import { Checkbox } from '@/components/ui/checkbox'
import { TransactionActions } from '../transaction-actions'
import { StatusBadge } from '../status-badge'
import { getChartOfAccounts } from '../utils'
import type { ColumnDef } from '@tanstack/react-table'
import type { Transaction } from '@/types/transaction'

const columnHelper = createColumnHelper<Transaction>()

const DEFAULT_COLUMN_COUNT = 6

export const createCashReceiptsColumns = (
  onRecordAction: (action: 'record' | 'undo', transaction: Transaction) => void,
  transactions: Transaction[],
  columnCount: number = DEFAULT_COLUMN_COUNT,
): ColumnDef<Transaction>[] => {
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
            <p className="font-medium">{row.original.description}</p>
            <p className="text-sm text-muted-foreground">#{row.original.id}</p>
          </div>
          <StatusBadge recorded={!!row.original.recorded} />
        </div>
      ),
    }),

    // Reference column
    columnHelper.display({
      id: 'reference',
      header: 'Reference',
      cell: ({ row }) => row.original.referenceNumber || '-',
    }),

    // Debit Cash column
    columnHelper.display({
      id: 'debitCash',
      header: () => <div className="text-right">Debit Cash</div>,
      cell: ({ row }) => (
        <div className="text-right font-medium text-green-600">
          {row.original.debitAccount?.name?.toLowerCase().includes('cash')
            ? formatCentsToCurrency(row.original.amount)
            : '-'}
        </div>
      ),
    }),

    // Credit Account columns (dynamic)
    ...allAccountColumns.map((account) =>
      columnHelper.display({
        id: `credit-${account.id}`,
        header: () => (
          <div className="text-right text-xs">
            <div>{account.name}</div>
            <div className="text-gray-500">(Credit)</div>
          </div>
        ),
        cell: ({ row }) => (
          <div className="text-right font-medium text-destructive-foreground">
            {row.original.creditAccount?.id === account.id
              ? formatCentsToCurrency(row.original.amount)
              : '-'}
          </div>
        ),
      }),
    ),

    // Credit Sundry column
    columnHelper.display({
      id: 'creditSundry',
      header: () => <div className="text-right">Credit Sundry</div>,
      cell: ({ row }) => {
        const isSundry =
          row.original.creditAccount?.name &&
          !row.original.creditAccount.name.toLowerCase().includes('cash') &&
          !allAccountColumns.some(
            (acc) => acc.id === row.original.creditAccount?.id,
          )
        return (
          <div className="text-right">
            {isSundry ? row.original.creditAccount?.name : '-'}
          </div>
        )
      },
    }),

    // Credit Sundry Amount column
    columnHelper.display({
      id: 'creditSundryAmount',
      header: () => <div className="text-right">Credit Sundry Amount</div>,
      cell: ({ row }) => {
        const isSundry =
          row.original.creditAccount?.name &&
          !row.original.creditAccount.name.toLowerCase().includes('cash') &&
          !allAccountColumns.some(
            (acc) => acc.id === row.original.creditAccount?.id,
          )
        return (
          <div className="text-right font-medium text-red-600">
            {isSundry ? formatCentsToCurrency(row.original.amount) : '-'}
          </div>
        )
      },
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
