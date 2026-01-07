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
import type {
  Transaction,
  TransactionAccount,
  TransactionSearch,
} from '@/types/transaction'
import type { PaginationState } from '@tanstack/react-table'
import {
  transactionCategoryBookTypes,
  type TransactionCategoryBookType,
} from '@bir-notebook/shared/models/transaction'

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

  const getColorClasses = (color: string) => {
    const colors = {
      green: 'border-green-200 bg-green-50',
      red: 'border-red-200 bg-red-50',
      blue: 'border-blue-200 bg-blue-50',
      purple: 'border-purple-200 bg-purple-50',
    }
    return colors[color as keyof typeof colors] || colors.blue
  }

  // Get unique chart of accounts for dynamic column generation
  const getChartOfAccounts = (transactions: Transaction[]) => {
    const accounts = new Set()
    transactions.forEach((transaction) => {
      if (transaction.debitAccount) {
        accounts.add(JSON.stringify(transaction.debitAccount))
      }
      if (transaction.creditAccount) {
        accounts.add(JSON.stringify(transaction.creditAccount))
      }
    })
    return Array.from(accounts).map(
      (account) => JSON.parse(account as string) as TransactionAccount,
    )
  }

  // Calculate totals for General Ledger
  const calculateAccountTotals = (transactions: Transaction[]) => {
    const totals: Record<
      string,
      { debit: number; credit: number; name: string; code: string }
    > = {}

    transactions.forEach((transaction) => {
      // Debit account
      if (transaction.debitAccount) {
        const key = transaction.debitAccount.id
        if (!totals[key]) {
          totals[key] = {
            debit: 0,
            credit: 0,
            name: transaction.debitAccount.name,
            code: transaction.debitAccount.code,
          }
        }
        totals[key].debit += transaction.amount
      }

      // Credit account
      if (transaction.creditAccount) {
        const key = transaction.creditAccount.id
        if (!totals[key]) {
          totals[key] = {
            debit: 0,
            credit: 0,
            name: transaction.creditAccount.name,
            code: transaction.creditAccount.code,
          }
        }
        totals[key].credit += transaction.amount
      }
    })

    return totals
  }

  const renderCashReceiptsJournal = () => {
    const chartOfAccounts = getChartOfAccounts(filteredTransactions)
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

    // BIR Counted Columns: Reference, Debit Cash, Credit Chart of Accounts, Credit Sundry, Credit Sundry Amount
    // Fixed uncounted columns: Date, Description
    // const uncountedColumns = 2 // Date, Description
    // const sundryColumns = 2 // Credit Sundry, Credit Sundry Amount
    const accountColumnsToShow = columnCount - 3 // Reference + Debit Cash + Credit Sundry + Credit Sundry Amount

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

    return (
      <div className="overflow-x-auto">
        <table className="w-full border-collapse">
          <thead>
            <tr className="border-b bg-gray-50">
              <th className="text-left p-3 w-24">Date</th>
              <th className="text-left p-3">Description</th>
              <th className="text-left p-3 w-32">Reference</th>
              <th className="text-right p-3 w-32">Debit Cash</th>
              {allAccountColumns.map((account) => (
                <th key={account.id} className="text-right p-3 text-xs">
                  <div>{account.name}</div>
                  <div className="text-gray-500">(Credit)</div>
                </th>
              ))}
              <th className="text-right p-3 w-32">Credit Sundry</th>
              <th className="text-right p-3 w-32">Credit Sundry Amount</th>
            </tr>
          </thead>
          <tbody>
            {filteredTransactions.map((transaction, index) => (
              <tr
                key={transaction.id}
                className={`border-b ${index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}`}
              >
                <td className="p-3">
                  {new Date(transaction.transactionDate).toLocaleDateString()}
                </td>
                <td className="p-3">
                  <div>
                    <p className="font-medium">{transaction.description}</p>
                    <p className="text-sm text-gray-500">#{transaction.id}</p>
                  </div>
                </td>
                <td className="p-3">{transaction.referenceNumber || '-'}</td>
                <td className="p-3 text-right font-medium text-green-600">
                  {transaction.debitAccount?.name
                    ?.toLowerCase()
                    .includes('cash')
                    ? formatCentsToCurrency(transaction.amount)
                    : '-'}
                </td>
                {allAccountColumns.map((account) => (
                  <td
                    key={account.id}
                    className="p-3 text-right font-medium text-red-600"
                  >
                    {transaction.creditAccount?.id === account.id
                      ? formatCentsToCurrency(transaction.amount)
                      : '-'}
                  </td>
                ))}
                <td className="p-3 text-right">
                  {transaction.creditAccount?.name &&
                  !transaction.creditAccount.name
                    .toLowerCase()
                    .includes('cash') &&
                  !allAccountColumns.some(
                    (acc) => acc.id === transaction.creditAccount?.id,
                  )
                    ? transaction.creditAccount.name
                    : '-'}
                </td>
                <td className="p-3 text-right font-medium text-red-600">
                  {transaction.creditAccount?.name &&
                  !transaction.creditAccount.name
                    .toLowerCase()
                    .includes('cash') &&
                  !allAccountColumns.some(
                    (acc) => acc.id === transaction.creditAccount?.id,
                  )
                    ? formatCentsToCurrency(transaction.amount)
                    : '-'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    )
  }

  const renderCashDisbursementsJournal = () => {
    const chartOfAccounts = getChartOfAccounts(filteredTransactions)
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

    // BIR Counted Columns: Reference, Credit Cash, Debit Chart of Accounts, Debit Sundry, Debit Sundry Amount
    // Fixed uncounted columns: Date, Description
    // const uncountedColumns = 2 // Date, Description
    // const sundryColumns = 2 // Debit Sundry, Debit Sundry Amount
    const accountColumnsToShow = columnCount - 3 // Reference + Credit Cash + Debit Sundry + Debit Sundry Amount

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

    return (
      <div className="overflow-x-auto">
        <table className="w-full border-collapse">
          <thead>
            <tr className="border-b bg-gray-50">
              <th className="text-left p-3 w-24">Date</th>
              <th className="text-left p-3">Description</th>
              <th className="text-left p-3 w-32">Reference</th>
              <th className="text-right p-3 w-32">Credit Cash</th>
              {allAccountColumns.map((account) => (
                <th key={account.id} className="text-right p-3 text-xs">
                  <div>{account.name}</div>
                  <div className="text-gray-500">(Debit)</div>
                </th>
              ))}
              <th className="text-right p-3 w-32">Debit Sundry</th>
              <th className="text-right p-3 w-32">Debit Sundry Amount</th>
            </tr>
          </thead>
          <tbody>
            {filteredTransactions.map((transaction, index) => (
              <tr
                key={transaction.id}
                className={`border-b ${index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}`}
              >
                <td className="p-3">
                  {new Date(transaction.transactionDate).toLocaleDateString()}
                </td>
                <td className="p-3">
                  <div>
                    <p className="font-medium">{transaction.description}</p>
                    <p className="text-sm text-gray-500">#{transaction.id}</p>
                  </div>
                </td>
                <td className="p-3">{transaction.referenceNumber || '-'}</td>
                <td className="p-3 text-right font-medium text-red-600">
                  {transaction.creditAccount?.name
                    ?.toLowerCase()
                    .includes('cash')
                    ? formatCentsToCurrency(transaction.amount)
                    : '-'}
                </td>
                {allAccountColumns.map((account) => (
                  <td
                    key={account.id}
                    className="p-3 text-right font-medium text-green-600"
                  >
                    {transaction.debitAccount?.id === account.id
                      ? formatCentsToCurrency(transaction.amount)
                      : '-'}
                  </td>
                ))}
                <td className="p-3 text-right">
                  {transaction.debitAccount?.name &&
                  !transaction.debitAccount.name
                    .toLowerCase()
                    .includes('cash') &&
                  !allAccountColumns.some(
                    (acc) => acc.id === transaction.debitAccount?.id,
                  )
                    ? transaction.debitAccount.name
                    : '-'}
                </td>
                <td className="p-3 text-right font-medium text-green-600">
                  {transaction.debitAccount?.name &&
                  !transaction.debitAccount.name
                    .toLowerCase()
                    .includes('cash') &&
                  !allAccountColumns.some(
                    (acc) => acc.id === transaction.debitAccount?.id,
                  )
                    ? formatCentsToCurrency(transaction.amount)
                    : '-'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    )
  }

  const renderGeneralJournal = () => {
    const totalDebits = filteredTransactions.reduce(
      (sum, t) => sum + t.amount,
      0,
    )
    const totalCredits = filteredTransactions.reduce(
      (sum, t) => sum + t.amount,
      0,
    )

    return (
      <div className="overflow-x-auto">
        <table className="w-full border-collapse">
          <thead>
            <tr className="border-b bg-gray-50">
              <th className="text-left p-3 w-24">Date</th>
              <th className="text-left p-3">Description</th>
              <th className="text-right p-3 w-32">Debit</th>
              <th className="text-right p-3 w-32">Credit</th>
            </tr>
          </thead>
          <tbody>
            {filteredTransactions.map((transaction, index) => (
              <tr
                key={transaction.id}
                className={`border-b ${index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}`}
              >
                <td className="p-3">
                  {new Date(transaction.transactionDate).toLocaleDateString()}
                </td>
                <td className="p-3">
                  <div className="space-y-1">
                    <p className="font-medium">
                      {transaction.debitAccount?.name &&
                      transaction.creditAccount?.name
                        ? `${transaction.debitAccount.name} / ${transaction.creditAccount.name}`
                        : transaction.debitAccount?.name ||
                          transaction.creditAccount?.name}
                    </p>
                    <p className="text-sm text-gray-500 pl-4">
                      {transaction.description}
                    </p>
                  </div>
                </td>
                <td className="p-3 text-right font-medium text-green-600">
                  {formatCentsToCurrency(transaction.amount)}
                </td>
                <td className="p-3 text-right font-medium text-red-600">
                  {formatCentsToCurrency(transaction.amount)}
                </td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr className="border-t-2 border-gray-300 bg-gray-100 font-bold">
              <td colSpan={2} className="p-3 text-right">
                Totals:
              </td>
              <td className="p-3 text-right text-green-600">
                {formatCentsToCurrency(totalDebits)}
              </td>
              <td className="p-3 text-right text-red-600">
                {formatCentsToCurrency(totalCredits)}
              </td>
            </tr>
          </tfoot>
        </table>
      </div>
    )
  }

  const renderGeneralLedger = () => {
    const accountTotals = calculateAccountTotals(filteredTransactions)
    const accountsArray = Object.entries(accountTotals).map(([id, data]) => ({
      id,
      ...data,
    }))

    return (
      <div className="overflow-x-auto">
        <table className="w-full border-collapse">
          <thead>
            <tr className="border-b bg-gray-50">
              <th className="text-left p-3">Account Code</th>
              <th className="text-left p-3">Account Name</th>
              <th className="text-right p-3">Total Debits</th>
              <th className="text-right p-3">Total Credits</th>
              <th className="text-right p-3">Balance</th>
            </tr>
          </thead>
          <tbody>
            {accountsArray.map((account, index) => {
              const balance = account.debit - account.credit
              return (
                <tr
                  key={account.id}
                  className={`border-b ${index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}`}
                >
                  <td className="p-3 font-medium">{account.code}</td>
                  <td className="p-3">{account.name}</td>
                  <td className="p-3 text-right font-medium text-green-600">
                    {formatCentsToCurrency(account.debit)}
                  </td>
                  <td className="p-3 text-right font-medium text-red-600">
                    {formatCentsToCurrency(account.credit)}
                  </td>
                  <td
                    className={`p-3 text-right font-medium ${balance >= 0 ? 'text-green-600' : 'text-red-600'}`}
                  >
                    {formatCentsToCurrency(Math.abs(balance))}
                  </td>
                </tr>
              )
            })}
          </tbody>
          <tfoot>
            <tr className="border-t-2 border-gray-300 bg-gray-100 font-bold">
              <td colSpan={2} className="p-3 text-right">
                Grand Totals:
              </td>
              <td className="p-3 text-right text-green-600">
                {formatCentsToCurrency(
                  accountsArray.reduce((sum, acc) => sum + acc.debit, 0),
                )}
              </td>
              <td className="p-3 text-right text-red-600">
                {formatCentsToCurrency(
                  accountsArray.reduce((sum, acc) => sum + acc.credit, 0),
                )}
              </td>
              <td className="p-3 text-right">
                {formatCentsToCurrency(
                  Math.abs(
                    accountsArray.reduce((sum, acc) => sum + acc.debit, 0) -
                      accountsArray.reduce((sum, acc) => sum + acc.credit, 0),
                  ),
                )}
              </td>
            </tr>
          </tfoot>
        </table>
      </div>
    )
  }

  const renderTable = () => {
    switch (bookType) {
      case transactionCategoryBookTypes.cashReceiptJournal:
        return renderCashReceiptsJournal()
      case transactionCategoryBookTypes.cashDisbursementJournal:
        return renderCashDisbursementsJournal()
      case transactionCategoryBookTypes.generalJournal:
        return renderGeneralJournal()
      case transactionCategoryBookTypes.generalLedger:
        return renderGeneralLedger()
      default:
        return renderGeneralJournal()
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
