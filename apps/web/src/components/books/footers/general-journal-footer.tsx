import { formatCentsToCurrency } from "@bir-notebook/shared/helpers/currency"
import type { Transaction } from "@/types/transaction"

type GeneralJournalFooterProps = {
	transactions: Transaction[]
}

export function GeneralJournalFooter({
	transactions,
}: GeneralJournalFooterProps) {
	const total = transactions.reduce((sum, t) => sum + t.amount, 0)

	return (
		<tfoot>
			<tr className="border-t-2 border-accent bg-muted font-bold">
				<td colSpan={3} className="p-2 text-right">
					Totals:
				</td>
				<td className="p-2 text-right text-success">
					{formatCentsToCurrency(total)}
				</td>
				<td className="p-2 text-right text-destructive">
					{formatCentsToCurrency(total)}
				</td>
				<td />
			</tr>
		</tfoot>
	)
}
