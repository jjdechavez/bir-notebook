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

  const {
    data: transactionsData,
    isLoading,
    error,
  } = useQuery(tuyau.api.transactions.$get.queryOptions({ payload: filters }))

  const handlePageChange = (newPage: number) => {
    setFilters((prev) => ({ ...prev, page: newPage }))
  }

  const handleFilterChange = (key: string, value: any) => {
    setFilters((prev) => ({ ...prev, [key]: value, page: 1 }))
  }

  if (isLoading) return <div>Loading transactions...</div>
  if (error) return <div>Error loading transactions</div>

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Transactions</span>
            <div className="flex items-center gap-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Search transactions..."
                  value={filters.search}
                  onChange={(e) => handleFilterChange('search', e.target.value)}
                  className="pl-10 w-64"
                />
              </div>
              <Button variant="outline" size="sm">
                <Filter className="h-4 w-4 mr-2" />
                Filters
              </Button>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {/* Filters */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div>
              <label className="block text-sm font-medium mb-2">
                Book Type
              </label>
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
              <label className="block text-sm font-medium mb-2">
                Date From
              </label>
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

          {/* Transactions Table */}
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-3">Date</th>
                  <th className="text-left p-3">Description</th>
                  <th className="text-left p-3">Category</th>
                  <th className="text-left p-3">Book</th>
                  <th className="text-left p-3">Debit Account</th>
                  <th className="text-left p-3">Credit Account</th>
                  <th className="text-right p-3">Amount</th>
                  <th className="text-left p-3">VAT</th>
                  <th className="text-left p-3">Reference</th>
                </tr>
              </thead>
              <tbody>
                {transactionsData?.data?.map((transaction) => (
                  <tr
                    key={transaction.id}
                    className="border-b hover:bg-gray-50"
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
                          ID: {transaction.id}
                        </p>
                      </div>
                    </td>
                    <td className="p-3">
                      {transaction.category?.name || 'N/A'}
                    </td>
                    <td className="p-3">
                      <Badge variant="outline">
                        {formatOption(
                          transactionCategoryBookTypeOptions,
                          transaction.bookType,
                        )}
                      </Badge>
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
                    <td className="p-3 text-right font-medium">
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
                        {formatOption(
                          transactionVatTypeOptions,
                          transaction.vatType,
                        )}
                      </Badge>
                      {transaction.vatAmount > 0 && (
                        <p className="text-xs text-gray-500 mt-1">
                          {formatCentsToCurrency(transaction.vatAmount)}
                        </p>
                      )}
                    </td>
                    <td className="p-3">
                      {transaction.referenceNumber || '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {transactionsData?.meta && (
            <div className="flex items-center justify-between mt-6">
              <div className="text-sm text-gray-600">
                Showing{' '}
                {(transactionsData.meta.currentPage - 1) *
                  transactionsData.meta.perPage +
                  1}{' '}
                to{' '}
                {Math.min(
                  transactionsData.meta.currentPage *
                    transactionsData.meta.perPage,
                  transactionsData.meta.total,
                )}{' '}
                of {transactionsData.meta.total} transactions
              </div>

              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    handlePageChange(transactionsData.meta.currentPage - 1)
                  }
                  disabled={transactionsData.meta.currentPage === 1}
                >
                  <ChevronLeft className="h-4 w-4" />
                  Previous
                </Button>

                <span className="text-sm">
                  Page {transactionsData.meta.currentPage} of{' '}
                  {transactionsData.meta.lastPage}
                </span>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    handlePageChange(transactionsData.meta.currentPage + 1)
                  }
                  disabled={
                    transactionsData.meta.currentPage ===
                    transactionsData.meta.lastPage
                  }
                >
                  Next
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
