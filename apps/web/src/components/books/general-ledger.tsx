import { formatCentsToCurrency } from "@bir-notebook/shared/helpers/currency"
import { transactionCategoryBookTypes } from "@bir-notebook/shared/models/transaction"
import { useSuspenseQuery } from "@tanstack/react-query"
import { useCurrentChartOfAccounts } from "@/hooks/api/chart-of-account"
import { transactionsOptions } from "@/hooks/api/transaction"
import { useFilters } from "@/hooks/use-filters"
import { Route } from "@/routes/(app)/books"
import type { Transaction } from "@/types/transaction"
import { Skeleton } from "../ui/skeleton"
import {
	Table,
	TableBody,
	TableCell,
	TableFooter,
	TableHead,
	TableHeader,
	TableRow,
} from "../ui/table"
import { NoTransactionFound } from "./common"

export function GeneralLedger() {
	const { filters } = useFilters(Route.id)
	const { data: transactions } = useSuspenseQuery(
		transactionsOptions({
			dateFrom: filters.dateFrom,
			dateTo: filters.dateTo,
			bookType: transactionCategoryBookTypes.generalLedger,
			search: filters?.search || "",
			record: filters?.record || "",
		}),
	)

	const calculateAccountTotals = (transactions: Transaction[]) => {
		const totals: Record<
			string,
			{ debit: number; credit: number; name: string; code: string }
		> = {}

		transactions.forEach((transaction) => {
			if (transaction.debitAccount) {
				const key = transaction.debitAccount.id
				if (!totals[key]) {
					totals[key] = {
						debit: 0,
						credit: 0,
						name: transaction.debitAccount.name,
						code: transaction.debitAccount.code,
					}
				}
				totals[key].debit += transaction.amount
			}

			if (transaction.creditAccount) {
				const key = transaction.creditAccount.id
				if (!totals[key]) {
					totals[key] = {
						debit: 0,
						credit: 0,
						name: transaction.creditAccount.name,
						code: transaction.creditAccount.code,
					}
				}
				totals[key].credit += transaction.amount
			}
		})

		return totals
	}

	const accountTotals = calculateAccountTotals(transactions.data)
	const accountsArray = Object.entries(accountTotals).map(([id, data]) => ({
		id,
		...data,
	}))

	if (transactions.data.length === 0) {
		return <NoTransactionFound />
	}

	return (
		<div className="overflow-x-auto">
			<Table>
				<TableHeader>
					<TableRow className="border-b bg-muted">
						<TableHead className="text-left p-3">Account Code</TableHead>
						<TableHead className="text-left p-3">Account Name</TableHead>
						<TableHead className="text-right p-3">Total Debits</TableHead>
						<TableHead className="text-right p-3">Total Credits</TableHead>
						<TableHead className="text-right p-3">Balance</TableHead>
					</TableRow>
				</TableHeader>
				<TableBody>
					{accountsArray.map((account) => {
						const balance = account.debit - account.credit
						return (
							<TableRow key={account.id} className="odd:bg-muted">
								<TableCell className="p-3 font-medium">
									{account.code}
								</TableCell>
								<TableCell className="p-3">{account.name}</TableCell>
								<TableCell className="p-3 text-right font-medium text-success">
									{formatCentsToCurrency(account.debit)}
								</TableCell>
								<TableCell className="p-3 text-right font-medium text-destructive">
									{formatCentsToCurrency(account.credit)}
								</TableCell>
								<TableCell
									className={`p-3 text-right font-medium ${balance >= 0 ? "text-success" : "text-destructive"}`}
								>
									{formatCentsToCurrency(Math.abs(balance))}
								</TableCell>
							</TableRow>
						)
					})}
				</TableBody>
				<TableFooter>
					<TableRow className="font-bold">
						<TableCell colSpan={2} className="p-3 text-right">
							Grand Totals:
						</TableCell>
						<TableCell className="p-3 text-right text-success">
							{formatCentsToCurrency(
								accountsArray.reduce((sum, acc) => sum + acc.debit, 0),
							)}
						</TableCell>
						<TableCell className="p-3 text-right text-destructive">
							{formatCentsToCurrency(
								accountsArray.reduce((sum, acc) => sum + acc.credit, 0),
							)}
						</TableCell>
						<TableCell className="p-3 text-right">
							{formatCentsToCurrency(
								Math.abs(
									accountsArray.reduce((sum, acc) => sum + acc.debit, 0) -
										accountsArray.reduce((sum, acc) => sum + acc.credit, 0),
								),
							)}
						</TableCell>
					</TableRow>
				</TableFooter>
			</Table>
		</div>
	)
}

type ChartOfAccountsProps = { className?: string }

export function ChartOfAccounts(_: ChartOfAccountsProps) {
	const { data, status } = useCurrentChartOfAccounts()

	if (status === "pending") {
		return (
			<div className="space-y-4">
				<Skeleton className="h-4 rounded w-1/4 mb-4" />
				<div className="space-y-2">
					<Skeleton className="h-3 rounded" />
					<Skeleton className="h-3 rounded" />
					<Skeleton className="h-3 rounded" />
					<Skeleton className="h-3 rounded" />
					<Skeleton className="h-3 rounded" />
				</div>
			</div>
		)
	}

	if (!data) return <div>No accounts found</div>

	const groupByFirstLetter = (accounts: (typeof data)["data"]) => {
		const grouped: Record<string, (typeof data)["data"]> = {}

		accounts.forEach((account) => {
			const firstLetter = account.name.charAt(0).toUpperCase()
			if (!grouped[firstLetter]) {
				grouped[firstLetter] = []
			}
			grouped[firstLetter].push(account)
		})

		return grouped
	}

	const groupedAccounts = groupByFirstLetter(data.data)

	return (
		<div className="space-y-6 space-x-3 grid grid-cols-1 md:grid-cols-3">
			{Object.entries(groupedAccounts)
				.sort(([a], [b]) => a.localeCompare(b))
				.map(([letter, accounts]) => (
					<div key={letter}>
						<h3 className="text-lg font-semibold text-foreground mb-3 border-b pb-1">
							{letter}
						</h3>
						<div className="space-y-2">
							{accounts.map((account) => (
								<div
									key={account.id}
									className={`flex items-center p-2 hover:bg-accent rounded transition-colors `}
								>
									<span className="font-mono text-sm text-muted-foreground w-20">
										{account.code}
									</span>
									<span className="ml-3 text-foreground">{account.name}</span>
								</div>
							))}
						</div>
					</div>
				))}
		</div>
	)
}
