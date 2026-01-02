import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useState } from 'react'
import { ChevronLeft, ChevronRight, Search, Filter } from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import { tuyau } from '@/main'
import { formatCentsToCurrency } from '@bir-notebook/shared/helpers/currency'
import { formatOption } from '@bir-notebook/shared/models/common'
import {
  transactionCategoryBookTypeOptions,
  transactionVatTypeOptions,
} from '@bir-notebook/shared/models/transaction'
import {
  getCoreRowModel,
  useReactTable,
  type ColumnDef,
} from '@tanstack/react-table'
import type { Transaction } from '@/types/transaction'
import { useFilters } from '@/hooks/use-filters'
import { DataTable } from './data-table'
import { DEFAULT_LIST_META } from '@/lib/api'

const columns: ColumnDef<Transaction>[] = [
  {
    header: 'Date',
    cell: ({ row }) => new Date(row.original.transactionDate).toLocaleString(),
  },
  {
    header: 'Description',
    cell: ({ row }) => {
      const transaction = row.original
      return (
        <div>
          <p className="font-medium">{transaction.description}</p>
          <p className="text-sm text-muted-foreground">ID: {transaction.id}</p>
        </div>
      )
    },
  },
  {
    header: 'Category',
    cell: ({ row }) => row.original.category?.name || 'N/A',
  },
  {
    header: 'Book',
    cell: ({ row }) => (
      <Badge variant="outline">
        {formatOption(
          transactionCategoryBookTypeOptions,
          row.original.bookType,
        )}
      </Badge>
    ),
  },
  {
    header: 'Debit Account',
    cell: ({ row }) => {
      const transaction = row.original
      return (
        <div className="text-sm">
          <p className="font-medium">{transaction.debitAccount?.name}</p>
          <p className="text-muted-foreground">
            {transaction.debitAccount?.code}
          </p>
        </div>
      )
    },
  },
  {
    header: 'Credit Account',
    cell: ({ row }) => {
      const transaction = row.original
      return (
        <div className="text-sm">
          <p className="font-medium">{transaction.creditAccount?.name}</p>
          <p className="text-muted-foreground">
            {transaction.creditAccount?.code}
          </p>
        </div>
      )
    },
  },
  {
    header: 'Amount',
    cell: ({ row }) => (
      <span className="text-right font-medium">
        {formatCentsToCurrency(row.original.amount)}
      </span>
    ),
  },
  {
    header: 'VAT',
    cell: ({ row }) => {
      const transaction = row.original
      return (
        <>
          <Badge
            variant={
              transaction.vatType === 'vat_standard' ? 'default' : 'secondary'
            }
          >
            {formatOption(transactionVatTypeOptions, transaction.vatType)}
          </Badge>
          {transaction.vatAmount > 0 && (
            <p className="text-xs text-muted-foreground mt-1">
              {formatCentsToCurrency(transaction.vatAmount)}
            </p>
          )}
        </>
      )
    },
  },
  {
    header: 'Reference',
    accessorKey: 'referenceNumber',
  },
]

export function TransactionList() {
  const [filters, setFilters] = useState({
    page: 1,
    limit: 10,
    bookType: '',
    categoryId: 0,
    dateFrom: '',
    dateTo: '',
    search: '',
  })

  const { data: transactionsData, status } = useQuery(
    tuyau.api.transactions.$get.queryOptions({ payload: filters }),
  )

  const table = useReactTable({
    data: transactionsData?.data || [],
    columns,
    getCoreRowModel: getCoreRowModel(),
    manualPagination: true,
    rowCount: Number(transactionsData?.meta.total || 0),
    state: {
      pagination: {
        pageIndex: filters.page,
        pageSize: filters.limit,
      },
    },
    onPaginationChange: (pagination) => {
      setFilters(
        typeof pagination === 'function'
          ? pagination({
              pageIndex: filters.page,
              pageSize: filters.limit,
            })
          : pagination,
      )
    },
    enableColumnFilters: false,
    filterFns: {
      fuzzy: () => true,
    },
  })

  const handlePageChange = (newPage: number) => {
    setFilters((prev) => ({ ...prev, page: newPage }))
  }

  const handleFilterChange = (key: string, value: any) => {
    setFilters((prev) => ({ ...prev, [key]: value, page: 1 }))
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div>
          <label className="block text-sm font-medium mb-2">Book Type</label>
          <select
            value={filters.bookType}
            onChange={(e) => handleFilterChange('bookType', e.target.value)}
            className="w-full p-2 border rounded-md"
          >
            <option value="">All Books</option>
            <option value="cash_receipt">Cash Receipts</option>
            <option value="cash_disbursement">Cash Disbursements</option>
            <option value="general_journal">General Journal</option>
            <option value="ledger">General Ledger</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">Date From</label>
          <Input
            type="date"
            value={filters.dateFrom}
            onChange={(e) => handleFilterChange('dateFrom', e.target.value)}
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">Date To</label>
          <Input
            type="date"
            value={filters.dateTo}
            onChange={(e) => handleFilterChange('dateTo', e.target.value)}
          />
        </div>
      </div>

      <DataTable
        columns={columns}
        className="mt-8"
        meta={transactionsData?.meta || DEFAULT_LIST_META}
        table={table}
        dataStatus={status}
      />
    </div>
  )
}
