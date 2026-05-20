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
import type { Transaction } from "@/types/transaction"
import { BooksDataTable } from "./books-data-table"
import { BulkActionBar } from "./bulk-action-bar"
import { createGeneralJournalColumns } from "./columns/general-journal-columns"
import { GeneralJournalFooter } from "./footers/general-journal-footer"

interface GeneralJournalProps {
	onRecordAction: (action: "record" | "undo", transaction: Transaction) => void
}

export function GeneralJournal({ onRecordAction }: GeneralJournalProps) {
	const { filters, setFilters } = useFilters("/(app)/books")

	const query = {
		page: filters?.pageIndex || DEFAULT_PAGE_INDEX,
		limit: filters?.pageSize || DEFAULT_PAGE_SIZE,
	}

	const { data: transactionsData, status } = useSuspenseQuery(
		transactionsOptions({
			...filters,
			page: query.page + 1,
			limit: query.limit,
			bookType: transactionCategoryBookTypes.generalJournal,
		}),
	)

	const columns = createGeneralJournalColumns(onRecordAction)

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
				<GeneralJournalFooter transactions={transactionsData?.data || []} />
			}
			actions={
				<BulkActionBar
					selectedCount={table.getFilteredSelectedRowModel().rows.length}
					onRecordSelected={() => {
						const selectedRows = table.getSelectedRowModel().rows
						const transactions = selectedRows.map((row) => row.original)
						const transactionIds = transactions.map((t) => t.id)
						bulkRecordTransactionsMutation.mutate({ transactionIds })
					}}
					onUndoSelected={() => {
						const selectedRows = table.getSelectedRowModel().rows
						const transactions = selectedRows.map((row) => row.original)
						const transactionIds = transactions.map((t) => t.id)
						bulkUndoRecordTransactionsMutation.mutate({ transactionIds })
					}}
					onClearSelection={() => table.resetRowSelection()}
				/>
			}
		/>
	)
}
