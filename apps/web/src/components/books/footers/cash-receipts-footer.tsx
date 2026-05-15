import { formatCentsToCurrency } from "@bir-notebook/shared/helpers/currency"
import type { Transaction } from "@/types/transaction"
import {
	COLUMNAR_FIXED_COLUMNS,
	type ColumnarBookConfig,
	getChartOfAccounts,
} from "../utils"
import { cn } from "@/lib/utils"

type CashReceiptsFooterProps = {
	transactions: Transaction[]
	config: ColumnarBookConfig
}

export function CashReceiptsFooter({
	transactions,
	config,
}: CashReceiptsFooterProps) {
	const chartOfAccounts = getChartOfAccounts(transactions)
	const configuredColumns = config.columnSize - COLUMNAR_FIXED_COLUMNS
	const selectedCodes = config.columns.slice(0, configuredColumns)
	const displayAccounts = selectedCodes.map((code, index) => {
		const account = chartOfAccounts.find((entry) => entry.code === code)
		return (
			account ?? {
				id: `configured-${code}-${index}`,
				name: `Account ${code}`,
				code,
			}
		)
	})
	const remainingAccountSlots = configuredColumns - displayAccounts.length
	const placeholderAccounts = Array.from(
		{ length: remainingAccountSlots },
		(_, i) => ({
			id: `placeholder-${i}`,
			name: `Account ${i + 1}`,
			code: `000${i + 1}`,
		}),
	)

	const allAccountColumns = [...displayAccounts, ...placeholderAccounts]

	const accountTotals = allAccountColumns.map((account) => {
		const totalCredit = transactions
			.filter((t) => t.creditAccount?.code === account.code)
			.reduce((sum, t) => sum + t.amount, 0)

		const totalDebitCash = transactions
			.filter(
				(t) =>
					t.debitAccount?.name?.toLowerCase().includes("cash") ||
					t.debitAccount?.code === "1101",
			)
			.reduce((sum, t) => sum + t.amount, 0)
		return { account, totalCredit, totalDebitCash }
	})

	const sundryTotal = transactions
		.filter(
			(t) =>
				t.creditAccount?.name &&
				!t.creditAccount.name.toLowerCase().includes("cash") &&
				!allAccountColumns.some((acc) => acc.code === t.creditAccount?.code),
		)
		.reduce((sum, t) => sum + t.amount, 0)

	// Calculate total number of columns for colspan
	// Date + Description + Reference = 3 columns
	const staticColumns = 3
	// +4 for Debit Cash, Credit Sundry, Credit Sundry Amount, Actions

	return (
		<tfoot>
			<tr className="bg-muted font-bold border-t border-border">
				<td colSpan={staticColumns + 1} className="p-3 text-right">
					Totals:
				</td>

				{/* Credit Account Totals */}
				{accountTotals.map(({ account, totalDebitCash, totalCredit }) => {
					const matchedDebitAccount = account.code === "1101"
					const matchedCreditAccount = account.code !== "1101"
					return (
						<td
							key={String(account.id)}
							className={cn(
								"p-2 text-right",
								matchedDebitAccount && "text-success",
								matchedCreditAccount && "text-destructive",
							)}
						>
							{matchedDebitAccount && formatCentsToCurrency(totalDebitCash)}
							{matchedCreditAccount && formatCentsToCurrency(totalCredit)}
						</td>
					)
				})}

				{/* Credit Sundry Total */}
				<td />

				{/* Credit Sundry Amount Total */}
				<td className="p-2 text-right text-destructive">
					{formatCentsToCurrency(sundryTotal)}
				</td>

				{/* Actions column (empty) */}
				<td></td>
			</tr>
		</tfoot>
	)
}
