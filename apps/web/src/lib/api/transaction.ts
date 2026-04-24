import type {
	BulkTransferToGeneralLedgerInput,
	BulkTransferToGeneralLedgerResponse,
	GeneralLedgerViewQueryParam,
	GeneralLedgerViewResult,
	TransactionTransferHistoryList,
} from "@bir-notebook/shared/models/general-ledger"
import type {
	TransferToGeneralLedgerInput,
	TransferTransactionToGeneralLedgerResponse,
} from "@bir-notebook/shared/models/transaction"
import type { TransactionFormData } from "@/components/transaction-form"
import type {
	BulkRecordTransactionInput,
	BulkTransactionInput,
	CreatedTransaction,
	TransactionCategory,
	TransactionCategoryList,
	TransactionCategoryListQueryParam,
	TransactionList,
	TransactionSummary,
	TransferHistoryQueryParam,
	UpdatedTransaction,
} from "@/types/transaction"
import { cleanEmptyParams } from "../api"
import { requestApi } from "../request"

const TRANSACTION_ENDPOINT = "/transactions" as const
const TRANSACTION_CATEGORY_ENDPOINT = "/transaction-categories" as const
const TRANSACTION_RECORD_ENDPOINT = `${TRANSACTION_ENDPOINT}/record` as const

export const transaction = {
	list: async (query: TransactionCategoryListQueryParam = {}) => {
		const qs = cleanEmptyParams(query)
		return requestApi<TransactionList>(TRANSACTION_ENDPOINT, {
			method: "GET",
			query: qs,
		})
	},
	create: async (payload: TransactionFormData) =>
		requestApi<CreatedTransaction>(TRANSACTION_ENDPOINT, {
			method: "POST",
			body: payload,
		}),
	update: async (id: number, payload: TransactionFormData) =>
		requestApi<UpdatedTransaction>(`${TRANSACTION_ENDPOINT}/${id}`, {
			method: "PUT",
			body: payload,
		}),
	summary: async () =>
		requestApi<TransactionSummary>(`${TRANSACTION_ENDPOINT}/summary`, {
			method: "GET",
		}),

	categories: {
		list: async (query: TransactionCategoryListQueryParam = {}) => {
			const qs = cleanEmptyParams(query)
			return requestApi<TransactionCategoryList>(
				TRANSACTION_CATEGORY_ENDPOINT,
				{ method: "GET", query: qs },
			)
		},
		detail: async (id: string) =>
			requestApi<TransactionCategory>(
				`${TRANSACTION_CATEGORY_ENDPOINT}/${id}`,
				{ method: "GET" },
			),
	},

	record: {
		withId: async (id: number) =>
			requestApi(`${TRANSACTION_ENDPOINT}/${id}/record`, { method: "POST" }),
		bulk: async (input: BulkRecordTransactionInput) =>
			requestApi(`${TRANSACTION_RECORD_ENDPOINT}/bulk`, {
				method: "POST",
				body: input,
			}),
		undo: {
			withId: async (id: number) =>
				requestApi(`${TRANSACTION_ENDPOINT}/${id}/record/undo`, {
					method: "POST",
				}),
			bulk: async (input: BulkRecordTransactionInput) =>
				requestApi(`${TRANSACTION_RECORD_ENDPOINT}/undo/bulk`, {
					method: "POST",
					body: input,
				}),
		},
	},

	transfer: {
		validate: async (input: BulkTransactionInput) =>
			requestApi(`${TRANSACTION_ENDPOINT}/transfer/validate`, {
				method: "POST",
				body: input,
			}),
		history: async (query: TransferHistoryQueryParam = {}) => {
			const qs = cleanEmptyParams(query)
			return requestApi<TransactionTransferHistoryList>(
				`${TRANSACTION_ENDPOINT}/transfer-history`,
				{
					method: "GET",
					query: qs,
				},
			)
		},
		toGeneralLedger: async (input: TransferToGeneralLedgerInput) =>
			requestApi<TransferTransactionToGeneralLedgerResponse>(
				`${TRANSACTION_ENDPOINT}/transfer-to-general-ledger`,
				{ method: "POST", body: input },
			),
		toGeneralLedgerBulk: async (input: BulkTransferToGeneralLedgerInput) =>
			requestApi<BulkTransferToGeneralLedgerResponse>(
				`${TRANSACTION_ENDPOINT}/transfer-to-general-ledger/bulk`,
				{ method: "POST", body: input },
			),
	},

	generalLedger: {
		view: async (query: GeneralLedgerViewQueryParam) => {
			const qs = cleanEmptyParams(query)
			return requestApi<GeneralLedgerViewResult>(
				`${TRANSACTION_ENDPOINT}/general-ledger/view`,
				{ method: "GET", query: qs },
			)
		},
		update: async (id: number, input: { description: string }) =>
			requestApi(`${TRANSACTION_ENDPOINT}/general-ledger/${id}`, {
				method: "PUT",
				body: input,
			}),
	},
}
