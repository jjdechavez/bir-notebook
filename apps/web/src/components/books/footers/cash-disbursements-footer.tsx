import { formatCentsToCurrency } from "@bir-notebook/shared/helpers/currency"
import {
	COLUMNAR_FIXED_COLUMNS,
	getChartOfAccounts,
	type ColumnarBookConfig,
} from "../utils"
import type { Transaction } from "@/types/transaction"
import { cn } from "@/lib/utils"

interface CashDisbursementsFooterProps {
	transactions: Array<Transaction>
	config: ColumnarBookConfig
}

export function CashDisbursementsFooter({
	transactions,
	config,
}: CashDisbursementsFooterProps) {
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
	console.log(allAccountColumns)

	// Calculate totals
	const accountTotals = allAccountColumns.map((account) => {
		const totalDebit = transactions
			.filter((t) => t.debitAccount?.code === account.code)
			.reduce((sum, t) => sum + t.amount, 0)

		const totalCredit = transactions
			.filter(
				(t) =>
					t.creditAccount?.name?.toLowerCase().includes("cash") ||
					t.creditAccount?.code === "1101",
			)
			.reduce((sum, t) => sum + t.amount, 0)
		return { account, totalDebit, totalCredit }
	})

	const sundryTotal = transactions
		.filter(
			(t) =>
				t.debitAccount?.name &&
				!t.debitAccount.name.toLowerCase().includes("cash") &&
				!allAccountColumns.some((acc) => acc.code === t.debitAccount?.code),
		)
		.reduce((sum, t) => sum + t.amount, 0)

	// Calculate total number of columns for colspan
	// Date + Description + Reference = 3 columns
	const staticColumns = 3
	// +4 for Credit Cash, Debit Sundry, Debit Sundry Amount, Actions

	return (
		<tfoot>
			<tr className="bg-muted/50 font-bold">
				<td colSpan={staticColumns + 1} className="p-2 text-right">
					Totals:
				</td>

				{/* Debit Account Totals */}
				{accountTotals.map(({ account, totalCredit, totalDebit }) => {
					const matchedCreditAccount = account.code === "1101"
					const matchedDebitAccount = account.code !== "1101"
					return (
						<td
							key={String(account.id)}
							className={cn(
								"p-2 text-right",
								matchedDebitAccount && "text-success",
								matchedCreditAccount && "text-destructive",
							)}
						>
							{matchedCreditAccount && formatCentsToCurrency(totalCredit)}
							{matchedDebitAccount && formatCentsToCurrency(totalDebit)}
						</td>
					)
				})}

				{/* Debit Sundry Total */}
				<td />

				{/* Debit Sundry Amount Total */}
				<td className="p-2 text-right text-success">
					{formatCentsToCurrency(sundryTotal)}
				</td>

				{/* Actions column (empty) */}
				<td></td>
			</tr>
		</tfoot>
	)
}
