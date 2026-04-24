import { formatCentsToCurrency } from "@bir-notebook/shared/helpers/currency"
import { formatOption } from "@bir-notebook/shared/models/common"
import { transactionCategoryBookTypeOptions } from "@bir-notebook/shared/models/transaction"
import { useQuery } from "@tanstack/react-query"
import { AlertCircle, ArrowLeft, ArrowRight, Check } from "lucide-react"
import { useState } from "react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog"
import {
	Field,
	FieldContent,
	FieldDescription,
	FieldGroup,
	FieldLabel,
	FieldTitle,
} from "@/components/ui/field"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { Spinner } from "@/components/ui/spinner"
import {
	useBulkTransferTransactionToGeneralLedger,
	transactionsOptions,
	useTransferTransactionToGeneralLedger,
	useValidateTransferTransaction,
} from "@/hooks/api/transaction"
import { formatDate, generateMonthOptions } from "@/lib/general-ledger-helpers"
import type {
	EligibleTransferTransactionResult,
	Transaction,
} from "@/types/transaction"

type AccountTransactionGroup = {
	debitAccountId: number
	debitAccount: Transaction["debitAccount"]
	creditAccountId: number
	creditAccount: Transaction["creditAccount"]
	transactions: Array<Transaction>
}

function groupTransactionsByAccounts(transactions: Array<Transaction>) {
	return transactions.reduce(
		(groups, transaction) => {
			const key = `${transaction.debitAccountId}-${transaction.creditAccountId}`

			if (!groups[key]) {
				groups[key] = {
					debitAccountId: transaction.debitAccountId,
					debitAccount: transaction.debitAccount,
					creditAccountId: transaction.creditAccountId,
					creditAccount: transaction.creditAccount,
					transactions: [],
				}
			}

			groups[key].transactions.push(transaction)
			return groups
		},
		{} as Record<string, AccountTransactionGroup>,
	)
}

type GeneralLedgerTransferDialogProps = {
	isOpen: boolean
	onClose: () => void
	onSuccess?: () => void
	initialSelectedTransactions?: Array<number>
}

type TransactionSelectionProps = {
	selectedTransactions: Array<number>
	onSelectionChange: (ids: Array<number>) => void
	onNext: () => void
	availableTransactions: Array<Transaction>
	validationError?: string
}

type MonthAssignmentProps = {
	selectedTransactions: Array<number>
	accountGroups: Record<string, AccountTransactionGroup>
	isValid: boolean
	onNext: () => void
	onBack: () => void
	targetMonth: string
	onTargetMonthChange: (month: string) => void
	descriptionMode: "single" | "perGroup"
	onDescriptionModeChange: (mode: "single" | "perGroup") => void
	glDescription: string
	onGlDescriptionChange: (description: string) => void
	groupDescriptions: Record<string, string>
	onGroupDescriptionChange: (groupKey: string, description: string) => void
}

type ConfirmationProps = {
	targetMonth: string
	descriptionMode: "single" | "perGroup"
	glDescription: string
	accountGroups: Record<string, AccountTransactionGroup>
	groupDescriptions: Record<string, string>
	onConfirm: () => void
	onBack: () => void
	isLoading?: boolean
	validation?: EligibleTransferTransactionResult
}

function TransactionSelectionStep({
	selectedTransactions,
	onSelectionChange,
	onNext,
	availableTransactions,
	validationError,
}: TransactionSelectionProps) {
	const handleTransactionToggle = (transactionId: number, checked: boolean) => {
		if (checked) {
			onSelectionChange([...selectedTransactions, transactionId])
		} else {
			onSelectionChange(
				selectedTransactions.filter((id) => id !== transactionId),
			)
		}
	}

	const handleSelectAll = (checked: boolean) => {
		if (checked) {
			onSelectionChange(availableTransactions.map((t) => t.id))
		} else {
			onSelectionChange([])
		}
	}

	const eligibleTransactions = availableTransactions.filter(
		(t) => t.recorded && !t.transferredToGlAt,
	)

	return (
		<div className="space-y-4">
			<div>
				<div className="flex items-center justify-between">
					<h3 className="font-semibold">Select Transactions</h3>
					<div className="flex items-center space-x-2">
						<Checkbox
							id="select-all"
							checked={
								selectedTransactions.length === eligibleTransactions.length &&
								eligibleTransactions.length > 0
							}
							onCheckedChange={handleSelectAll}
						/>
						<Label htmlFor="select-all">Select All</Label>
					</div>
				</div>
				<div className="text-sm text-muted-foreground">
					Only recorded transactions that haven't been transferred can be
					selected.
				</div>
			</div>

			{validationError && (
				<Alert variant="destructive">
					<AlertCircle className="h-4 w-4" />
					<AlertDescription>{validationError}</AlertDescription>
				</Alert>
			)}

			<div className="max-h-96 overflow-y-auto space-y-2">
				{eligibleTransactions.length === 0 ? (
					<div className="text-center py-8 text-muted-foreground">
						No eligible transactions found. Only recorded transactions that
						haven't been transferred can be selected.
					</div>
				) : (
					<FieldGroup className="gap-y-2">
						{eligibleTransactions.map((transaction) => (
							<FieldLabel key={transaction.id} className="cursor-pointer">
								<Field orientation="horizontal">
									<Checkbox
										checked={selectedTransactions.includes(transaction.id)}
										onCheckedChange={(checked) =>
											handleTransactionToggle(
												transaction.id,
												checked as boolean,
											)
										}
									/>
									<FieldContent>
										<FieldTitle className="w-full flex justify-between">
											<p>{transaction.description}</p>
											<span>{formatCentsToCurrency(transaction.amount)}</span>
										</FieldTitle>
										<FieldDescription className="flex justify-between">
											<div className="flex gap-x-2">
												<span>{formatDate(transaction.transactionDate)}</span>
												<span className="text-sm text-muted-foreground">•</span>
												<span className="text-sm text-muted-foreground">
													{transaction.referenceNumber}
												</span>
												<Badge variant="outline" className="text-xs">
													{formatOption(
														transactionCategoryBookTypeOptions,
														transaction.bookType,
													)}
												</Badge>
											</div>
											<div>
												<p className="text-xs text-muted-foreground">
													{transaction.debitAccount?.code} →{" "}
													{transaction.creditAccount?.code}
												</p>
											</div>
										</FieldDescription>
									</FieldContent>
								</Field>
							</FieldLabel>
						))}
					</FieldGroup>
				)}
			</div>

			<div className="flex justify-between items-center pt-4">
				<div className="text-sm text-muted-foreground">
					{selectedTransactions.length} transaction
					{selectedTransactions.length !== 1 ? "s" : ""} selected
				</div>
				<Button onClick={onNext} disabled={selectedTransactions.length === 0}>
					Next
					<ArrowRight className="h-4 w-4 ml-2" />
				</Button>
			</div>
		</div>
	)
}

function MonthAssignmentStep({
	selectedTransactions,
	accountGroups,
	isValid,
	onNext,
	onBack,
	targetMonth,
	onTargetMonthChange,
	descriptionMode,
	onDescriptionModeChange,
	glDescription,
	onGlDescriptionChange,
	groupDescriptions,
	onGroupDescriptionChange,
}: MonthAssignmentProps) {
	const monthOptions = generateMonthOptions()
	const accountGroupEntries = Object.entries(accountGroups)
	const hasMultipleGroups = accountGroupEntries.length > 1
	const effectiveDescriptionMode = hasMultipleGroups ? descriptionMode : "single"

	return (
		<div className="space-y-4">
			<div>
				<h3 className="font-semibold">Assign Target Month</h3>
				<p className="text-sm text-muted-foreground mt-1">
					Select the month for posting these {selectedTransactions.length}{" "}
					transaction{selectedTransactions.length !== 1 ? "s" : ""} to the
					General Ledger.
				</p>
			</div>

			<div className="flex flex-col md:flex-row gap-4">
				<div className="space-y-4 flex-1">
					<div className="space-y-2">
						<Label htmlFor="target-month">Target Month</Label>
						<select
							id="target-month"
							value={targetMonth}
							onChange={(e) => onTargetMonthChange(e.target.value)}
							className="w-full p-2 border rounded-md"
						>
							<option value="">Select a month</option>
							{monthOptions.map((option) => (
								<option key={option.value} value={option.value}>
									{option.label}
								</option>
							))}
						</select>
					</div>

					{hasMultipleGroups && (
						<div className="space-y-2">
							<Label>Description Mode</Label>
							<div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
								<Button
									type="button"
									variant={descriptionMode === "single" ? "default" : "outline"}
									onClick={() => onDescriptionModeChange("single")}
								>
									Same for all groups
								</Button>
								<Button
									type="button"
									variant={descriptionMode === "perGroup" ? "default" : "outline"}
									onClick={() => onDescriptionModeChange("perGroup")}
								>
									Different per group
								</Button>
							</div>
							<p className="text-sm text-muted-foreground">
								Choose if all account groups share one description or each
								group needs its own.
							</p>
						</div>
					)}

					{effectiveDescriptionMode === "single" && (
						<div className="space-y-2">
							<Label htmlFor="gl-description">GL Description</Label>
							<textarea
								id="gl-description"
								value={glDescription}
								onChange={(e) => onGlDescriptionChange(e.target.value)}
								placeholder="e.g., Jan Totals sales, Q1 expenses, Year-end closing"
								className="w-full p-2 border rounded-md resize-none"
								rows={3}
								maxLength={255}
							/>
							<div className="flex justify-between">
								<p className="text-sm text-muted-foreground">
									This description will be shown for all transferred groups in
									the General Ledger
								</p>
								<p className="text-xs text-muted-foreground">
									{glDescription.length}/255 characters
								</p>
							</div>
						</div>
					)}
				</div>

				<div className="space-y-4 flex-1">
					<Card>
						<CardHeader>
							<CardTitle className="text-base">Account Groups</CardTitle>
						</CardHeader>
						<CardContent className="space-y-2">
							<p className="text-sm text-muted-foreground mb-3">
								This transfer will create {Object.keys(accountGroups).length} GL
								group(s) based on account pairs:
							</p>
							{accountGroupEntries.map(([groupKey, group]) => (
								<div key={groupKey} className="p-3 bg-muted rounded-md space-y-3">
									<div className="flex justify-between items-center">
										<div>
											<div className="text-sm font-medium">
												{group.transactions.length} transaction
												{group.transactions.length !== 1 ? "s" : ""}
											</div>
											<div className="text-xs text-muted-foreground">
												{group.debitAccount?.code} ({group.debitAccount?.name})
												→ {group.creditAccount?.code} (
												{group.creditAccount?.name})
											</div>
										</div>
										<div className="text-right">
											<div className="font-medium">
												{formatCentsToCurrency(
													group.transactions.reduce(
														(sum, t) => sum + t.amount,
														0,
													),
												)}
											</div>
											<div className="text-xs text-muted-foreground">
												Total amount
											</div>
										</div>
									</div>

									{effectiveDescriptionMode === "perGroup" && (
										<div className="space-y-1">
											<Label htmlFor={`group-description-${groupKey}`}>
												Group Description
											</Label>
											<textarea
												id={`group-description-${groupKey}`}
												value={groupDescriptions[groupKey] ?? ""}
												onChange={(e) =>
													onGroupDescriptionChange(groupKey, e.target.value)
												}
												placeholder="e.g., January utilities expenses"
												className="w-full p-2 border rounded-md resize-none bg-background"
												rows={2}
												maxLength={255}
											/>
											<div className="text-right text-xs text-muted-foreground">
												{(groupDescriptions[groupKey] ?? "").length}/255
											</div>
										</div>
									)}
								</div>
							))}
						</CardContent>
					</Card>

					<Card>
						<CardHeader>
							<CardTitle className="text-base">Transfer Summary</CardTitle>
						</CardHeader>
						<CardContent className="space-y-2">
							<div className="flex justify-between">
								<span>Transactions to transfer:</span>
								<span className="font-medium">
									{selectedTransactions.length}
								</span>
							</div>
							<div className="flex justify-between">
								<span>Target posting month:</span>
								<span className="font-medium">
									{targetMonth || "Not selected"}
								</span>
							</div>
						</CardContent>
					</Card>
				</div>
			</div>

			<div className="flex justify-between pt-4">
				<Button variant="outline" onClick={onBack}>
					<ArrowLeft className="h-4 w-4 mr-2" />
					Back
				</Button>
				<Button onClick={onNext} disabled={!isValid}>
					Next
					<ArrowRight className="h-4 w-4 ml-2" />
				</Button>
			</div>
		</div>
	)
}

function ConfirmationStep({
	targetMonth,
	descriptionMode,
	glDescription,
	accountGroups,
	groupDescriptions,
	onConfirm,
	onBack,
	isLoading = false,
	validation,
}: ConfirmationProps) {
	if (!validation) {
		return <div>Loading validation...</div>
	}

	const hasMultipleGroups = Object.keys(accountGroups).length > 1
	const effectiveDescriptionMode = hasMultipleGroups ? descriptionMode : "single"

	return (
		<div className="space-y-4">
			<div>
				<h3 className="text-lg font-semibold">Confirm Transfer</h3>
				<p className="text-sm text-muted-foreground mt-1">
					Review the transfer details before confirming.
				</p>
			</div>

			{validation.errors.length > 0 && (
				<Alert variant="destructive">
					<AlertCircle className="h-4 w-4" />
					<AlertDescription>
						<ul className="list-disc list-inside">
							{validation.errors.map((error) => (
								<li key={error}>{error}</li>
							))}
						</ul>
					</AlertDescription>
				</Alert>
			)}

			{validation.warnings.length > 0 && (
				<Alert>
					<AlertCircle className="h-4 w-4" />
					<AlertDescription>
						<ul className="list-disc list-inside">
							{validation.warnings.map((warning) => (
								<li key={warning}>{warning}</li>
							))}
						</ul>
					</AlertDescription>
				</Alert>
			)}

			<Card>
				<CardHeader>
					<CardTitle className="text-base flex items-center gap-2">
						<Check className="h-5 w-5 text-success-foreground" />
						Transfer Ready
					</CardTitle>
				</CardHeader>
				<CardContent className="space-y-3">
					<div className="grid grid-cols-2 gap-4">
						<div>
							<p className="text-sm text-muted-foreground">
								Eligible Transactions
							</p>
							<p className="text-lg font-semibold text-success-foreground">
								{validation.eligibleTransactions.length}
							</p>
						</div>
						<div>
							<p className="text-sm text-muted-foreground">Target Month</p>
							<p className="text-lg font-semibold">{targetMonth}</p>
						</div>
					</div>

					<Separator />

					<div className="space-y-2">
						<p className="text-sm font-medium">GL Description:</p>
						{effectiveDescriptionMode === "single" ? (
							<div className="p-2 bg-muted rounded-md text-sm">
								{glDescription}
							</div>
						) : (
							<div className="space-y-2">
								{Object.entries(accountGroups).map(([groupKey, group]) => (
									<div
										key={groupKey}
										className="p-2 bg-muted rounded-md text-sm"
									>
										<div className="text-xs text-muted-foreground mb-1">
											{group.debitAccount?.code} -&gt; {group.creditAccount?.code}
										</div>
										{groupDescriptions[groupKey]}
									</div>
								))}
							</div>
						)}
					</div>

					<Separator />

					<div>
						<p className="text-sm font-medium mb-2">Transfer Impact:</p>
						<p className="text-sm text-muted-foreground">
							{validation.eligibleTransactions.length} transaction
							{validation.eligibleTransactions.length !== 1 ? "s" : ""} will be
							transferred to General Ledger for {targetMonth} with
							{effectiveDescriptionMode === "single"
								? " one shared description."
								: " group-specific descriptions."}
						</p>
					</div>
				</CardContent>
			</Card>

			<div className="flex justify-between pt-4">
				<Button variant="outline" onClick={onBack} disabled={isLoading}>
					<ArrowLeft className="h-4 w-4 mr-2" />
					Back
				</Button>
				<Button
					onClick={onConfirm}
					disabled={isLoading || validation.eligibleTransactions.length === 0}
				>
					{isLoading ? "Transferring..." : "Confirm Transfer"}
				</Button>
			</div>
		</div>
	)
}

export function GeneralLedgerTransferDialog({
	isOpen,
	onClose,
	onSuccess,
	initialSelectedTransactions = [],
}: GeneralLedgerTransferDialogProps) {
	const [step, setStep] = useState<"select" | "assign" | "confirm">("select")
	const [selectedTransactions, setSelectedTransactions] = useState<
		Array<number>
	>(initialSelectedTransactions)
	const [targetMonth, setTargetMonth] = useState("")
	const [descriptionMode, setDescriptionMode] = useState<"single" | "perGroup">(
		"single",
	)
	const [glDescription, setGlDescription] = useState("")
	const [groupDescriptions, setGroupDescriptions] = useState<
		Record<string, string>
	>({})

	const { data: transactionsData, status: transactionsStatus } = useQuery(
		transactionsOptions({
			record: "recorded", // Only recorded transactions
			limit: 1000,
		}),
	)

	const transferValidationMutation = useValidateTransferTransaction()

	const transferMutation = useTransferTransactionToGeneralLedger({
		onSuccess: () => {
			onSuccess?.()
			onClose()
		},
	})

	const bulkTransferMutation = useBulkTransferTransactionToGeneralLedger({
		onSuccess: () => {
			onSuccess?.()
			onClose()
		},
	})

	const selectedTransactionsData =
		transactionsData?.data?.filter((t) => selectedTransactions.includes(t.id)) || []

	const accountGroups = groupTransactionsByAccounts(selectedTransactionsData)
	const hasMultipleGroups = Object.keys(accountGroups).length > 1
	const usePerGroupDescription = descriptionMode === "perGroup" && hasMultipleGroups

	const isAssignStepValid =
		targetMonth.trim().length > 0 &&
		(!usePerGroupDescription
			? glDescription.trim().length > 0
			: Object.keys(accountGroups).length > 0 &&
				Object.keys(accountGroups).every(
					(key) => (groupDescriptions[key] ?? "").trim().length > 0,
				))

	const handleNext = () => {
		if (step === "select") setStep("assign")
		else if (step === "assign") {
			if (!isAssignStepValid) return
			transferValidationMutation.mutate({
				transactionIds: selectedTransactions,
			})
			setStep("confirm")
		}
	}

	const handleBack = () => {
		if (step === "assign") setStep("select")
		else if (step === "confirm") setStep("assign")
	}

	const handleConfirmTransfer = () => {
		if (!usePerGroupDescription) {
			transferMutation.mutate({
				transactionIds: selectedTransactions,
				targetMonth,
				glDescription,
			})
			return
		}

		bulkTransferMutation.mutate({
			transfers: Object.entries(accountGroups).map(([groupKey, group]) => ({
				transactionIds: group.transactions.map((t) => t.id),
				targetMonth,
				glDescription: (groupDescriptions[groupKey] ?? "").trim(),
			})),
		})
	}

	const resetDialog = () => {
		setStep("select")
		setSelectedTransactions(initialSelectedTransactions)
		setTargetMonth("")
		setDescriptionMode("single")
		setGlDescription("")
		setGroupDescriptions({})
		transferMutation.reset()
		bulkTransferMutation.reset()
	}

	const handleClose = () => {
		resetDialog()
		onClose()
	}

	if (transactionsStatus === "pending") {
		return (
			<Dialog open={isOpen} onOpenChange={handleClose}>
				<DialogContent>
					<div className="flex items-center justify-center py-8">
						<Spinner />
					</div>
				</DialogContent>
			</Dialog>
		)
	}

	return (
		<Dialog open={isOpen} onOpenChange={handleClose}>
			<DialogContent className="sm:max-w-7xl">
				<DialogHeader>
					<DialogTitle>Transfer to General Ledger</DialogTitle>
				</DialogHeader>

				{step === "select" && (
					<TransactionSelectionStep
						selectedTransactions={selectedTransactions}
						onSelectionChange={setSelectedTransactions}
						onNext={handleNext}
						availableTransactions={transactionsData?.data || []}
						validationError={transferMutation.error?.message}
					/>
				)}

				{step === "assign" && (
					<MonthAssignmentStep
						selectedTransactions={selectedTransactions}
						accountGroups={accountGroups}
						isValid={isAssignStepValid}
						onNext={handleNext}
						onBack={handleBack}
						targetMonth={targetMonth}
						onTargetMonthChange={setTargetMonth}
						descriptionMode={descriptionMode}
						onDescriptionModeChange={(mode) => {
							setDescriptionMode(mode)
							if (mode === "perGroup" && glDescription.trim().length > 0) {
								setGroupDescriptions((prev) => {
									const next = { ...prev }
									for (const groupKey of Object.keys(accountGroups)) {
										if (!next[groupKey]?.trim()) {
											next[groupKey] = glDescription.trim()
										}
									}
									return next
								})
							}
						}}
						glDescription={glDescription}
						onGlDescriptionChange={setGlDescription}
						groupDescriptions={groupDescriptions}
						onGroupDescriptionChange={(groupKey, description) =>
							setGroupDescriptions((prev) => ({
								...prev,
								[groupKey]: description,
							}))
						}
					/>
				)}

				{step === "confirm" && (
					<ConfirmationStep
						targetMonth={targetMonth}
						descriptionMode={descriptionMode}
						glDescription={glDescription}
						accountGroups={accountGroups}
						groupDescriptions={groupDescriptions}
						onConfirm={handleConfirmTransfer}
						onBack={handleBack}
						isLoading={
							transferMutation.isPending || bulkTransferMutation.isPending
						}
						validation={transferValidationMutation.data}
					/>
				)}
			</DialogContent>
		</Dialog>
	)
}
