import type { ColumnDef, Table as TableType } from "@tanstack/react-table"
import { flexRender } from "@tanstack/react-table"
import type React from "react"
import { type MouseEvent, useState } from "react"

import { Field, FieldLabel } from "@/components/ui/field"
import {
	DOTS,
	getPaginationRange,
	Pagination,
	PaginationContent,
	PaginationEllipsis,
	PaginationItem,
	PaginationLink,
	PaginationNext,
	PaginationPrevious,
} from "@/components/ui/pagination"
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select"
import { Skeleton } from "@/components/ui/skeleton"
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table"
import type { ListMeta } from "@/lib/constants"
import { cn } from "@/lib/utils"

interface BooksDataTableProps<TData> {
	columns: ColumnDef<TData>[]
	meta?: ListMeta
	table: TableType<TData>
	dataStatus?: "idle" | "pending" | "error" | "success"
	footer?: React.ReactNode
	actions?: React.ReactNode
}

export function BooksDataTable<TData>({
	columns,
	meta,
	table,
	dataStatus = "idle",
	footer,
	actions,
}: BooksDataTableProps<TData>) {
	const [focusedCell, setFocusedCell] = useState<string | null>(null)
	const selectedCount = table.getSelectedRowModel().rows.length

	const handleCellClick = (
		event: MouseEvent<HTMLTableCellElement>,
		cellId: string,
	) => {
		if (
			(event.target as HTMLElement).closest(
				"button, [role=checkbox], [role=menuitem], a",
			)
		) {
			return
		}
		setFocusedCell(cellId)
	}

	return (
		<div className="space-y-4">
			{/* Custom actions/filters area */}
			{actions && <div className="flex items-center gap-4">{actions}</div>}
			{selectedCount > 0 && (
				<div className="flex flex-wrap items-center gap-x-3 gap-y-1 rounded-md border border-primary/20 bg-primary/5 px-3 py-2 text-xs text-muted-foreground">
					<span className="font-semibold text-foreground">Copy focus</span>
					<span>
						{selectedCount}{" "}
						{selectedCount === 1 ? "transaction" : "transactions"} selected.
					</span>
					<span>
						Click a date, description, reference, or amount to keep that field
						in view.
					</span>
					{focusedCell && (
						<span className="rounded bg-background px-1.5 py-0.5 font-medium text-primary">
							Focused: {formatColumnLabel(focusedCell)}
						</span>
					)}
				</div>
			)}

			{/* Table container with scroll */}
			<div className="border">
				<Table className="text-sm">
					<TableHeader>
						{table.getHeaderGroups().map((headerGroup) => (
							<TableRow
								key={headerGroup.id}
								className="bg-muted divide-x divide-border"
							>
								{headerGroup.headers.map((header) => (
									<TableHead key={header.id}>
										{flexRender(
											header.column.columnDef.header,
											header.getContext(),
										)}
									</TableHead>
								))}
							</TableRow>
						))}
					</TableHeader>

					<TableBody>
						{table.getRowModel().rows?.length ? (
							table.getRowModel().rows.map((row) => {
								return (
									<TableRow
										key={row.id}
										data-state={row.getIsSelected() ? "selected" : undefined}
										className={cn(
											"divide-x divide-border hover:bg-muted/50",
											row.getIsSelected() &&
												"bg-primary/[0.04] shadow-[inset_3px_0_0_var(--primary)] hover:bg-primary/[0.08]",
										)}
									>
										{row.getVisibleCells().map((cell) => (
											<TableCell
												key={cell.id}
												onClick={(event) =>
													handleCellClick(event, cell.column.id)
												}
												className={cn(
													"transition-colors",
													row.getIsSelected() &&
														focusedCell === cell.column.id &&
														"bg-primary/10 ring-1 ring-inset ring-primary/40",
													row.getIsSelected() && "cursor-crosshair",
												)}
											>
												{flexRender(
													cell.column.columnDef.cell,
													cell.getContext(),
												)}
											</TableCell>
										))}
									</TableRow>
								)
							})
						) : dataStatus === "pending" ? (
							// Skeleton loading rows
							["one", "two", "three", "four", "five"].map((skeletonId) => (
								<TableRow key={`skeleton-${skeletonId}`}>
									{columns.map((column) => (
										<TableCell key={column.id as string}>
											<Skeleton className="h-4 w-full" />
										</TableCell>
									))}
								</TableRow>
							))
						) : (
							<TableRow>
								<TableCell
									colSpan={columns.length}
									className="h-24 text-center"
								>
									No transactions found.
								</TableCell>
							</TableRow>
						)}
					</TableBody>

					{/* Custom footer support */}
					{footer && <>{footer}</>}
				</Table>
			</div>

			{/* Pagination */}
			{meta && (
				<Pagination className="mt-4">
					<Field orientation="horizontal" className="w-0">
						<FieldLabel htmlFor="show">Show</FieldLabel>
						<Select
							value={table.getState().pagination.pageSize.toString()}
							onValueChange={(e) => {
								table.setPageSize(+e)
							}}
						>
							<SelectTrigger>
								<SelectValue placeholder="Page" id="show" />
							</SelectTrigger>
							<SelectContent>
								{[10, 20, 30, 40, 50].map((pageSize) => (
									<SelectItem key={pageSize} value={pageSize.toString()}>
										{pageSize}
									</SelectItem>
								))}
							</SelectContent>
						</Select>
					</Field>

					<PaginationContent className="flex justify-center ml-auto">
						<PaginationItem>
							<PaginationPrevious
								onClick={() =>
									!table.getCanPreviousPage() ? undefined : table.previousPage()
								}
							/>
						</PaginationItem>
						{getPaginationRange(meta.currentPage, meta.lastPage)?.map(
							(page) => {
								const pageNumber = +page
								const tsPageIndex = pageNumber - 1
								const isCurrentPage =
									table.getState().pagination.pageIndex === tsPageIndex

								if (page === DOTS) {
									return (
										<PaginationItem>
											<PaginationEllipsis key={`ellipsis-${page}`} />
										</PaginationItem>
									)
								}

								return (
									<PaginationItem key={page}>
										<PaginationLink
											onClick={() =>
												isCurrentPage
													? undefined
													: table.setPageIndex(pageNumber)
											}
											isActive={isCurrentPage}
										>
											{page}
										</PaginationLink>
									</PaginationItem>
								)
							},
						)}
						<PaginationItem>
							<PaginationNext
								onClick={() =>
									!table.getCanNextPage() ? undefined : table.nextPage()
								}
							/>
						</PaginationItem>
					</PaginationContent>
				</Pagination>
			)}
		</div>
	)
}

function formatColumnLabel(columnId: string) {
	if (columnId === "select") return "Row"
	if (columnId === "actions") return "Actions"
	return columnId
		.replace(/^(credit|debit)-/, "")
		.replace(/([a-z])([A-Z])/g, "$1 $2")
		.replace(/[-_]/g, " ")
		.replace(/\b\w/g, (letter) => letter.toUpperCase())
}
