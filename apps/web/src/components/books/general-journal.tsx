import { transactionCategoryBookTypes } from "@bir-notebook/shared/models/transaction"
import { useSuspenseQuery } from "@tanstack/react-query"
import {
	getCoreRowModel,
	getPaginationRowModel,
	useReactTable,
} from "@tanstack/react-table"
import { transactionsOptions } from "@/hooks/api/transaction"
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
import { createGeneralJournalColumns } from "./columns/general-journal-columns"
import { GeneralJournalFooter } from "./footers/general-journal-footer"

interface GeneralJournalProps {
	filters: TransactionListQueryParam
	onRecordAction: (action: "record" | "undo", transaction: Transaction) => void
}

export function GeneralJournal({
	filters,
	onRecordAction,
}: GeneralJournalProps) {
	const { setFilters } = useFilters("/(app)/books")

	const { data: transactionsData, status } = useSuspenseQuery(
		transactionsOptions({
			...filters,
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
						console.log("Bulk record:", transactions)
					}}
					onUndoSelected={() => {
						const selectedRows = table.getSelectedRowModel().rows
						const transactions = selectedRows.map((row) => row.original)
						console.log("Bulk undo:", transactions)
					}}
					onClearSelection={() => table.resetRowSelection()}
				/>
			}
		/>
	)
}
