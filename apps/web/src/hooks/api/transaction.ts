import type {
	GeneralLedgerViewResult,
	TransactionTransferHistoryList,
} from "@bir-notebook/shared/models/general-ledger"
import type {
	GeneralLedgerViewQueryParam,
	TransactionListQueryParam,
	TransferToGeneralLedgerInput,
	TransferTransactionToGeneralLedgerResponse,
} from "@bir-notebook/shared/models/transaction"
import {
	queryOptions,
	type UseMutationOptions,
	useMutation,
	useQuery,
	useQueryClient,
} from "@tanstack/react-query"
import type { TransactionFormData } from "@/components/transaction-form"
import { api } from "@/lib/api"
import {
	buildOptions,
	queryKeysFactory,
	type UseQueryOptionsWrapper,
} from "@/lib/tanstack-query/root-provider"
import type {
	BulkRecordTransactionInput,
	BulkRecordTransactionResponse,
	CreatedTransaction,
	EligibleTransferTransactionResult,
	TransactionCategory,
	TransactionCategoryList,
	TransactionCategoryListQueryParam,
	TransactionList,
	TransactionSummary,
	TransferHistoryQueryParam,
	UpdatedTransaction,
} from "@/types/transaction"

const TRANSACTION_CATEGORY_QUERY_KEY = `transaction-category` as const

export const transactionCategoryKeys = queryKeysFactory(
	TRANSACTION_CATEGORY_QUERY_KEY,
)

type TransactionCategoryQueryKeys = typeof transactionCategoryKeys

export const transactionCategoryOptions = (id: string) =>
	queryOptions({
		queryKey: transactionCategoryKeys.detail(id),
		queryFn: () => api.transaction.categories.detail(id),
	})

export const useTransactionCategory = (
	id: string,
	options?: UseQueryOptionsWrapper<
		TransactionCategory,
		Error,
		ReturnType<TransactionCategoryQueryKeys["detail"]>
	>,
) => {
	return useQuery({
		...transactionCategoryOptions(id),
		...options,
	})
}

export const transactionCategoriesOptions = (
	query?: TransactionCategoryListQueryParam,
) =>
	queryOptions({
		queryKey: transactionCategoryKeys.list(query),
		queryFn: () => api.transaction.categories.list(query),
	})

export const useTransactionCategoryies = (
	query?: TransactionCategoryListQueryParam,
	options?: UseQueryOptionsWrapper<
		TransactionCategoryList,
		Error,
		ReturnType<TransactionCategoryQueryKeys["list"]>
	>,
) => {
	return useQuery({
		...transactionCategoriesOptions(query),
		...options,
	})
}

const TRANSACTION_SUMMARY_QUERY_KEY = `transaction-summary` as const

export const transactionSummaryKeys = queryKeysFactory(
	TRANSACTION_SUMMARY_QUERY_KEY,
)

type TransactionSummaryQueryKeys = typeof transactionSummaryKeys

export const transactionSummaryOptions = () =>
	queryOptions({
		queryKey: transactionSummaryKeys.details(),
		queryFn: () => api.transaction.summary(),
	})

export const useTransactionSummary = (
	options?: UseQueryOptionsWrapper<
		TransactionSummary,
		Error,
		ReturnType<TransactionSummaryQueryKeys["details"]>
	>,
) => {
	return useQuery({
		...transactionSummaryOptions(),
		...options,
	})
}
const TRANSACTION_QUERY_KEY = `transaction` as const

export const transactionKeys = queryKeysFactory(TRANSACTION_QUERY_KEY)

type TransactionQueryKeys = typeof transactionKeys

export const transactionsOptions = (query?: TransactionListQueryParam) =>
	queryOptions({
		queryKey: transactionKeys.list(query),
		queryFn: () => api.transaction.list(query),
	})

export const useTransactions = (
	query?: TransactionListQueryParam,
	options?: UseQueryOptionsWrapper<
		TransactionList,
		Error,
		ReturnType<TransactionQueryKeys["list"]>
	>,
) => {
	return useQuery({
		...transactionsOptions(query),
		...options,
	})
}

export const useCreateTransaction = (
	options?: UseMutationOptions<CreatedTransaction, Error, TransactionFormData>,
) => {
	const queryClient = useQueryClient()
	return useMutation({
		mutationFn: (input: TransactionFormData) => api.transaction.create(input),
		...buildOptions(
			queryClient,
			[transactionKeys.all, transactionSummaryKeys.details()],
			options,
		),
	})
}

export const useUpdateTransaction = (
	id: number,
	options?: UseMutationOptions<UpdatedTransaction, Error, TransactionFormData>,
) => {
	const queryClient = useQueryClient()
	return useMutation({
		mutationFn: (input: TransactionFormData) =>
			api.transaction.update(id, input),
		...buildOptions(
			queryClient,
			[
				transactionKeys.all,
				transactionKeys.detail(id.toString()),
				transactionSummaryKeys.details(),
			],
			options,
		),
	})
}

const TRANSACTION_RECORD_QUERY_KEY = `transaction-record` as const

export const transactionRecordKeys = queryKeysFactory(
	TRANSACTION_RECORD_QUERY_KEY,
)

// type TransactionRecordQueryKeys = typeof transactionRecordKeys

export const useBulkRecordTransaction = (
	options?: UseMutationOptions<
		BulkRecordTransactionResponse,
		Error,
		BulkRecordTransactionInput
	>,
) => {
	const queryClient = useQueryClient()
	return useMutation({
		mutationFn: (input: BulkRecordTransactionInput) =>
			api.transaction.record.bulk(input),
		...buildOptions(queryClient, [transactionKeys.all], options),
	})
}

export const useBulkUndoRecordTransaction = (
	options?: UseMutationOptions<
		BulkRecordTransactionResponse,
		Error,
		BulkRecordTransactionInput
	>,
) => {
	const queryClient = useQueryClient()
	return useMutation({
		mutationFn: (input: BulkRecordTransactionInput) =>
			api.transaction.record.undo.bulk(input),
		...buildOptions(queryClient, [transactionKeys.all], options),
	})
}

export const useRecordTransaction = (
	options?: UseMutationOptions<BulkRecordTransactionResponse, Error, number>,
) => {
	const queryClient = useQueryClient()
	return useMutation({
		mutationFn: (id: number) => api.transaction.record.withId(id),
		...buildOptions(queryClient, [transactionKeys.all], options),
	})
}

export const useUndoRecordTransaction = (
	options?: UseMutationOptions<BulkRecordTransactionResponse, Error, number>,
) => {
	const queryClient = useQueryClient()
	return useMutation({
		mutationFn: (id: number) => api.transaction.record.undo.withId(id),
		...buildOptions(queryClient, [transactionKeys.all], options),
	})
}

const TRANSACTION_TRANSFER_HISTORY_QUERY_KEY =
	`transaction-transfer-history` as const

export const transactionTransferHistoryKeys = queryKeysFactory(
	TRANSACTION_TRANSFER_HISTORY_QUERY_KEY,
)

type TransactionTransferHistoryQueryKeys = typeof transactionTransferHistoryKeys

export const transactionTransferHistoryOptions = (
	query?: TransferHistoryQueryParam,
) =>
	queryOptions({
		queryKey: transactionTransferHistoryKeys.list(query),
		queryFn: () => api.transaction.transfer.history(query),
	})

export const useTransactionTransferHistory = (
	query?: TransferHistoryQueryParam,
	options?: UseQueryOptionsWrapper<
		TransactionTransferHistoryList,
		Error,
		ReturnType<TransactionTransferHistoryQueryKeys["list"]>
	>,
) => {
	return useQuery({
		...transactionTransferHistoryOptions(query),
		...options,
	})
}

export const useValidateTransferTransaction = (
	options?: UseMutationOptions<
		EligibleTransferTransactionResult,
		Error,
		BulkRecordTransactionInput
	>,
) => {
	const queryClient = useQueryClient()
	return useMutation({
		mutationFn: (input: BulkRecordTransactionInput) =>
			api.transaction.transfer.validate(input),
		...buildOptions(queryClient, [], options),
	})
}

const TRANSACTION_GENERAL_LEDGER_QUERY_KEY =
	`transaction-general-ledger` as const

export const transactionGeneralLedgerKeys = queryKeysFactory(
	TRANSACTION_GENERAL_LEDGER_QUERY_KEY,
)

type TransactionGeneralLedgerQueryKeys = typeof transactionGeneralLedgerKeys

export const useTransferTransactionToGeneralLedger = (
	options?: UseMutationOptions<
		TransferTransactionToGeneralLedgerResponse,
		Error,
		TransferToGeneralLedgerInput
	>,
) => {
	const queryClient = useQueryClient()
	return useMutation({
		mutationFn: (input: TransferToGeneralLedgerInput) =>
			api.transaction.transfer.toGeneralLedger(input),
		...buildOptions(
			queryClient,
			[transactionGeneralLedgerKeys.details(), transactionKeys.all],
			options,
		),
	})
}

export const generalLedgerViewOptions = (query: GeneralLedgerViewQueryParam) =>
	queryOptions({
		queryKey: transactionGeneralLedgerKeys.detailWithFilter(
			query.accountId.toString(),
			query,
		),
		queryFn: () => api.transaction.generalLedger.view(query),
	})

export const useGeneralLedgerView = (
	query: GeneralLedgerViewQueryParam,
	options?: UseQueryOptionsWrapper<
		GeneralLedgerViewResult,
		Error,
		ReturnType<TransactionGeneralLedgerQueryKeys["detailWithFilter"]>
	>,
) => {
	return useQuery({
		...generalLedgerViewOptions(query),
		...options,
	})
}

export const useUpdateGeneralLedger = (
	options?: UseMutationOptions<
		{ message: string },
		Error,
		{ id: number; description: string }
	>,
) => {
	const queryClient = useQueryClient()
	return useMutation({
		mutationFn: ({ id, ...input }: { description: string; id: number }) =>
			api.transaction.generalLedger.update(id, input),
		...buildOptions(
			queryClient,
			[transactionGeneralLedgerKeys.all, transactionTransferHistoryKeys.all],
			options,
		),
	})
}
