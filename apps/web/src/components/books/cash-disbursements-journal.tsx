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
import { useFilters } from "@/hooks/use-filters"
import {
	DEFAULT_LIST_META,
	DEFAULT_PAGE_INDEX,
	DEFAULT_PAGE_SIZE,
} from "@/lib/constants"
import type {
	Transaction,
	TransactionListQueryParam,
} from "@/types/transaction"
import { BooksDataTable } from "./books-data-table"
import { BulkActionBar } from "./bulk-action-bar"
import { createCashDisbursementsColumns } from "./columns/cash-disbursements-columns"
import { CashDisbursementsFooter } from "./footers/cash-disbursements-footer"

interface CashDisbursementsJournalProps {
	filters: TransactionListQueryParam
	columnCount?: number
	onRecordAction: (action: "record" | "undo", transaction: Transaction) => void
}

export function CashDisbursementsJournal({
	filters,
	columnCount = 6,
	onRecordAction,
}: CashDisbursementsJournalProps) {
	const { setFilters } = useFilters("/(app)/books")

	const { data: transactionsData, status } = useSuspenseQuery(
		transactionsOptions({
			...filters,
			bookType: transactionCategoryBookTypes.cashDisbursementJournal,
		}),
	)

	const columns = createCashDisbursementsColumns(
		onRecordAction,
		transactionsData?.data || [],
		columnCount,
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
				pageIndex: filters?.page ? +filters.page : DEFAULT_PAGE_INDEX,
				pageSize: filters?.limit ? +filters.limit : DEFAULT_PAGE_SIZE,
			},
		},
		onPaginationChange: (updater) => {
			const pagination =
				typeof updater === "function"
					? updater(table.getState().pagination)
					: updater
			setFilters({
				page: pagination.pageIndex,
				limit: pagination.pageSize,
			})
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
		<BooksDataTable
			columns={columns}
			meta={transactionsData?.meta || DEFAULT_LIST_META}
			table={table}
			dataStatus={status}
			footer={
				<CashDisbursementsFooter
					transactions={transactionsData?.data || []}
					columnCount={columnCount}
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
	)
}
