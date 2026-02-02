import { useQuery } from '@tanstack/react-query'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { formatCentsToCurrency } from '@bir-notebook/shared/helpers/currency'
import { formatDate, formatDateTime } from '@/lib/general-ledger-helpers'
import type { TransferHistoryItem } from '@/types/general-ledger'
import { Clock, FileText, ArrowRight } from 'lucide-react'
import { Spinner } from '@/components/ui/spinner'
import { tuyau } from '@/main'

type TransferHistoryProps = {
  transferGroupId?: string
}

export function TransferHistory({ transferGroupId }: TransferHistoryProps) {
  const { data: history, status } = useQuery(
    tuyau.api.transactions['transfer-history'].$get.queryOptions({
      params: transferGroupId ? { transferGroupId } : undefined,
    }),
  )

  if (status === 'pending') {
    return (
      <div className="flex items-center justify-center py-8">
        <Spinner />
      </div>
    )
  }

  if (!history || history.data.length === 0) {
    return (
      <Card>
        <CardContent className="py-12">
          <div className="text-center text-muted-foreground">
            <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p className="text-lg font-medium mb-2">No Transfer History</p>
            <p className="text-sm">
              {transferGroupId
                ? 'No transfers found for this group.'
                : 'No transfers have been made yet.'}
            </p>
          </div>
        </CardContent>
      </Card>
    )
  }

  const transfers = transferGroupId
    ? history.data.filter(
        (item: TransferHistoryItem) => item.transferGroupId === transferGroupId,
      )
    : history.data

  // Group by transfer group
  const groupedTransfers = transfers.reduce(
    (groups: Record<string, TransferHistoryItem[]>, transfer) => {
      if (!groups[transfer.transferGroupId]) {
        groups[transfer.transferGroupId] = []
      }
      groups[transfer.transferGroupId].push(transfer)
      return groups
    },
    {},
  )

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Transfer History</h3>
        <Badge variant="outline">
          {Object.keys(groupedTransfers).length} transfer group
          {Object.keys(groupedTransfers).length !== 1 ? 's' : ''}
        </Badge>
      </div>

      {Object.entries(groupedTransfers).map(([groupId, groupTransfers]) => (
        <Card key={groupId}>
          <CardHeader>
            <CardTitle className="text-base flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4" />
                Transfer Group: {groupId}
              </div>
              <Badge variant="secondary">
                {groupTransfers.length} transaction
                {groupTransfers.length !== 1 ? 's' : ''}
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {/* Transfer summary */}
              <div className="bg-blue-50 p-3 rounded-lg">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div>
                    <span className="text-muted-foreground">
                      Transfer Date:
                    </span>
                    <p className="font-medium">
                      {formatDateTime(groupTransfers[0].transferredToGlAt)}
                    </p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Total Amount:</span>
                    <p className="font-medium">
                      {formatCentsToCurrency(
                        groupTransfers.reduce((sum, t) => sum + t.amount, 0),
                      )}
                    </p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Categories:</span>
                    <p className="font-medium">
                      {new Set(groupTransfers.map((t) => t.category.name)).size}{' '}
                      types
                    </p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Accounts:</span>
                    <p className="font-medium">
                      {
                        new Set([
                          ...groupTransfers.map((t) => t.debitAccount.code),
                          ...groupTransfers.map((t) => t.creditAccount.code),
                        ]).size
                      }{' '}
                      accounts
                    </p>
                  </div>
                </div>
              </div>

              {/* Transaction list */}
              <div className="space-y-2">
                {groupTransfers.map((transfer) => (
                  <div
                    key={transfer.id}
                    className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-3">
                        <span className="text-sm text-muted-foreground">
                          {formatDate(transfer.transactionDate)}
                        </span>
                        <span className="font-medium">
                          {transfer.description}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge variant="outline" className="text-xs">
                          {transfer.category.name}
                        </Badge>
                        <div className="flex items-center text-sm text-muted-foreground">
                          <span className="font-mono">
                            {transfer.debitAccount.code}
                          </span>
                          <ArrowRight className="h-3 w-3 mx-1" />
                          <span className="font-mono">
                            {transfer.creditAccount.code}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="text-right ml-4">
                      <p className="font-semibold">
                        {formatCentsToCurrency(transfer.amount)}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {transfer.debitAccount.name}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
