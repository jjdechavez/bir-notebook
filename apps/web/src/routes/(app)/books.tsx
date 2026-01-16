import { createFileRoute } from '@tanstack/react-router'
import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Calendar, Download, Search, Filter, Columns } from 'lucide-react'
import { formatCentsToCurrency } from '@bir-notebook/shared/helpers/currency'
import { SettingPendingComponent } from '@/components/pending-component'
import { GenericErrorComponent } from '@/components/error-component'
import { useSuspenseQuery } from '@tanstack/react-query'
import { tuyau } from '@/main'
import { useFilters } from '@/hooks/use-filters'
import type { Transaction, TransactionSearch } from '@/types/transaction'
import type { PaginationState } from '@tanstack/react-table'
import {
  transactionCategoryBookTypes,
  type TransactionCategoryBookType,
} from '@bir-notebook/shared/models/transaction'
import { CashReceiptsJournal } from '@/components/books/cash-receipts-journal'
import { CashDisbursementsJournal } from '@/components/books/cash-disbursements-journal'
import { GeneralJournal } from '@/components/books/general-journal'
import { GeneralLedger } from '@/components/books/general-ledger'
import { getColorClasses } from '@/components/books/utils'

export const Route = createFileRoute('/(app)/books')({
  component: BooksPage,
  loader: ({ context }) => ({
    crumb: 'Books',
    ...context.queryClient.ensureQueryData(
      context.tuyau.api.transactions.$get.queryOptions(),
    ),
  }),
  pendingComponent: SettingPendingComponent,
  errorComponent: GenericErrorComponent,
  validateSearch: () => ({}) as Partial<TransactionSearch & PaginationState>,
})

const bookTypes = [
  {
    key: transactionCategoryBookTypes.cashReceiptJournal,
    label: 'Cash Receipts Journal',
    icon: '📥',
    color: 'green',
  },
  {
    key: transactionCategoryBookTypes.cashDisbursementJournal,
    label: 'Cash Disbursements Journal',
    icon: '📤',
    color: 'red',
  },
  {
    key: transactionCategoryBookTypes.generalJournal,
    label: 'General Journal',
    icon: '📝',
    color: 'blue',
  },
  {
    key: transactionCategoryBookTypes.generalLedger,
    label: 'General Ledger',
    icon: '📊',
    color: 'purple',
  },
]

function BooksPage() {
  const { filters, setFilters } = useFilters(Route.id)

  const { data: transactionsData } = useSuspenseQuery(
    tuyau.api.transactions.$get.queryOptions({
      payload: {
        dateFrom: filters.dateFrom,
        dateTo: filters.dateTo,
        bookType:
          filters?.bookType || transactionCategoryBookTypes.cashReceiptJournal,
      },
    }),
  )

  const transactionsByBook =
    transactionsData.data.reduce(
      (acc, transaction) => {
        const bookType = transaction.bookType
        if (!acc[bookType]) acc[bookType] = []
        acc[bookType].push(transaction)
        return acc
      },
      {} as Record<string, Transaction[]>,
    ) || {}

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold">BIR Books of Accounts</h1>
        <p className="text-muted-foreground mt-2">
          View and manage your BIR-compliant books of accounts with proper
          transaction recording
        </p>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filters
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">
                Date From
              </label>
              <Input
                type="date"
                value={filters.dateFrom || ''}
                onChange={(e) => setFilters({ dateFrom: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Date To</label>
              <Input
                type="date"
                value={filters.dateTo || ''}
                onChange={(e) => setFilters({ dateTo: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Search</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Search transactions..."
                  value={filters.search || ''}
                  onChange={(e) => setFilters({ search: e.target.value })}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="flex items-end gap-2">
              <Button variant="outline" className="flex-1">
                <Download className="h-4 w-4 mr-2" />
                Export
              </Button>
              <Button>
                <Calendar className="h-4 w-4 mr-2" />
                This Month
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <Tabs
        defaultValue={transactionCategoryBookTypes.cashReceiptJournal}
        className="space-y-4"
        onValueChange={(value) =>
          setFilters({ bookType: value as TransactionCategoryBookType })
        }
      >
        <TabsList className="grid w-full grid-cols-4">
          {bookTypes.map((book) => (
            <TabsTrigger
              key={book.key}
              value={book.key}
              className="flex items-center gap-2"
            >
              <span>{book.icon}</span>
              <span className="hidden sm:inline">{book.label}</span>
            </TabsTrigger>
          ))}
        </TabsList>

        {bookTypes.map((book) => (
          <TabsContent key={book.key} value={book.key} className="space-y-4">
            <BookView
              bookType={book.key}
              title={book.label}
              icon={book.icon}
              color={book.color}
              transactions={transactionsByBook[book.key] || []}
              filters={filters}
            />
          </TabsContent>
        ))}
      </Tabs>
    </div>
  )
}

interface BookViewProps {
  bookType: string
  title: string
  icon: string
  color: string
  transactions: Transaction[]
  filters: any
}

function BookView({
  bookType,
  title,
  icon,
  color,
  transactions,
  filters,
}: BookViewProps) {
  const [columnCount, setColumnCount] = useState(6)
  // Filter transactions by search term
  const filteredTransactions = transactions.filter(
    (transaction) =>
      !filters.search ||
      transaction.description
        .toLowerCase()
        .includes(filters.search.toLowerCase()) ||
      transaction.referenceNumber
        ?.toLowerCase()
        .includes(filters.search.toLowerCase()),
  )

  const renderTable = () => {
    switch (bookType) {
      case transactionCategoryBookTypes.cashReceiptJournal:
        return (
          <CashReceiptsJournal
            transactions={filteredTransactions}
            columnCount={columnCount}
          />
        )
      case transactionCategoryBookTypes.cashDisbursementJournal:
        return (
          <CashDisbursementsJournal
            transactions={filteredTransactions}
            columnCount={columnCount}
          />
        )
      case transactionCategoryBookTypes.generalJournal:
        return <GeneralJournal transactions={filteredTransactions} />
      case transactionCategoryBookTypes.generalLedger:
        return <GeneralLedger transactions={filteredTransactions} />
      default:
        return <GeneralJournal transactions={filteredTransactions} />
    }
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <span>{icon}</span>
            {title}
          </CardTitle>
          <div className="flex items-center gap-4">
            <div className="text-sm">
              <span className="text-gray-600">Transactions: </span>
              <span className="font-medium">{filteredTransactions.length}</span>
            </div>
            <Button variant="outline" size="sm">
              <Download className="h-4 w-4 mr-2" />
              Export PDF
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {/* Column controls for cash receipt and disbursement journals */}
        {(bookType === transactionCategoryBookTypes.cashReceiptJournal ||
          bookType ===
            transactionCategoryBookTypes.cashDisbursementJournal) && (
          <div className="flex items-center gap-4 mb-6">
            <div className="flex items-center gap-2">
              <Columns className="h-4 w-4" />
              <label className="text-sm font-medium">Counted Columns:</label>
              <Select
                value={columnCount.toString()}
                onValueChange={(value) => setColumnCount(parseInt(value))}
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
              {columnCount} counted columns (Reference + Cash +{' '}
              {columnCount - 3} chart of accounts + Sundry + Sundry Amount)
            </div>
          </div>
        )}

        {bookType !== transactionCategoryBookTypes.generalLedger && (
          /* Summary for journals */
          <div
            className={`grid grid-cols-2 gap-4 p-4 rounded-lg border mb-6 ${getColorClasses(color)}`}
          >
            <div>
              <p className="text-sm font-medium text-gray-600">Total Debits</p>
              <p className="text-2xl text-foreground font-bold">
                {formatCentsToCurrency(
                  filteredTransactions.reduce((sum, t) => sum + t.amount, 0),
                )}
              </p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600">Total Credits</p>
              <p className="text-2xl text-foreground font-bold">
                {formatCentsToCurrency(
                  filteredTransactions.reduce((sum, t) => sum + t.amount, 0),
                )}
              </p>
            </div>
          </div>
        )}

        {/* Transactions Table */}
        {filteredTransactions.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            No transactions found for the selected period.
          </div>
        ) : (
          renderTable()
        )}
      </CardContent>
    </Card>
  )
}
