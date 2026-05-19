import { formatCentsToCurrency } from "@bir-notebook/shared/helpers/currency"
import type { ColumnDef } from "@tanstack/react-table"
import { createColumnHelper } from "@tanstack/react-table"
import { Checkbox } from "@/components/ui/checkbox"
import { cn } from "@/lib/utils"
import type { Transaction } from "@/types/transaction"
import { StatusBadge } from "../status-badge"
import { TransactionActions } from "../transaction-actions"
import { TransferedGLBadge } from "../transfered-gl-badge"
import {
	COLUMNAR_FIXED_COLUMNS,
	type ColumnarBookConfig,
	getChartOfAccounts,
} from "../utils"

const columnHelper = createColumnHelper<Transaction>()

export const createCashReceiptsColumns = (
	onRecordAction: (action: "record" | "undo", transaction: Transaction) => void,
	transactions: Transaction[],
	config: ColumnarBookConfig,
): ColumnDef<Transaction>[] => {
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

	return [
		columnHelper.display({
			id: "select",
			header: ({ table }) => (
				<Checkbox
					checked={table.getIsAllPageRowsSelected()}
					onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
					aria-label="Select all"
				/>
			),
			cell: ({ row }) => (
				<Checkbox
					checked={row.getIsSelected()}
					onCheckedChange={(value) => row.toggleSelected(!!value)}
					aria-label="Select row"
				/>
			),
			enableSorting: false,
			enableHiding: false,
		}),

		columnHelper.accessor("transactionDate", {
			header: "Date",
			cell: (info) =>
				new Date(info.getValue()).toLocaleString("default", {
					dateStyle: "medium",
				}),
		}),

		columnHelper.display({
			id: "description",
			header: "Description",
			cell: ({ row }) => {
				const glTransfered = !!row.original.transferredToGlAt
				return (
					<div className="flex items-center gap-2">
						<div className="flex-1">
							<p className="font-medium">{row.original.description}</p>
						</div>
						<StatusBadge recorded={!!row.original.recorded} />
						{glTransfered ? <TransferedGLBadge /> : null}
					</div>
				)
			},
		}),

		columnHelper.display({
			id: "reference",
			header: "Reference",
			cell: ({ row }) => row.original.referenceNumber || "-",
		}),

		...allAccountColumns.map((account) =>
			columnHelper.display({
				id: `credit-${String(account.id)}`,
				header: () => (
					<div className="text-right text-xs">
						<div>{account.name}</div>
					</div>
				),
				cell: ({ row }) => {
					const matchedCreditAccount =
						row.original.creditAccount?.code === account.code
					const matchedDebitAccount =
						row.original.debitAccount?.code === account.code

					const hasMatched = matchedCreditAccount || matchedDebitAccount

					return (
						<div
							className={cn(
								"text-right font-medium",
								matchedCreditAccount && "text-destructive",
								matchedDebitAccount && "text-success",
							)}
						>
							{hasMatched ? formatCentsToCurrency(row.original.amount) : "-"}
						</div>
					)
				},
			}),
		),

		columnHelper.display({
			id: "creditSundry",
			header: () => <div className="text-right">Credit Sundry</div>,
			cell: ({ row }) => {
				const isSundry =
					row.original.creditAccount?.name &&
					!row.original.creditAccount.name.toLowerCase().includes("cash") &&
					!allAccountColumns.some(
						(acc) => acc.code === row.original.creditAccount?.code,
					)
				return (
					<div className="text-right">
						{isSundry ? row.original.creditAccount?.name : "-"}
					</div>
				)
			},
		}),

		columnHelper.display({
			id: "creditSundryAmount",
			header: () => <div className="text-right">Credit Sundry Amount</div>,
			cell: ({ row }) => {
				const isSundry =
					row.original.creditAccount?.name &&
					!row.original.creditAccount.name.toLowerCase().includes("cash") &&
					!allAccountColumns.some(
						(acc) => acc.code === row.original.creditAccount?.code,
					)
				return (
					<div className="text-right font-medium text-destructive">
						{isSundry ? formatCentsToCurrency(row.original.amount) : "-"}
					</div>
				)
			},
		}),

		columnHelper.display({
			id: "actions",
			header: () => <div className="text-center">Actions</div>,
			cell: ({ row }) => (
				<div className="flex justify-center">
					<TransactionActions
						transaction={row.original}
						onRecord={() => onRecordAction("record", row.original)}
						onUndo={() => onRecordAction("undo", row.original)}
					/>
				</div>
			),
			enableSorting: false,
			enableHiding: false,
		}),
	]
}
