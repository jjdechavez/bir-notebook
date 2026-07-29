import {
	type TransactionCategoryBookType,
	transactionCategoryBookTypes,
} from "@bir-notebook/shared/models/transaction"
import { useQueryClient } from "@tanstack/react-query"
import { createFileRoute } from "@tanstack/react-router"
import type { PaginationState } from "@tanstack/react-table"
import { Search } from "lucide-react"
import { useState } from "react"
import { CashDisbursementsJournal } from "@/components/books/cash-disbursements-journal"
import { CashReceiptsJournal } from "@/components/books/cash-receipts-journal"
import { GeneralJournal } from "@/components/books/general-journal"
import {
	ChartOfAccounts,
	GeneralLedger,
} from "@/components/books/general-ledger"
import { EnhancedGeneralLedgerWithSidebar } from "@/components/books/general-ledger/enhanced-general-ledger-with-sidebar"
import { GeneralLedgerTransferDialog } from "@/components/books/general-ledger/transfer-dialog"
import { TransferHistory } from "@/components/books/general-ledger/transfer-history"
import { DEFAULT_PAGE_INDEX, DEFAULT_PAGE_SIZE } from "@/components/data-table"
import { GenericErrorComponent } from "@/components/error-component"
import { SettingPendingComponent } from "@/components/pending-component"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import {
	InputGroup,
	InputGroupAddon,
	InputGroupDebounceInput,
} from "@/components/ui/input-group"
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
	transactionKeys,
	transactionsOptions,
	useRecordTransaction,
	useUndoRecordTransaction,
} from "@/hooks/api/transaction"
import { useFilters } from "@/hooks/use-filters"
import type { TransactionListQueryParam } from "@/types/transaction"

export const Route = createFileRoute("/(app)/books")({
	validateSearch: () =>
		({}) as Partial<PaginationState> &
			TransactionListQueryParam & { count?: number },
	loaderDeps: ({ search }) => ({
		page: (search?.pageIndex || DEFAULT_PAGE_INDEX) + 1,
		size: search?.pageSize || DEFAULT_PAGE_SIZE,
		dateFrom: search?.dateFrom || "",
		dateTo: search?.dateTo || "",
		bookType:
			search?.bookType || transactionCategoryBookTypes.cashReceiptJournal,
		search: search?.search || "",
		record: search?.record || "",
		count: search?.count || 6,
	}),
	loader: ({ context, deps }) => ({
		crumb: "Books",
		...context.queryClient.ensureQueryData(transactionsOptions(deps)),
	}),
	component: BooksPage,
	pendingComponent: SettingPendingComponent,
	errorComponent: GenericErrorComponent,
})

const cashReceiptJournalBook = {
	key: transactionCategoryBookTypes.cashReceiptJournal,
	label: "Cash Receipts Journal",
	icon: "📥",
	color: "green",
}

const cashDisbursementJournalBook = {
	key: transactionCategoryBookTypes.cashDisbursementJournal,
	label: "Cash Disbursements Journal",
	icon: "📤",
	color: "red",
}

const generalJournalBook = {
	key: transactionCategoryBookTypes.generalJournal,
	label: "General Journal",
	icon: "📝",
	color: "blue",
}

const generalLedgerBook = {
	key: transactionCategoryBookTypes.generalLedger,
	label: "General Ledger",
	icon: "📊",
	color: "purple",
}

const bookTypes = [
	cashReceiptJournalBook,
	cashDisbursementJournalBook,
	generalJournalBook,
	generalLedgerBook,
]

function BooksPage() {
	const { filters, setFilters } = useFilters(Route.id)
	const [showTransferDialog, setShowTransferDialog] = useState(false)

	const queryClient = useQueryClient()

	const recordMutation = useRecordTransaction()

	const undoRecordMutation = useUndoRecordTransaction()

	return (
		<div className="space-y-6">
			{/* Header */}
			<div>
				<h1 className="text-xl font-bold">BIR Books of Accounts</h1>
				<p className="text-muted-foreground mt-2">
					View and manage your BIR-compliant books of accounts with proper
					transaction recording
				</p>
			</div>

			<Card className="p-0">
				<Tabs
					defaultValue={
						filters?.bookType || transactionCategoryBookTypes.cashReceiptJournal
					}
					onValueChange={(value) =>
						setFilters({ bookType: value as TransactionCategoryBookType })
					}
				>
					<TabsList variant="line">
						{bookTypes.map((book) => (
							<TabsTrigger
								key={book.key}
								value={book.key}
								className="flex items-center gap-2 px-6 py-3"
							>
								<span className="">{book.label}</span>
							</TabsTrigger>
						))}
					</TabsList>

					<TabsContent value={cashReceiptJournalBook.key} className="space-y-4">
						<BookView bookType={cashReceiptJournalBook.key}>
							<CashReceiptsJournal
								onRecordAction={(action, transaction) => {
									if (action === "record") {
										recordMutation.mutate(transaction.id)
									} else if (action === "undo") {
										undoRecordMutation.mutate(transaction.id)
									}
								}}
							/>
						</BookView>
					</TabsContent>
					<TabsContent
						value={cashDisbursementJournalBook.key}
						className="space-y-4"
					>
						<BookView bookType={cashDisbursementJournalBook.key}>
							<CashDisbursementsJournal
								onRecordAction={(action, transaction) => {
									if (action === "record") {
										recordMutation.mutate(transaction.id)
									} else if (action === "undo") {
										undoRecordMutation.mutate(transaction.id)
									}
								}}
							/>
						</BookView>
					</TabsContent>
					<TabsContent value={generalJournalBook.key} className="px-6 py-4">
						<GeneralJournal
							onRecordAction={(action, transaction) => {
								if (action === "record") {
									recordMutation.mutate(transaction.id)
								} else if (action === "undo") {
									undoRecordMutation.mutate(transaction.id)
								}
							}}
						/>
					</TabsContent>
					<TabsContent value={generalLedgerBook.key} className="space-y-4">
						<BookView bookType={generalLedgerBook.key}>
							<Tabs defaultValue="accounts" className="gap-6">
								<TabsList variant="line">
									<TabsTrigger value="accounts">Chart of Accounts</TabsTrigger>
									<TabsTrigger value="transactions">
										Enhanced Ledger
									</TabsTrigger>
									<TabsTrigger value="transfer-history">
										Transfer History
									</TabsTrigger>
									<TabsTrigger value="classic">Classic View</TabsTrigger>
								</TabsList>

								<TabsContent value="accounts">
									<ChartOfAccounts />
								</TabsContent>

								<TabsContent value="transactions">
									<div className="mb-4 flex flex-wrap items-end gap-3 rounded-lg border bg-muted/20 p-4">
										<div>
											<label
												htmlFor="ledger-date-from"
												className="mb-1 block text-xs font-medium text-muted-foreground"
											>
												From
											</label>
											<Input
												id="ledger-date-from"
												type="date"
												value={filters.dateFrom || ""}
												onChange={(e) =>
													setFilters({ dateFrom: e.target.value })
												}
											/>
										</div>
										<div>
											<label
												htmlFor="ledger-date-to"
												className="mb-1 block text-xs font-medium text-muted-foreground"
											>
												To
											</label>
											<Input
												id="ledger-date-to"
												type="date"
												value={filters.dateTo || ""}
												onChange={(e) => setFilters({ dateTo: e.target.value })}
											/>
										</div>
										<p className="pb-2 text-xs text-muted-foreground">
											Balances are calculated from the selected period and prior
											posted ledger months.
										</p>
									</div>
									<EnhancedGeneralLedgerWithSidebar
										dateFrom={filters.dateFrom as string | undefined}
										dateTo={filters.dateTo as string | undefined}
										onTransferClick={() => setShowTransferDialog(true)}
										onExportClick={() => console.log("Export clicked")}
									/>
								</TabsContent>

								<TabsContent value="transfer-history">
									<TransferHistory />
								</TabsContent>

								<TabsContent value="classic">
									<GeneralLedger />
								</TabsContent>
							</Tabs>
						</BookView>
					</TabsContent>
				</Tabs>
			</Card>

			{showTransferDialog && (
				<GeneralLedgerTransferDialog
					isOpen={showTransferDialog}
					onClose={() => setShowTransferDialog(false)}
					onSuccess={() => {
						queryClient.invalidateQueries({
							queryKey: transactionKeys.all,
						})
					}}
				/>
			)}
		</div>
	)
}

type BookViewProps = {
	children: React.ReactNode
}

function BookView({ children }: BookViewProps & { bookType: string }) {
	return <div className="px-6 py-4">{children}</div>
}

export function BookColumnarFilter() {
	const { filters, setFilters } = useFilters(Route.id)

	return (
		<div className="flex gap-x-4">
			<div>
				<InputGroup>
					<InputGroupDebounceInput
						placeholder="Search transactions..."
						value={filters.search || ""}
						onChange={(e) => setFilters({ search: e.toString() })}
					/>
					<InputGroupAddon>
						<Search className="text-gray-400 h-4 w-4" />
					</InputGroupAddon>
				</InputGroup>
			</div>
			<div>
				<Input
					type="date"
					value={filters.dateFrom || ""}
					onChange={(e) => setFilters({ dateFrom: e.target.value })}
				/>
			</div>
			<div>
				<Input
					type="date"
					value={filters.dateTo || ""}
					onChange={(e) => setFilters({ dateTo: e.target.value })}
				/>
			</div>

			<div>
				<Select
					value={filters.record || ""}
					onValueChange={(value) => setFilters({ record: value || undefined })}
				>
					<SelectTrigger>
						<SelectValue placeholder="All status" />
					</SelectTrigger>
					<SelectContent>
						<SelectItem value="all">All status</SelectItem>
						<SelectItem value="draft">Draft</SelectItem>
						<SelectItem value="recorded">Recorded</SelectItem>
					</SelectContent>
				</Select>
			</div>
		</div>
	)
}
