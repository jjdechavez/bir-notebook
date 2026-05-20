import { formatCentsToCurrency } from "@bir-notebook/shared/helpers/currency"
import type { ColumnDef } from "@tanstack/react-table"
import { createColumnHelper } from "@tanstack/react-table"
import { Checkbox } from "@/components/ui/checkbox"
import type { Transaction } from "@/types/transaction"
import { StatusBadge } from "../status-badge"
import { TransactionActions } from "../transaction-actions"
import { TransferedGLBadge } from "../transfered-gl-badge"

const columnHelper = createColumnHelper<Transaction>()

export const createGeneralJournalColumns = (
	onRecordAction: (action: "record" | "undo", transaction: Transaction) => void,
): ColumnDef<Transaction>[] => {
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
							<p className="font-medium text-sm">
								{row.original.debitAccount?.name}
							</p>
							<p className="font-medium text-sm pl-4">
								{row.original.creditAccount?.name}
							</p>
							<p className="text-sm text-muted-foreground pl-8">
								{row.original.description}
							</p>
						</div>
						<StatusBadge recorded={!!row.original.recorded} />
						{glTransfered ? <TransferedGLBadge /> : null}
					</div>
				)
			},
		}),

		columnHelper.display({
			id: "debit",
			header: () => <div className="text-right">Debit</div>,
			cell: ({ row }) => (
				<div className="text-right font-medium text-success">
					{formatCentsToCurrency(row.original.amount)}
				</div>
			),
		}),

		// Credit column
		columnHelper.display({
			id: "credit",
			header: () => <div className="text-right">Credit</div>,
			cell: ({ row }) => (
				<div className="text-right font-medium text-destructive">
					{formatCentsToCurrency(row.original.amount)}
				</div>
			),
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
