import { formatCentsToCurrency } from "@bir-notebook/shared/helpers/currency"
import { formatOption } from "@bir-notebook/shared/models/common"
import {
	type TransactionListQueryParam,
	transactionCategoryBookTypeOptions,
	transactionCategoryBookTypes,
	transactionVatTypeOptions,
} from "@bir-notebook/shared/models/transaction"
import { useSuspenseQuery } from "@tanstack/react-query"
import { createFileRoute } from "@tanstack/react-router"
import {
	type ColumnDef,
	getCoreRowModel,
	type PaginationState,
	useReactTable,
} from "@tanstack/react-table"
import { BookOpen, FileText, TrendingDown, TrendingUp } from "lucide-react"
import { useState } from "react"
import { CreateTransaction } from "@/components/create-transaction"
import {
	DataTable,
	DEFAULT_PAGE_INDEX,
	DEFAULT_PAGE_SIZE,
} from "@/components/data-table"
import { EditTransaction } from "@/components/edit-transaction"
import { TransactionCard } from "@/components/transaction-summary-card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import {
	transactionSummaryOptions,
	transactionsOptions,
} from "@/hooks/api/transaction"
import { useFilters } from "@/hooks/use-filters"
import { DEFAULT_LIST_META } from "@/lib/api"
import { authClient } from "@/lib/auth-client"
import type { Transaction } from "@/types/transaction"

export const Route = createFileRoute("/(app)/dashboard")({
	validateSearch: () =>
		({}) as Partial<PaginationState> & TransactionListQueryParam,
	loaderDeps: ({ search }) => ({
		page: (search?.pageIndex || DEFAULT_PAGE_INDEX) + 1,
		limit: search?.pageSize || DEFAULT_PAGE_SIZE,
		bookType: search?.bookType,
		dateFrom: search?.dateFrom,
		dateTo: search?.dateTo,
	}),
	loader: ({ context, deps }) => ({
		crumb: "Dashboard",
		...context.queryClient.ensureQueryData(transactionsOptions(deps)),
		...context.queryClient.ensureQueryData(transactionSummaryOptions()),
	}),
	component: DashboardComponent,
})

function DashboardComponent() {
	const { data } = authClient.useSession()

	return (
		<div className="bg-background">
			<h1 className="text-xl font-bold mb-4">
				Welcome back, {data?.user?.firstName} {data?.user?.lastName}
			</h1>
			<div className="space-y-6">
				<p className="text-muted-foreground">
					Manage your transactions with BIR-compliant record keeping
				</p>

				<TransactionSummary />
				<TransactionList />
			</div>
		</div>
	)
}

function TransactionSummary() {
	const { data } = useSuspenseQuery(transactionSummaryOptions())
	const totalIncome = data?.totalIncome || 0
	const totalExpenses = data?.totalExpenses || 0
	return (
		<div className="grid grid-cols-1 md:grid-cols-4 gap-6">
			<TransactionCard
				title="Total Income"
				description={formatCentsToCurrency(data?.totalIncome || 0)}
				icon={TrendingUp}
			/>
			<TransactionCard
				title="Total Expenses"
				description={formatCentsToCurrency(data?.totalExpenses || 0)}
				icon={TrendingDown}
				variant="expense"
			/>
			<TransactionCard
				title="Net Income"
				description={formatCentsToCurrency(data?.netIncome || 0)}
				icon={FileText}
				variant={
					totalIncome > totalExpenses ? "passiveNetIncome" : "negativeNetIncome"
				}
			/>
			<TransactionCard
				title="Chart of Accounts"
				description={data?.totalChartOfAccounts.toString() || "0"}
				icon={BookOpen}
				variant="categories"
			/>
		</div>
	)
}

const columns: ColumnDef<Transaction>[] = [
	{
		header: "Date",
		cell: ({ row }) => new Date(row.original.transactionDate).toLocaleString(),
	},
	{
		header: "Description",
		cell: ({ row, table }) => {
			const transaction = row.original
			return (
				<button
					type="button"
					className="text-primary text-start underline-offset-4 hover:underline cursor-pointer"
					onClick={() => table.options.meta?.setEdit?.(row.original)}
				>
					<p className="font-medium">{transaction.description}</p>
					<p className="text-sm text-muted-foreground">ID: {transaction.id}</p>
				</button>
			)
		},
	},
	{
		header: "Category",
		cell: ({ row }) => row.original.category?.name || "N/A",
	},
	{
		header: "Book",
		cell: ({ row }) => (
			<Badge variant="outline">
				{formatOption(
					transactionCategoryBookTypeOptions,
					row.original.bookType,
				)}
			</Badge>
		),
	},
	{
		header: "Debit Account",
		cell: ({ row }) => {
			const transaction = row.original
			return (
				<div className="text-sm">
					<p className="font-medium">{transaction.debitAccount?.name}</p>
					<p className="text-muted-foreground">
						{transaction.debitAccount?.code}
					</p>
				</div>
			)
		},
	},
	{
		header: "Credit Account",
		cell: ({ row }) => {
			const transaction = row.original
			return (
				<div className="text-sm">
					<p className="font-medium">{transaction.creditAccount?.name}</p>
					<p className="text-muted-foreground">
						{transaction.creditAccount?.code}
					</p>
				</div>
			)
		},
	},
	{
		header: "Amount",
		cell: ({ row }) => (
			<span className="text-right font-medium">
				{formatCentsToCurrency(row.original.amount)}
			</span>
		),
	},
	{
		header: "VAT",
		cell: ({ row }) => {
			const transaction = row.original
			return (
				<>
					<Badge
						variant={
							transaction.vatType === "vat_standard" ? "default" : "secondary"
						}
					>
						{formatOption(transactionVatTypeOptions, transaction.vatType)}
					</Badge>
					{transaction.vatAmount > 0 && (
						<p className="text-xs text-muted-foreground mt-1">
							{formatCentsToCurrency(transaction.vatAmount)}
						</p>
					)}
				</>
			)
		},
	},
	{
		header: "Reference",
		accessorKey: "referenceNumber",
	},
]

export function TransactionList() {
	const { filters, setFilters } = useFilters(Route.id)

	const query = {
		page: filters?.pageIndex || DEFAULT_PAGE_INDEX,
		limit: filters?.pageSize || DEFAULT_PAGE_SIZE,
	}

	const { data: transactionsData, status } = useSuspenseQuery(
		transactionsOptions({
			...filters,
			...query,
			page: query.page + 1,
			exclude: transactionCategoryBookTypes.generalLedger,
		}),
	)
	const [selectedTransaction, setSelectedTransaction] =
		useState<Transaction | null>(null)

	const table = useReactTable({
		data: transactionsData?.data || [],
		columns,
		getCoreRowModel: getCoreRowModel(),
		manualPagination: true,
		rowCount: Number(transactionsData?.meta.total || 0),
		state: {
			pagination: {
				pageIndex: query.page,
				pageSize: query.limit,
			},
		},
		onPaginationChange: (pagination) => {
			setFilters(
				typeof pagination === "function"
					? pagination({
							pageIndex: filters?.pageIndex || DEFAULT_PAGE_INDEX,
							pageSize: filters?.pageSize || DEFAULT_PAGE_SIZE,
						})
					: pagination,
			)
		},
		enableColumnFilters: false,
		filterFns: {
			fuzzy: () => true,
		},
		meta: {
			setEdit: (data) => setSelectedTransaction(data),
		},
	})

	return (
		<>
			<div className="flex justify-between items-center">
				<h1 className="text-xl font-bold">Transactions</h1>
				<CreateTransaction />
			</div>
			<div className="space-y-6">
				<div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
					<div>
						<label
							htmlFor="bookType"
							className="block text-sm font-medium mb-2"
						>
							Book Type
						</label>
						<select
							id="bookType"
							value={filters.bookType || ""}
							onChange={(e) =>
								setFilters({
									bookType: e.target
										.value as TransactionListQueryParam["bookType"],
								})
							}
							className="w-full p-2 border rounded-md"
						>
							<option value="">All Books</option>
							{transactionCategoryBookTypeOptions.map((option) => (
								<option key={option.value} value={option.value}>
									{option.label}
								</option>
							))}
						</select>
					</div>

					<div>
						<label
							htmlFor="dateFrom"
							className="block text-sm font-medium mb-2"
						>
							Date From
						</label>
						<Input
							id="dateFrom"
							type="date"
							value={filters?.dateFrom || ""}
							onChange={(e) => setFilters({ dateFrom: e.target.value })}
						/>
					</div>

					<div>
						<label htmlFor="dateTo" className="block text-sm font-medium mb-2">
							Date To
						</label>
						<Input
							id="dateTo"
							type="date"
							value={filters?.dateTo || ""}
							onChange={(e) => setFilters({ dateTo: e.target.value })}
						/>
					</div>
				</div>

				<DataTable
					columns={columns}
					className="mt-8"
					meta={transactionsData?.meta || DEFAULT_LIST_META}
					table={table}
					dataStatus={status}
				/>
			</div>
			{!selectedTransaction ? null : (
				<EditTransaction
					transaction={selectedTransaction}
					open={!!selectedTransaction}
					onToggleOpen={() => setSelectedTransaction(null)}
					onSuccess={() => setSelectedTransaction(null)}
				/>
			)}
		</>
	)
}
