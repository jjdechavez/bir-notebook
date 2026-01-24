import { useSuspenseQuery } from '@tanstack/react-query'
import { useReactTable } from '@tanstack/react-table'
import { getCoreRowModel, getPaginationRowModel } from '@tanstack/react-table'
import { tuyau } from '@/main'
import { useFilters } from '@/hooks/use-filters'
import type { Transaction } from '@/types/transaction'
import type { TransactionSearch } from '@/types/transaction'
import { transactionCategoryBookTypes } from '@bir-notebook/shared/models/transaction'
import { BooksDataTable } from './books-data-table'
import { createGeneralJournalColumns } from './columns/general-journal-columns'
import { GeneralJournalFooter } from './footers/general-journal-footer'
import { BulkActionBar } from './bulk-action-bar'
import {
  DEFAULT_PAGE_INDEX,
  DEFAULT_PAGE_SIZE,
  DEFAULT_LIST_META,
} from '@/lib/constants'

interface GeneralJournalProps {
  filters: TransactionSearch
  onRecordAction: (action: 'record' | 'undo', transaction: Transaction) => void
}

export function GeneralJournal({
  filters,
  onRecordAction,
}: GeneralJournalProps) {
  const { setFilters } = useFilters('/(app)/books')

  const { data: transactionsData, status } = useSuspenseQuery(
    tuyau.api.transactions.$get.queryOptions({
      payload: {
        ...filters,
        bookType: transactionCategoryBookTypes.generalJournal,
      },
    }),
  )

  const columns = createGeneralJournalColumns(onRecordAction)

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
        <GeneralJournalFooter transactions={transactionsData?.data || []} />
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
