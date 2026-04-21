import { useSuspenseQuery } from "@tanstack/react-query"
import { Card, CardContent } from "@/components/ui/card"
import { tuyau } from "@/main"
import type { GeneralLedgerView } from "@/types/general-ledger"
import type { TransactionSearch } from "@/types/transaction"
import { EnhancedGeneralLedgerView } from "./enhanced-general-ledger-view"

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
		new Date(new Date().getFullYear(), 0, 1).toISOString().split("T")[0]
	const dateTo = filters.dateTo || new Date().toISOString().split("T")[0]

	const { data: ledgerData } = useSuspenseQuery(
		tuyau.api.transactions["general-ledger"].view.$get.queryOptions(
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
