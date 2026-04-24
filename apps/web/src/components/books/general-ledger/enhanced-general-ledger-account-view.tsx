import { useSuspenseQuery } from "@tanstack/react-query"
import { Card, CardContent } from "@/components/ui/card"
import { generalLedgerViewOptions } from "@/hooks/api/transaction"
import type { TransactionListQueryParam } from "@/types/transaction"
import { EnhancedGeneralLedgerView } from "./enhanced-general-ledger-view"

type EnhancedGeneralLedgerAccountViewProps = {
	accountId: number
	filters: Partial<TransactionListQueryParam>
}

export function EnhancedGeneralLedgerAccountView({
	accountId,
	filters,
}: EnhancedGeneralLedgerAccountViewProps) {
	const dateFrom =
		filters.dateFrom ||
		new Date(new Date().getFullYear(), 0, 1).toISOString().split("T")[0]
	const dateTo = filters.dateTo || new Date().toISOString().split("T")[0]

	const { data: ledgerData } = useSuspenseQuery({
		...generalLedgerViewOptions({ accountId, dateFrom, dateTo }),
	})

	return (
		<div className="space-y-6">
			{ledgerData.status === "success" ? (
				<EnhancedGeneralLedgerView ledgerView={ledgerData.data} />
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
