import {
	queryOptions,
	useMutation,
	useQuery,
	useQueryClient,
	type UseMutationOptions,
} from "@tanstack/react-query"
import { type TransactionListQueryParam } from "@bir-notebook/shared/models/transaction"

import { api } from "@/lib/api"
import {
	queryKeysFactory,
	type UseQueryOptionsWrapper,
	buildOptions,
} from "@/lib/tanstack-query/root-provider"
import type {
	BulkRecordTransactionInput,
	BulkRecordTransactionResponse,
	CreatedTransaction,
	TransactionCategory,
	TransactionCategoryList,
	TransactionCategoryListQueryParam,
	TransactionSummary,
	UpdatedTransaction,
} from "@/types/transaction"
import type { TransactionFormData } from "@/components/transaction-form"

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
		TransactionListQueryParam,
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
