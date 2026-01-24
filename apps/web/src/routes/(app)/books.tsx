import { createFileRoute } from '@tanstack/react-router'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { Check, X } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Calendar, Download, Search, Filter } from 'lucide-react'
import { SettingPendingComponent } from '@/components/pending-component'
import { GenericErrorComponent } from '@/components/error-component'
import { useSuspenseQuery } from '@tanstack/react-query'
import { tuyau } from '@/main'
import { useFilters } from '@/hooks/use-filters'
import type { TransactionSearch } from '@/types/transaction'
import {
  transactionCategoryBookTypes,
  type TransactionCategoryBookType,
} from '@bir-notebook/shared/models/transaction'
import { CashReceiptsJournal } from '@/components/books/cash-receipts-journal'
import { CashDisbursementsJournal } from '@/components/books/cash-disbursements-journal'
import { GeneralJournal } from '@/components/books/general-journal'
import {
  ChartOfAccounts,
  GeneralLedger,
} from '@/components/books/general-ledger'
import {
  BookCountedColumnFilter,
  BookTransactionTotals,
  NoTransactionFound,
} from '@/components/books/common'
import { BulkActionBar } from '@/components/books/bulk-action-bar'
import {
  InputGroup,
  InputGroupAddon,
  InputGroupDebounceInput,
} from '@/components/ui/input-group'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

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
  validateSearch: () => ({}) as Partial<TransactionSearch & { count?: number }>,
})

const cashReceiptJournalBook = {
  key: transactionCategoryBookTypes.cashReceiptJournal,
  label: 'Cash Receipts Journal',
  icon: '📥',
  color: 'green',
}

const cashDisbursementJournalBook = {
  key: transactionCategoryBookTypes.cashDisbursementJournal,
  label: 'Cash Disbursements Journal',
  icon: '📤',
  color: 'red',
}

const generalJournalBook = {
  key: transactionCategoryBookTypes.generalJournal,
  label: 'General Journal',
  icon: '📝',
  color: 'blue',
}

const generalLedgerBook = {
  key: transactionCategoryBookTypes.generalLedger,
  label: 'General Ledger',
  icon: '📊',
  color: 'purple',
}

const bookTypes = [
  cashReceiptJournalBook,
  cashDisbursementJournalBook,
  generalJournalBook,
  generalLedgerBook,
]

function BooksPage() {
  const { filters, setFilters } = useFilters(Route.id)
  const columnCountFilter = filters?.count || 6

  const { data: transactionsData } = useSuspenseQuery(
    tuyau.api.transactions.$get.queryOptions({
      payload: {
        dateFrom: filters.dateFrom,
        dateTo: filters.dateTo,
        bookType:
          filters?.bookType || transactionCategoryBookTypes.cashReceiptJournal,
        search: filters?.search || '',
        record: filters?.record || '',
      },
    }),
  )

  const totalTransactionCount = transactionsData.meta.total
  const totalTransactionAmount = transactionsData.data.reduce(
    (total, t) => total + t.amount,
    0,
  )

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
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
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
              <InputGroup>
                <InputGroupDebounceInput
                  placeholder="Search transactions..."
                  value={filters.search || ''}
                  onChange={(e) => setFilters({ search: e.toString() })}
                />
                <InputGroupAddon>
                  <Search className="text-gray-400 h-4 w-4" />
                </InputGroupAddon>
              </InputGroup>
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Status</label>
              <Select
                value={filters.record || ''}
                onValueChange={(value) =>
                  setFilters({ record: value || undefined })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="All status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  <SelectItem value="draft">Draft</SelectItem>
                  <SelectItem value="recorded">Recorded</SelectItem>
                </SelectContent>
              </Select>
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
        defaultValue={
          filters?.bookType || transactionCategoryBookTypes.cashReceiptJournal
        }
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

        <TabsContent value={cashReceiptJournalBook.key} className="space-y-4">
          <BookView
            title={cashReceiptJournalBook.label}
            icon={cashReceiptJournalBook.icon}
            totalTransaction={totalTransactionCount}
            bookType={cashReceiptJournalBook.key}
          >
            <BookCountedColumnFilter
              count={columnCountFilter}
              setCount={(count) => setFilters({ count })}
            />
            <BookTransactionTotals
              color={cashReceiptJournalBook.color}
              totalCredit={totalTransactionAmount}
              totalDebit={totalTransactionAmount}
            />
            {transactionsData?.data.length === 0 ? (
              <NoTransactionFound />
            ) : (
              <CashReceiptsJournal
                columnCount={columnCountFilter}
                transactions={transactionsData.data}
              />
            )}
          </BookView>
        </TabsContent>
        <TabsContent
          value={cashDisbursementJournalBook.key}
          className="space-y-4"
        >
          <BookView
            title={cashDisbursementJournalBook.label}
            icon={cashDisbursementJournalBook.icon}
            totalTransaction={totalTransactionCount}
            bookType={cashDisbursementJournalBook.key}
          >
            <BookCountedColumnFilter
              count={columnCountFilter}
              setCount={(count) => setFilters({ count })}
            />
            <BookTransactionTotals
              color={cashDisbursementJournalBook.color}
              totalCredit={totalTransactionAmount}
              totalDebit={totalTransactionAmount}
            />
            {transactionsData.data.length === 0 ? (
              <NoTransactionFound />
            ) : (
              <CashDisbursementsJournal
                columnCount={columnCountFilter}
                transactions={transactionsData?.data || []}
              />
            )}
          </BookView>
        </TabsContent>
        <TabsContent value={generalJournalBook.key} className="space-y-4">
          <GeneralJournal
            filters={{ ...filters, bookType: generalJournalBook.key }}
            onRecordAction={(action, transaction) => {
              console.log(`${action} transaction:`, transaction.id)
              // TODO: API call to record/undo transaction
            }}
          />
        </TabsContent>
        <TabsContent value={generalLedgerBook.key} className="space-y-4">
          <BookView
            title={generalLedgerBook.label}
            icon={generalLedgerBook.icon}
            totalTransaction={totalTransactionCount}
            bookType={generalLedgerBook.key}
          >
            <Tabs defaultValue="transactions">
              <TabsList>
                <TabsTrigger value="transactions">Transactions</TabsTrigger>
                <TabsTrigger value="accounts">Chart of Accounts</TabsTrigger>
              </TabsList>

              <TabsContent value="transactions">
                {transactionsData.data.length === 0 ? (
                  <NoTransactionFound />
                ) : (
                  <GeneralLedger transactions={transactionsData.data} />
                )}
              </TabsContent>
              <TabsContent value="accounts">
                <ChartOfAccounts />
              </TabsContent>
            </Tabs>
          </BookView>
        </TabsContent>
      </Tabs>
    </div>
  )
}

type BookViewProps = {
  title: string
  icon: string
  totalTransaction: number
  children: React.ReactNode
}

function BookView({
  title,
  icon,
  children,
  totalTransaction,
  bookType,
}: BookViewProps & { bookType: string }) {
  const hasRecordedTransactions = false // TODO: Implement proper recorded transaction detection

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
              <span className="font-medium">{totalTransaction}</span>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                onClick={() =>
                  console.log('Record all transactions for', bookType)
                }
              >
                <Check className="h-4 w-4 mr-2" />
                Record All
              </Button>
              {hasRecordedTransactions && (
                <Button
                  variant="outline"
                  size="sm"
                  className="text-orange-600 hover:text-orange-700 hover:bg-orange-50"
                  onClick={() =>
                    console.log('Undo all recorded transactions for', bookType)
                  }
                >
                  <X className="h-4 w-4 mr-2" />
                  Undo All
                </Button>
              )}
              <Button variant="outline" size="sm">
                <Download className="h-4 w-4 mr-2" />
                Export PDF
              </Button>
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent>{children}</CardContent>
    </Card>
  )
}
