import { createFileRoute } from '@tanstack/react-router'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Calendar, Download, Search, Filter } from 'lucide-react'
import { formatCentsToCurrency } from '@bir-notebook/shared/helpers/currency'
import { SettingPendingComponent } from '@/components/pending-component'
import { GenericErrorComponent } from '@/components/error-component'
import { useSuspenseQuery } from '@tanstack/react-query'
import { tuyau } from '@/main'
import { useFilters } from '@/hooks/use-filters'
import type { Transaction, TransactionSearch } from '@/types/transaction'
import type { PaginationState } from '@tanstack/react-table'
import { transactionCategoryBookTypes } from '@bir-notebook/shared/models/transaction'
import { BookExport } from '@/components/book-export'

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

  // {
  //     dateFrom: new Date().toISOString().split('T')[0], // First day of current month
  //     dateTo: new Date().toISOString().split('T')[0], // Today
  //     search: '',
  //   }
  const { data: transactionsData } = useSuspenseQuery(
    tuyau.api.transactions.$get.queryOptions({
      payload: {
        dateFrom: filters.dateFrom,
        dateTo: filters.dateTo,
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

  console.log(transactionsByBook)

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold">BIR Books of Accounts</h1>
        <p className="text-gray-600 mt-2">
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
  transactions: any[]
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

  // Calculate totals
  const totalDebits = filteredTransactions.reduce((sum, t) => sum + t.amount, 0)
  const totalCredits = filteredTransactions.reduce(
    (sum, t) => sum + t.amount,
    0,
  )

  const getColorClasses = (color: string) => {
    const colors = {
      green: 'border-green-200 bg-green-50',
      red: 'border-red-200 bg-red-50',
      blue: 'border-blue-200 bg-blue-50',
      purple: 'border-purple-200 bg-purple-50',
    }
    return colors[color as keyof typeof colors] || colors.blue
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
        {/* Summary */}
        <div
          className={`grid grid-cols-2 gap-4 p-4 rounded-lg border mb-6 ${getColorClasses(color)}`}
        >
          <div>
            <p className="text-sm font-medium text-gray-600">Total Debits</p>
            <p className="text-2xl font-bold">
              {formatCentsToCurrency(totalDebits)}
            </p>
          </div>
          <div>
            <p className="text-sm font-medium text-gray-600">Total Credits</p>
            <p className="text-2xl font-bold">
              {formatCentsToCurrency(totalCredits)}
            </p>
          </div>
        </div>

        {/* Transactions Table */}
        {filteredTransactions.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            No transactions found for the selected period.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b bg-gray-50">
                  <th className="text-left p-3">Date</th>
                  <th className="text-left p-3">Description</th>
                  <th className="text-left p-3">Reference</th>
                  <th className="text-left p-3">Debit Account</th>
                  <th className="text-left p-3">Credit Account</th>
                  <th className="text-right p-3">Debit</th>
                  <th className="text-right p-3">Credit</th>
                  <th className="text-left p-3">VAT</th>
                </tr>
              </thead>
              <tbody>
                {filteredTransactions.map((transaction, index) => (
                  <tr
                    key={transaction.id}
                    className={`border-b ${index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}`}
                  >
                    <td className="p-3">
                      {new Date(
                        transaction.transactionDate,
                      ).toLocaleDateString()}
                    </td>
                    <td className="p-3">
                      <div>
                        <p className="font-medium">{transaction.description}</p>
                        <p className="text-sm text-gray-500">
                          #{transaction.id}
                        </p>
                      </div>
                    </td>
                    <td className="p-3">
                      {transaction.referenceNumber || '-'}
                    </td>
                    <td className="p-3">
                      <div className="text-sm">
                        <p className="font-medium">
                          {transaction.debitAccount?.name}
                        </p>
                        <p className="text-gray-500">
                          {transaction.debitAccount?.code}
                        </p>
                      </div>
                    </td>
                    <td className="p-3">
                      <div className="text-sm">
                        <p className="font-medium">
                          {transaction.creditAccount?.name}
                        </p>
                        <p className="text-gray-500">
                          {transaction.creditAccount?.code}
                        </p>
                      </div>
                    </td>
                    <td className="p-3 text-right font-medium text-green-600">
                      {formatCentsToCurrency(transaction.amount)}
                    </td>
                    <td className="p-3 text-right font-medium text-red-600">
                      {formatCentsToCurrency(transaction.amount)}
                    </td>
                    <td className="p-3">
                      <Badge
                        variant={
                          transaction.vatType === 'vat_standard'
                            ? 'default'
                            : 'secondary'
                        }
                      >
                        {transaction.vatType === 'vat_standard'
                          ? '12%'
                          : 'Exempt'}
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="border-t-2 border-gray-300 bg-gray-100 font-bold">
                  <td colSpan={5} className="p-3 text-right">
                    Totals:
                  </td>
                  <td className="p-3 text-right text-green-600">
                    {formatCentsToCurrency(totalDebits)}
                  </td>
                  <td className="p-3 text-right text-red-600">
                    {formatCentsToCurrency(totalCredits)}
                  </td>
                  <td></td>
                </tr>
              </tfoot>
            </table>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
