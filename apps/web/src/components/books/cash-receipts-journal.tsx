import { useSuspenseQuery } from '@tanstack/react-query'
import { useReactTable } from '@tanstack/react-table'
import { getCoreRowModel, getPaginationRowModel } from '@tanstack/react-table'
import { tuyau } from '@/main'
import { useFilters } from '@/hooks/use-filters'
import type { Transaction } from '@/types/transaction'
import type { TransactionSearch } from '@/types/transaction'
import { transactionCategoryBookTypes } from '@bir-notebook/shared/models/transaction'
import { BooksDataTable } from './books-data-table'
import { createCashReceiptsColumns } from './columns/cash-receipts-columns'
import { CashReceiptsFooter } from './footers/cash-receipts-footer'
import { BulkActionBar } from './bulk-action-bar'
import {
  DEFAULT_PAGE_INDEX,
  DEFAULT_PAGE_SIZE,
  DEFAULT_LIST_META,
} from '@/lib/constants'

type CashReceiptsJournalProps = {
  filters: TransactionSearch
  columnCount?: number
  onRecordAction: (action: 'record' | 'undo', transaction: Transaction) => void
}

export function CashReceiptsJournal({
  filters,
  columnCount = 6,
  onRecordAction,
}: CashReceiptsJournalProps) {
  const { setFilters } = useFilters('/(app)/books')

  const { data: transactionsData, status } = useSuspenseQuery(
    tuyau.api.transactions.$get.queryOptions({
      payload: {
        ...filters,
        bookType: transactionCategoryBookTypes.cashReceiptJournal,
      },
    }),
  )

  const columns = createCashReceiptsColumns(
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

  return (
    <BooksDataTable
      columns={columns}
      meta={transactionsData?.meta || DEFAULT_LIST_META}
      table={table}
      dataStatus={status}
      footer={
        <CashReceiptsFooter
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
            console.log('Bulk record:', transactions)
          }}
          onUndoSelected={() => {
            const selectedRows = table.getSelectedRowModel().rows
            const transactions = selectedRows.map((row) => row.original)
            console.log('Bulk undo:', transactions)
          }}
          onClearSelection={() => table.resetRowSelection()}
        />
      }
    />
  )
}
