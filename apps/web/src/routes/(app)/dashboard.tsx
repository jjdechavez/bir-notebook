import { createFileRoute } from '@tanstack/react-router'
import { BookOpen, FileText, TrendingDown, TrendingUp } from 'lucide-react'

import { useQuery } from '@tanstack/react-query'
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
  type PaginationState,
} from '@tanstack/react-table'
import { DEFAULT_LIST_META } from '@/lib/api'

import { TransactionCard } from '@/components/transaction-summary-card'
import {
  DataTable,
  DEFAULT_PAGE_INDEX,
  DEFAULT_PAGE_SIZE,
} from '@/components/data-table'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { tuyau } from '@/main'
import type { Transaction, TransactionSearch } from '@/types/transaction'
import { useAuth } from '@/lib/auth'
import { useFilters } from '@/hooks/use-filters'

export const Route = createFileRoute('/(app)/dashboard')({
  component: DashboardComponent,
  loader: () => ({
    crumb: 'Dashboard',
  }),
  validateSearch: () => ({}) as Partial<TransactionSearch & PaginationState>,
})

function DashboardComponent() {
  const { user } = useAuth()

  return (
    <div className="bg-background p-6">
      <h1 className="text-xl font-bold mb-4">
        Welcome back, {user?.firstName} {user?.lastName}
      </h1>
      <div className="space-y-6">
        <p className="text-muted-foreground">
          Manage your transactions with BIR-compliant record keeping
        </p>

        <TransactionSummary />
        <TransactionList />
      </div>
    </div>
  )
}

function TransactionSummary() {
  const { data } = useQuery(
    tuyau.api.transactions.summary.$get.queryOptions({}),
  )
  const totalIncome = data?.totalIncome || 0
  const totalExpenses = data?.totalExpenses || 0
  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
      <TransactionCard
        title="Total Income"
        description={formatCentsToCurrency(data?.totalIncome || 0)}
        icon={TrendingUp}
      />
      <TransactionCard
        title="Total Expenses"
        description={formatCentsToCurrency(data?.totalExpenses || 0)}
        icon={TrendingDown}
        variant="expense"
      />
      <TransactionCard
        title="Net Income"
        description={formatCentsToCurrency(data?.netIncome || 0)}
        icon={FileText}
        variant={
          totalIncome > totalExpenses ? 'passiveNetIncome' : 'negativeNetIncome'
        }
      />
      <TransactionCard
        title="Categories"
        description={'PHP 0.00'}
        icon={BookOpen}
        variant="categories"
      />
    </div>
  )
}

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
  const { filters, setFilters } = useFilters(Route.id)

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
        pageIndex: filters?.page ? +filters.page : DEFAULT_PAGE_INDEX,
        pageSize: filters?.limit ? +filters.limit : DEFAULT_PAGE_SIZE,
      },
    },
    onPaginationChange: (pagination) => {
      setFilters(
        typeof pagination === 'function'
          ? pagination({
              pageIndex: filters?.pageIndex || DEFAULT_PAGE_INDEX,
              pageSize: filters?.pageSize || DEFAULT_PAGE_SIZE,
            })
          : pagination,
      )
    },
    enableColumnFilters: false,
    filterFns: {
      fuzzy: () => true,
    },
  })

  return (
    <>
      <div className="flex">
        <h1 className="text-xl font-bold">Transactions</h1>
      </div>
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div>
            <label className="block text-sm font-medium mb-2">Book Type</label>
            <select
              value={filters.bookType || ''}
              onChange={(e) =>
                setFilters({
                  bookType: e.target.value as TransactionSearch['bookType'],
                })
              }
              className="w-full p-2 border rounded-md"
            >
              <option value="">All Books</option>
              {transactionCategoryBookTypeOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Date From</label>
            <Input
              type="date"
              value={filters?.dateFrom || ''}
              onChange={(e) => setFilters({ dateFrom: e.target.value })}
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Date To</label>
            <Input
              type="date"
              value={filters?.dateTo || ''}
              onChange={(e) => setFilters({ dateTo: e.target.value })}
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
    </>
  )
}
