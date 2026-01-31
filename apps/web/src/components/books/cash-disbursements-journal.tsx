import {
  useMutation,
  useQueryClient,
  useSuspenseQuery,
} from '@tanstack/react-query'
import { useReactTable } from '@tanstack/react-table'
import { getCoreRowModel, getPaginationRowModel } from '@tanstack/react-table'
import { tuyau } from '@/main'
import { useFilters } from '@/hooks/use-filters'
import type { Transaction } from '@/types/transaction'
import type { TransactionSearch } from '@/types/transaction'
import { transactionCategoryBookTypes } from '@bir-notebook/shared/models/transaction'
import { BooksDataTable } from './books-data-table'
import { createCashDisbursementsColumns } from './columns/cash-disbursements-columns'
import { CashDisbursementsFooter } from './footers/cash-disbursements-footer'
import { BulkActionBar } from './bulk-action-bar'
import {
  DEFAULT_PAGE_INDEX,
  DEFAULT_PAGE_SIZE,
  DEFAULT_LIST_META,
} from '@/lib/constants'
import { toast } from 'sonner'

interface CashDisbursementsJournalProps {
  filters: TransactionSearch
  columnCount?: number
  onRecordAction: (action: 'record' | 'undo', transaction: Transaction) => void
}

export function CashDisbursementsJournal({
  filters,
  columnCount = 6,
  onRecordAction,
}: CashDisbursementsJournalProps) {
  const { setFilters } = useFilters('/(app)/books')

  const { data: transactionsData, status } = useSuspenseQuery(
    tuyau.api.transactions.$get.queryOptions({
      payload: {
        ...filters,
        bookType: transactionCategoryBookTypes.cashDisbursementJournal,
      },
    }),
  )

  const columns = createCashDisbursementsColumns(
    onRecordAction,
    transactionsData?.data || [],
    columnCount,
  )

  const table = useReactTable({
    data: transactionsData?.data || [],
    columns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    manualPagination: true,
    rowCount: Number(transactionsData?.meta.total || 0),
    state: {
      pagination: {
        pageIndex: filters?.page ? +filters.page : DEFAULT_PAGE_INDEX,
        pageSize: filters?.limit ? +filters.limit : DEFAULT_PAGE_SIZE,
      },
    },
    onPaginationChange: (updater) => {
      const pagination =
        typeof updater === 'function'
          ? updater(table.getState().pagination)
          : updater
      setFilters({
        page: pagination.pageIndex,
        limit: pagination.pageSize,
      })
    },
    enableRowSelection: true,
    getRowId: (row) => row.id.toString(),
  })

  const queryClient = useQueryClient()

  const bulkRecordTransactionsMutation = useMutation(
    tuyau.api.transactions.record.bulk.$post.mutationOptions({
      onSuccess: () => {
        toast.success('Transactions has been recorded')
        queryClient.invalidateQueries({
          queryKey: tuyau.api.transactions.$get.queryKey(),
        })
      },
    }),
  )

  const bulkUndoRecordTransactionsMutation = useMutation(
    tuyau.api.transactions.record.undo.bulk.$post.mutationOptions({
      onSuccess: () => {
        toast.success('Transactions record has been undo')
        queryClient.invalidateQueries({
          queryKey: tuyau.api.transactions.$get.queryKey(),
        })
      },
    }),
  )

  return (
    <BooksDataTable
      columns={columns}
      meta={transactionsData?.meta || DEFAULT_LIST_META}
      table={table}
      dataStatus={status}
      footer={
        <CashDisbursementsFooter
          transactions={transactionsData?.data || []}
          columnCount={columnCount}
        />
      }
      actions={
        <BulkActionBar
          selectedCount={table.getFilteredSelectedRowModel().rows.length}
          onRecordSelected={() => {
            const selectedRows = table.getSelectedRowModel().rows
            const transactions = selectedRows.map((row) => row.original)
            bulkRecordTransactionsMutation.mutate({
              payload: { transactionIds: transactions.map((t) => t.id) },
            })
          }}
          onUndoSelected={() => {
            const selectedRows = table.getSelectedRowModel().rows
            const transactions = selectedRows.map((row) => row.original)
            bulkUndoRecordTransactionsMutation.mutate({
              payload: { transactionIds: transactions.map((t) => t.id) },
            })
          }}
          onClearSelection={() => table.resetRowSelection()}
        />
      }
    />
  )
}
