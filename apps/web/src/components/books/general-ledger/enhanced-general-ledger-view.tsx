import { useState } from 'react'
import { formatCentsToCurrency } from '@bir-notebook/shared/helpers/currency'
import { ChevronDown, ChevronRight, Download } from 'lucide-react'
import type { GeneralLedgerView } from '@/types/general-ledger'
import { Button } from '@/components/ui/button'
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { formatDate, formatMonth } from '@/lib/general-ledger-helpers'

type GeneralLedgerViewProps = {
  ledgerView: GeneralLedgerView
  onExportClick?: () => void
}

export function EnhancedGeneralLedgerView({
  ledgerView,
  onExportClick,
}: GeneralLedgerViewProps) {
  const [expandedMonths, setExpandedMonths] = useState<Set<string>>(new Set())

  const toggleMonth = (month: string) => {
    const newExpanded = new Set(expandedMonths)
    if (newExpanded.has(month)) {
      newExpanded.delete(month)
    } else {
      newExpanded.add(month)
    }
    setExpandedMonths(newExpanded)
  }

  const formatBalance = (balance: number, type: 'debit' | 'credit') => {
    const absBalance = Math.abs(balance)
    const color =
      type === 'debit'
        ? 'text-success-foreground'
        : 'text-destructive-foreground'
    const sign = balance >= 0 ? '' : '-'

    return (
      <span className={color}>
        {sign}
        {formatCentsToCurrency(absBalance)}
      </span>
    )
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-xl">
              {ledgerView.account.code} - {ledgerView.account.name}
            </CardTitle>
            <p className="text-sm text-muted-foreground mt-1">
              Period: {formatDate(ledgerView.dateRange.from)} -{' '}
              {formatDate(ledgerView.dateRange.to)}
            </p>
          </div>
          <div className="flex gap-2">
            {onExportClick && (
              <Button
                variant="outline"
                onClick={onExportClick}
                className="flex items-center gap-2"
              >
                <Download className="h-4 w-4" />
                Export
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center">
              <p className="text-sm text-muted-foreground">Total Debits</p>
              <p className="text-lg font-bold text-success-foreground">
                {formatCentsToCurrency(ledgerView.grandTotal.totalDebits)}
              </p>
            </div>
            <div className="text-center">
              <p className="text-sm text-muted-foreground">Total Credits</p>
              <p className="text-lg font-bold text-destructive-foreground">
                {formatCentsToCurrency(ledgerView.grandTotal.totalCredits)}
              </p>
            </div>
            <div className="text-center">
              <p className="text-sm text-muted-foreground">Final Balance</p>
              <p className="text-lg font-bold">
                {formatBalance(
                  ledgerView.grandTotal.finalBalance,
                  ledgerView.grandTotal.balanceType,
                )}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="space-y-4">
        {ledgerView.months.map((monthData) => (
          <Card key={monthData.month}>
            <Collapsible
              open={expandedMonths.has(monthData.month)}
              onOpenChange={() => toggleMonth(monthData.month)}
            >
              <CollapsibleTrigger className="w-full">
                <CardHeader className="flex flex-row items-center justify-between cursor-pointer transition-colors">
                  <div className="flex items-center gap-3">
                    {expandedMonths.has(monthData.month) ? (
                      <ChevronDown className="h-4 w-4" />
                    ) : (
                      <ChevronRight className="h-4 w-4" />
                    )}
                    <CardTitle className="text-lg">
                      {formatMonth(monthData.month)}
                    </CardTitle>
                    <Badge
                      variant={
                        monthData.periodClosing.balanceType === 'debit'
                          ? 'default'
                          : 'secondary'
                      }
                    >
                      {monthData.periodClosing.balanceType.toUpperCase()}
                    </Badge>
                  </div>
                  <div className="text-right mr-6">
                    <p className="text-sm text-muted-foreground">
                      Closing Balance
                    </p>
                    <p className="font-medium">
                      {formatBalance(
                        monthData.periodClosing.runningBalance,
                        monthData.periodClosing.balanceType,
                      )}
                    </p>
                  </div>
                </CardHeader>
              </CollapsibleTrigger>

              <CollapsibleContent className="mt-4">
                <CardContent className="space-y-4">
                  {/* Opening Balance */}
                  <div className="flex justify-between items-center p-3 bg-info rounded">
                    <span className="font-medium text-blue-400 dark:text-info-foreground">
                      Opening Balance
                    </span>
                    <span className="font-medium">
                      {formatBalance(
                        monthData.openingBalance,
                        monthData.openingBalance >= 0 ? 'debit' : 'credit',
                      )}
                    </span>
                  </div>

                  {/* Transactions Table */}
                  <div className="overflow-x-auto">
                    <table className="w-full border-collapse">
                      <thead>
                        <tr className="border-b bg-muted">
                          <th className="text-left p-3">Date</th>
                          <th className="text-left p-3">Description</th>
                          <th className="text-left p-3">Reference</th>
                          <th className="text-left p-3">Counterpart Account</th>
                          <th className="text-right p-3">Debit</th>
                          <th className="text-right p-3">Credit</th>
                          {monthData.transactions.some(
                            (t) => t.isTransferred,
                          ) && <th className="text-center p-3">Status</th>}
                        </tr>
                      </thead>
                      <tbody>
                        {monthData.transactions.map((transaction) => (
                          <tr
                            key={transaction.id}
                            className={`border-b ${transaction.isTransferred ? 'bg-success/50 dark:bg-success/20' : ''}`}
                          >
                            <td className="p-3">
                              {formatDate(transaction.date)}
                            </td>
                            <td className="p-3">{transaction.description}</td>
                            <td className="p-3 text-sm">
                              {transaction.referenceNumber || '-'}
                            </td>
                            <td className="p-3">
                              <div>
                                <span className="font-mono text-sm">
                                  {transaction.counterpartAccount.code}
                                </span>
                                <div className="text-sm text-muted-foreground">
                                  {transaction.counterpartAccount.name}
                                </div>
                              </div>
                            </td>
                            <td className="p-3 text-right font-medium text-success-foreground">
                              {transaction.debitAmount
                                ? formatCentsToCurrency(transaction.debitAmount)
                                : '-'}
                            </td>
                            <td className="p-3 text-right font-medium text-destructive-foreground">
                              {transaction.creditAmount
                                ? formatCentsToCurrency(
                                    transaction.creditAmount,
                                  )
                                : '-'}
                            </td>
                            {monthData.transactions.some(
                              (t) => t.isTransferred,
                            ) && (
                              <td className="p-3 text-center">
                                {transaction.isTransferred && (
                                  <Badge
                                    variant="secondary"
                                    className="text-xs"
                                  >
                                    Transferred
                                  </Badge>
                                )}
                              </td>
                            )}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  <Separator />

                  {/* Period Closing */}
                  <div className="grid grid-cols-2 gap-4 p-4 bg-muted rounded border">
                    <div>
                      <h4 className="font-medium mb-2">Period Summary</h4>
                      <div className="space-y-1 text-sm">
                        <div className="flex justify-between">
                          <span>Total Debits:</span>
                          <span className="text-success-foreground font-medium">
                            {formatCentsToCurrency(
                              monthData.periodClosing.totalDebits,
                            )}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span>Total Credits:</span>
                          <span className="text-destructive-foreground font-medium">
                            {formatCentsToCurrency(
                              monthData.periodClosing.totalCredits,
                            )}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span>Net Amount:</span>
                          <span className="font-medium">
                            {formatBalance(
                              monthData.periodClosing.netAmount,
                              monthData.periodClosing.balanceType,
                            )}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div>
                      <h4 className="font-medium mb-2">Closing Balance</h4>
                      <div className="text-center p-3 bg-card rounded border">
                        <p className="text-2xl font-bold">
                          {formatBalance(
                            monthData.periodClosing.runningBalance,
                            monthData.periodClosing.balanceType,
                          )}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {monthData.periodClosing.balanceType.toUpperCase()}
                        </p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </CollapsibleContent>
            </Collapsible>
          </Card>
        ))}
      </div>

      {/* Grand Total Footer */}
      <Card className="bg-muted/50 dark:bg-muted/30 border-2">
        <CardContent className="pt-6">
          <div className="grid grid-cols-4 gap-4">
            <div>
              <h4 className="font-medium text-sm text-muted-foreground mb-1">
                Total Transactions
              </h4>
              <p className="text-lg font-bold">
                {ledgerView.months.reduce(
                  (sum, month) => sum + month.transactions.length,
                  0,
                )}
              </p>
            </div>
            <div>
              <h4 className="font-medium text-sm text-muted-foreground mb-1">
                Total Debits
              </h4>
              <p className="text-lg font-bold text-success-foreground">
                {formatCentsToCurrency(ledgerView.grandTotal.totalDebits)}
              </p>
            </div>
            <div>
              <h4 className="font-medium text-sm text-muted-foreground mb-1">
                Total Credits
              </h4>
              <p className="text-lg font-bold text-destructive-foreground">
                {formatCentsToCurrency(ledgerView.grandTotal.totalCredits)}
              </p>
            </div>
            <div>
              <h4 className="font-medium text-sm text-muted-foreground mb-1">
                Final Balance
              </h4>
              <p className="text-lg font-bold">
                {formatBalance(
                  ledgerView.grandTotal.finalBalance,
                  ledgerView.grandTotal.balanceType,
                )}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
