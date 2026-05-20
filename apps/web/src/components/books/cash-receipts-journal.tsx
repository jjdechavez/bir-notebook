import { transactionCategoryBookTypes } from "@bir-notebook/shared/models/transaction"
import { useSuspenseQuery } from "@tanstack/react-query"
import {
	getCoreRowModel,
	getPaginationRowModel,
	useReactTable,
} from "@tanstack/react-table"
import { toast } from "sonner"
import {
	transactionsOptions,
	useBulkRecordTransaction,
	useBulkUndoRecordTransaction,
} from "@/hooks/api/transaction"
import { useColumnarBookConfig } from "@/hooks/use-columnar-book-config"
import { useFilters } from "@/hooks/use-filters"
import {
	DEFAULT_LIST_META,
	DEFAULT_PAGE_INDEX,
	DEFAULT_PAGE_SIZE,
} from "@/lib/constants"
import { BookColumnarFilter } from "@/routes/(app)/books"
import type { Transaction } from "@/types/transaction"
import { BooksDataTable } from "./books-data-table"
import { BulkActionBar } from "./bulk-action-bar"
import { ColumnConfigPanel } from "./column-config-panel"
import { createCashReceiptsColumns } from "./columns/cash-receipts-columns"
import { CashReceiptsFooter } from "./footers/cash-receipts-footer"

type CashReceiptsJournalProps = {
	onRecordAction: (action: "record" | "undo", transaction: Transaction) => void
}

export function CashReceiptsJournal({
	onRecordAction,
}: CashReceiptsJournalProps) {
	const { filters, setFilters } = useFilters("/(app)/books")
	const { config, setConfig, isEditing, openPanel, closePanel } =
		useColumnarBookConfig("cash_receipts")

	const query = {
		page: filters?.pageIndex || DEFAULT_PAGE_INDEX,
		limit: filters?.pageSize || DEFAULT_PAGE_SIZE,
	}

	const { data: transactionsData, status } = useSuspenseQuery(
		transactionsOptions({
			...filters,
			page: query.page + 1,
			limit: query.limit,
			bookType: transactionCategoryBookTypes.cashReceiptJournal,
		}),
	)

	const columns = createCashReceiptsColumns(
		onRecordAction,
		transactionsData?.data || [],
		config,
	)

	const table = useReactTable({
		data: transactionsData?.data || [],
		columns,
		getCoreRowModel: getCoreRowModel(),
		getPaginationRowModel: getPaginationRowModel(),
		manualPagination: true,
		rowCount: Number(transactionsData?.meta.total || 0),
		state: {
			pagination: {
				pageIndex: query.page,
				pageSize: query.limit,
			},
		},
		onPaginationChange: (updater) => {
			const state =
				typeof updater === "function"
					? updater({
							pageIndex: filters?.pageIndex || DEFAULT_PAGE_INDEX,
							pageSize: filters?.pageSize || DEFAULT_PAGE_SIZE,
						})
					: updater
			setFilters({ pageIndex: state.pageIndex, pageSize: state.pageSize })
		},
		enableRowSelection: true,
		getRowId: (row) => row.id.toString(),
	})

	const bulkRecordTransactionsMutation = useBulkRecordTransaction({
		onSuccess: () => {
			toast.success("Transactions has been recorded")
		},
	})

	const bulkUndoRecordTransactionsMutation = useBulkUndoRecordTransaction({
		onSuccess: () => {
			toast.success("Transactions record has been undo")
		},
	})

	return (
		<>
			<div className="space-y-4">
				<div className="flex items-center space-x-2">
					<BookColumnarFilter />
					<button
						type="button"
						onClick={openPanel}
						className="px-3 py-2 text-sm text-secondary-foreground border border-border rounded hover:bg-accent/40"
					>
						Configure Columns
					</button>
				</div>
				{isEditing ? (
					<ColumnConfigPanel
						config={config}
						onSave={(nextConfig) => {
							setConfig(nextConfig)
							closePanel()
						}}
						onCancel={closePanel}
					/>
				) : null}
			</div>
			<BooksDataTable
				columns={columns}
				meta={transactionsData?.meta || DEFAULT_LIST_META}
				table={table}
				dataStatus={status}
				footer={
					<CashReceiptsFooter
						transactions={transactionsData?.data || []}
						config={config}
					/>
				}
				actions={
					<BulkActionBar
						selectedCount={table.getFilteredSelectedRowModel().rows.length}
						onRecordSelected={() => {
							const selectedRows = table.getSelectedRowModel().rows
							const transactions = selectedRows.map((row) => row.original)
							bulkRecordTransactionsMutation.mutate({
								transactionIds: transactions.map((t) => t.id),
							})
						}}
						onUndoSelected={() => {
							const selectedRows = table.getSelectedRowModel().rows
							const transactions = selectedRows.map((row) => row.original)
							bulkUndoRecordTransactionsMutation.mutate({
								transactionIds: transactions.map((t) => t.id),
							})
						}}
						onClearSelection={() => table.resetRowSelection()}
					/>
				}
			/>
		</>
	)
}
