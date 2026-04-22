import type {
	TransactionCategoryBookType,
	TransactionVatType,
} from "@bir-notebook/shared/models/transaction"
import type { ListQueryParam, ListResponse } from "@/lib/api"

export type ChartOfAccount = {
	id: number
	code: string
	name: string
	type: string
	createdAt: string
	updatedAt: string
}

export type ChartOfAccountList = {
	data: Array<ChartOfAccount>
}

export type ChartOfAccountListQueryParam = ListQueryParam & {
	s?: string
}

export type TransactionCategory = {
	id: number
	name: string
	bookType: TransactionCategoryBookType
	defaultDebitAccountId: number | null
	defaultCreditAccountId: number | null
	createdAt: string
	updatedAt: string

	defaultDebitAccount: ChartOfAccount | null
	defaultCreditAccount: ChartOfAccount | null
}

export type TransactionCategoryList = ListResponse<TransactionCategory>

export type TransactionCategoryListQueryParam = ListQueryParam & {
	s?: string
}

export type Transaction = {
	id: number
	userId: number
	categoryId: number
	amount: number
	description: string
	transactionDate: string
	creditAccountId: number
	debitAccountId: number
	bookType: TransactionCategoryBookType
	referenceNumber: string
	vatType: TransactionVatType
	vatAmount: number
	createdAt: string
	recorded: boolean

	transferredToGlAt: string | null
	transactionsactionDate: string

	category: TransactionCategory | null
	creditAccount: ChartOfAccount | null
	debitAccount: ChartOfAccount | null
}

export type CreatedTransaction = {
	data: Transaction
	message: string
}

export type UpdatedTransaction = {
	data: Transaction
	message: string
}

export type TransactionList = ListResponse<Transaction>

export type TransactionSummary = {
	totalIncome: number
	totalExpenses: number
	netIncome: number
	totalChartOfAccounts: number
}

export type BulkTransactionInput = {
	transactionIds: Array<number>
}

export type BulkRecordTransactionInput = {
	transactionIds: Array<number>
}

export type BulkRecordTransactionResponse = {
	status: "success"
	data: {
		total: number
		updated: number
	}
	message: string
}

export type TransactionListQueryParam = ListQueryParam & {
	search?: string
	dateFrom?: string
	dateTo?: string
	bookType?: string
	record?: string
}

export type TransferHistoryQueryParam = ListQueryParam & {
	transferGroupId?: string
}

export type EligibleTransferTransactionResult = {
	isValid: boolean
	eligibleTransactions: number[]
	ineligibleTransactions: Array<{ id: number; reason: string }>
	errors: string[]
	warnings: string[]
}
