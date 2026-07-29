import { formatCentsToCurrency } from "@bir-notebook/shared/helpers/currency"
import type {
	GeneralLedgerMonth,
	GeneralLedgerView,
} from "@bir-notebook/shared/models/general-ledger"
import { useQuery } from "@tanstack/react-query"
import { ChevronDown, ChevronRight, Download, Info } from "lucide-react"
import { useState } from "react"
import { generalLedgerEntriesOptions } from "@/hooks/api/transaction"
import { formatDate, formatMonth } from "@/lib/general-ledger-helpers"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"

type Props = { ledgerView: GeneralLedgerView; onExportClick?: () => void }

function money(value: number, type?: "debit" | "credit") {
	const color = type === "credit" ? "text-destructive" : "text-success"
	return (
		<span className={color}>
			{formatCentsToCurrency(Math.abs(value))}{" "}
			{type ? (type === "debit" ? "Dr" : "Cr") : ""}
		</span>
	)
}

function TAccountSide({
	title,
	entries,
	isDebit,
}: {
	title: string
	entries: Array<{
		id: number
		date: string
		description: string
		referenceNumber?: string
		debitAmount?: number
		creditAmount?: number
		counterpartAccount: { code: string; name: string }
	}>
	isDebit: boolean
}) {
	return (
		<div className="min-w-[320px] flex-1 overflow-hidden rounded-md border">
			<div
				className={`border-b px-3 py-2 font-semibold ${isDebit ? "bg-success/10 text-success" : "bg-destructive/10 text-destructive"}`}
			>
				{title}
			</div>
			<table className="w-full text-sm">
				<thead className="bg-muted/50 text-left text-xs text-muted-foreground">
					<tr>
						<th className="p-3">Date</th>
						<th className="p-3">Description / counterpart</th>
						<th className="p-3 text-right">Amount</th>
					</tr>
				</thead>
				<tbody>
					{entries.map((entry) => (
						<tr key={entry.id} className="border-t align-top">
							<td className="whitespace-nowrap p-3">
								{formatDate(entry.date)}
							</td>
							<td className="p-3">
								<div>{entry.description || "—"}</div>
								<div className="text-xs text-muted-foreground">
									{entry.counterpartAccount.code} ·{" "}
									{entry.counterpartAccount.name}
									{entry.referenceNumber
										? ` · Ref. ${entry.referenceNumber}`
										: ""}
								</div>
							</td>
							<td
								className={`whitespace-nowrap p-3 text-right font-medium ${isDebit ? "text-success" : "text-destructive"}`}
							>
								{formatCentsToCurrency(
									(isDebit ? entry.debitAmount : entry.creditAmount) ?? 0,
								)}
							</td>
						</tr>
					))}
					{entries.length === 0 && (
						<tr>
							<td colSpan={3} className="p-6 text-center text-muted-foreground">
								No {isDebit ? "debit" : "credit"} entries
							</td>
						</tr>
					)}
				</tbody>
			</table>
		</div>
	)
}

function MonthSection({
	month,
	accountId,
}: {
	month: GeneralLedgerMonth
	accountId: number
}) {
	const [open, setOpen] = useState(false)
	const [page, setPage] = useState(1)
	const { data, isPending, isError } = useQuery({
		...generalLedgerEntriesOptions({
			accountId,
			month: month.month,
			page,
			limit: 50,
		}),
		enabled: open,
	})
	const entries = data?.status === "success" ? data.data : []
	const debitEntries = entries.filter(
		(entry) => entry.debitAmount !== undefined,
	)
	const creditEntries = entries.filter(
		(entry) => entry.creditAmount !== undefined,
	)

	return (
		<Card>
			<button
				type="button"
				className="w-full text-left"
				onClick={() => setOpen(!open)}
			>
				<CardHeader className="flex flex-row items-center justify-between gap-4">
					<div className="flex items-center gap-3">
						{open ? (
							<ChevronDown className="h-4 w-4" />
						) : (
							<ChevronRight className="h-4 w-4" />
						)}
						<div>
							<CardTitle className="text-base">
								{formatMonth(month.month)}
							</CardTitle>
							<p className="text-xs text-muted-foreground mt-1">
								{month.transactionCount} entries
							</p>
						</div>
					</div>
					<div className="text-right">
						<p className="text-xs text-muted-foreground">Closing balance</p>
						<p className="font-semibold">
							{money(
								month.periodClosing.runningBalance,
								month.periodClosing.balanceType,
							)}
						</p>
					</div>
				</CardHeader>
			</button>
			{open && (
				<CardContent className="space-y-4">
					<div className="grid gap-3 rounded-md bg-muted/50 p-3 text-sm sm:grid-cols-4">
						<div>
							<span className="text-muted-foreground block">Opening</span>
							<strong>
								{money(
									month.openingBalance,
									month.openingBalance >= 0 ? "debit" : "credit",
								)}
							</strong>
						</div>
						<div>
							<span className="text-muted-foreground block">Debit (Dr)</span>
							<strong className="text-success">
								{formatCentsToCurrency(month.periodClosing.totalDebits)}
							</strong>
						</div>
						<div>
							<span className="text-muted-foreground block">Credit (Cr)</span>
							<strong className="text-destructive">
								{formatCentsToCurrency(month.periodClosing.totalCredits)}
							</strong>
						</div>
						<div>
							<span className="text-muted-foreground block">Movement</span>
							<strong>
								{money(
									month.periodClosing.netAmount,
									month.periodClosing.balanceType,
								)}
							</strong>
						</div>
					</div>
					{isPending && (
						<p className="py-6 text-center text-sm text-muted-foreground">
							Loading entries…
						</p>
					)}
					{isError && (
						<p className="py-6 text-center text-sm text-destructive">
							Could not load this month’s entries.
						</p>
					)}
					{data?.status === "success" && (
						<div className="flex flex-col gap-4 lg:flex-row">
							<TAccountSide title="Debit (Dr)" entries={debitEntries} isDebit />
							<TAccountSide
								title="Credit (Cr)"
								entries={creditEntries}
								isDebit={false}
							/>
						</div>
					)}
					{data?.status === "success" && data.meta.totalPages > 1 && (
						<div className="flex items-center justify-between text-sm">
							<span className="text-muted-foreground">
								Page {page} of {data.meta.totalPages}
							</span>
							<div className="flex gap-2">
								<Button
									size="sm"
									variant="outline"
									disabled={page === 1}
									onClick={() => setPage(page - 1)}
								>
									Previous
								</Button>
								<Button
									size="sm"
									variant="outline"
									disabled={page >= data.meta.totalPages}
									onClick={() => setPage(page + 1)}
								>
									Next
								</Button>
							</div>
						</div>
					)}
				</CardContent>
			)}
		</Card>
	)
}

export function EnhancedGeneralLedgerView({
	ledgerView,
	onExportClick,
}: Props) {
	return (
		<div className="space-y-6">
			<Card>
				<CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
					<div>
						<CardTitle className="text-xl">
							{ledgerView.account.code} — {ledgerView.account.name}
						</CardTitle>
						<p className="mt-1 text-sm text-muted-foreground">
							Period: {formatDate(ledgerView.dateRange.from)} –{" "}
							{formatDate(ledgerView.dateRange.to)}
						</p>
					</div>
					{onExportClick && (
						<Button variant="outline" onClick={onExportClick}>
							<Download className="mr-2 h-4 w-4" />
							Export
						</Button>
					)}
				</CardHeader>
				<CardContent className="space-y-4">
					<div className="flex gap-2 rounded-md border border-info/30 bg-info/10 p-3 text-sm">
						<Info className="mt-0.5 h-4 w-4 shrink-0" />
						<p>
							Opening balance is the account balance before{" "}
							{formatDate(ledgerView.dateRange.from)}. Closing balance = opening
							balance + debits − credits.
						</p>
					</div>
					<div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
						<div>
							<p className="text-sm text-muted-foreground">Opening balance</p>
							<p className="text-lg font-bold">
								{money(
									ledgerView.months[0]?.openingBalance ?? 0,
									(ledgerView.months[0]?.openingBalance ?? 0) >= 0
										? "debit"
										: "credit",
								)}
							</p>
						</div>
						<div>
							<p className="text-sm text-muted-foreground">
								Period debits (Dr)
							</p>
							<p className="text-lg font-bold text-success">
								{formatCentsToCurrency(ledgerView.grandTotal.totalDebits)}
							</p>
						</div>
						<div>
							<p className="text-sm text-muted-foreground">
								Period credits (Cr)
							</p>
							<p className="text-lg font-bold text-destructive">
								{formatCentsToCurrency(ledgerView.grandTotal.totalCredits)}
							</p>
						</div>
						<div>
							<p className="text-sm text-muted-foreground">Closing balance</p>
							<p className="text-lg font-bold">
								{money(
									ledgerView.grandTotal.finalBalance,
									ledgerView.grandTotal.balanceType,
								)}
							</p>
						</div>
					</div>
				</CardContent>
			</Card>
			<div className="space-y-3">
				{ledgerView.months.map((month) => (
					<MonthSection
						key={month.month}
						month={month}
						accountId={ledgerView.account.id}
					/>
				))}
			</div>
			<Card className="bg-muted/40">
				<CardContent className="pt-5">
					<div className="flex flex-wrap items-center justify-between gap-3 text-sm">
						<span className="text-muted-foreground">
							{ledgerView.months.reduce(
								(sum, month) => sum + month.transactionCount,
								0,
							)}{" "}
							entries in this period
						</span>
						<span className="font-medium">
							Net movement:{" "}
							{money(
								ledgerView.grandTotal.netAmount,
								ledgerView.grandTotal.balanceType,
							)}
						</span>
					</div>
					<Separator className="my-3" />
					<p className="text-xs text-muted-foreground">
						Debit and credit totals are calculated from the monthly posted
						General Ledger entries shown above.
					</p>
				</CardContent>
			</Card>
		</div>
	)
}
