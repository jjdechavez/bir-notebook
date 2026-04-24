import z from "zod"

export const bulkTransferToGeneralLedgerSchema = z.object({
	transfers: z.array(
		z.object({
			transactionIds: z.array(z.number().int()),
			targetMonth: z.string().regex(/^\d{4}-\d{2}$/),
			glDescription: z.string().min(1).max(255),
		}),
	),
})

export const transferHistorySchema = z.object({
	transferGroupId: z.string().optional(),
	page: z.coerce.number().int().positive().optional(),
	limit: z.coerce.number().int().positive().optional(),
})

export const transferToGeneralLedgerSchema = z.object({
	transactionIds: z.array(z.number().int()),
	targetMonth: z.string().regex(/^\d{4}-\d{2}$/),
	glDescription: z.string().min(1).max(255),
})

export type TransferToGeneralLedgerInput = z.infer<
	typeof transferToGeneralLedgerSchema
>

export type BulkTransferToGeneralLedgerInput = {
	transfers: Array<TransferToGeneralLedgerInput>
}

export type BulkTransferToGeneralLedgerResponse = {
	status: "success" | "partial"
	message: string
	summary: {
		totalGroups: number
		successful: number
		failed: number
		results: Array<unknown>
	}
}

export type ParentGlTransaction = {
	id: number
	description: string
	amount: number
	accountPair: string
	debitAccountId: number
	creditAccountId: number
	targetMonth: string
}

export type TransferResult = {
	parentGlTransactions: ParentGlTransaction[]
	totalTransactions: number
	totalGroups: number
}

export type TransferTransactionToGeneralLedgerResponse = {
	status: string
	data: TransferResult
	message: string
}

export const generalLedgerViewSchema = z.object({
	accountId: z.coerce.number().int(),
	dateFrom: z.string(),
	dateTo: z.string(),
})

export type GeneralLedgerViewQueryParam = z.infer<
	typeof generalLedgerViewSchema
>

export type LedgerTransaction = {
	id: number
	date: string
	description: string
	referenceNumber?: string
	debitAmount?: number
	creditAmount?: number
	counterpartAccount: {
		code: string
		name: string
	}
	transferGroupId?: string
	transferredAt?: string
	isTransferred?: boolean
}

export type GeneralLedgerMonth = {
	month: string // '2024-01'
	openingBalance: number
	transactions: LedgerTransaction[]
	periodClosing: {
		totalDebits: number
		totalCredits: number
		netAmount: number // positive for debit, negative for credit
		runningBalance: number
		balanceType: "debit" | "credit"
	}
}

export type GeneralLedgerView = {
	account: {
		id: number
		code: string
		name: string
		type: string
	}
	dateRange: {
		from: string
		to: string
	}
	months: GeneralLedgerMonth[]
	grandTotal: {
		totalDebits: number
		totalCredits: number
		netAmount: number
		finalBalance: number
		balanceType: "debit" | "credit"
	}
}

export type GeneralLedgerViewResult =
	| {
			status: "success"
			data: GeneralLedgerView
	  }
	| {
			status: "error"
			message: string
	  }
	| {
			status: "not_found"
			message: string
	  }

export type TransferHistoryItem = {
	id: number
	transferGroupId: string
	transferredToGlAt: string
	transactionDate: string
	description: string
	amount: number
	debitAccount: {
		id: number
		code: string
		name: string
	}
	creditAccount: {
		id: number
		code: string
		name: string
	}
	category: {
		name: string
	}
}

export type TransactionTransferHistoryList = {
	data: Array<TransferHistoryItem>
}
