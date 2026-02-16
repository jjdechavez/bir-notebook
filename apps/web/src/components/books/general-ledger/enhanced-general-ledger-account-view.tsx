import { useSuspenseQuery } from '@tanstack/react-query'
import { type GeneralLedgerView } from '@/types/general-ledger'
import { EnhancedGeneralLedgerView } from './enhanced-general-ledger-view'
import type { TransactionSearch } from '@/types/transaction'
import { tuyau } from '@/main'
import { Card, CardContent } from '@/components/ui/card'

type EnhancedGeneralLedgerAccountViewProps = {
  accountId: number
  filters: Partial<TransactionSearch>
}

export function EnhancedGeneralLedgerAccountView({
  accountId,
  filters,
}: EnhancedGeneralLedgerAccountViewProps) {
  const dateFrom =
    filters.dateFrom ||
    new Date(new Date().getFullYear(), 0, 1).toISOString().split('T')[0]
  const dateTo = filters.dateTo || new Date().toISOString().split('T')[0]

  const { data: ledgerData, isLoading: isGlLoading } = useSuspenseQuery(
    tuyau.api.transactions['general-ledger'].view.$get.queryOptions(
      {
        payload: {
          accountId,
          dateFrom,
          dateTo,
        },
      },
      { enabled: !!accountId },
    ),
  )

  return (
    <div className="space-y-6">
      {ledgerData?.data ? (
        <EnhancedGeneralLedgerView
          ledgerView={ledgerData.data as GeneralLedgerView}
        />
      ) : (
        <Card>
          <CardContent className="text-center py-8">
            <p className="text-muted-foreground">
              No General Ledger transactions found for this account.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
