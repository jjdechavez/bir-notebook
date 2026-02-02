import { useSuspenseQuery } from '@tanstack/react-query'
import { type GeneralLedgerView } from '@/types/general-ledger'
import { EnhancedGeneralLedgerView } from './enhanced-general-ledger-view'
import type { TransactionSearch } from '@/types/transaction'
import { tuyau } from '@/main'
import { Spinner } from '@/components/ui/spinner'

type EnhancedGeneralLedgerAccountViewProps = {
  accountId: number
  filters: Partial<TransactionSearch>
  onTransferClick?: () => void
}

export function EnhancedGeneralLedgerAccountView({
  accountId,
  filters,
  onTransferClick,
}: EnhancedGeneralLedgerAccountViewProps) {
  const dateFrom =
    filters.dateFrom ||
    new Date(new Date().getFullYear(), 0, 1).toISOString().split('T')[0]
  const dateTo = filters.dateTo || new Date().toISOString().split('T')[0]

  const { data: ledgerData, isLoading } = useSuspenseQuery(
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

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Spinner />
      </div>
    )
  }

  return (
    <EnhancedGeneralLedgerView
      ledgerView={ledgerData.data as GeneralLedgerView}
      onTransferClick={onTransferClick}
    />
  )
}
