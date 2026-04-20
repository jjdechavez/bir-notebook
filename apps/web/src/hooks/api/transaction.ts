import {
  queryOptions,
  useMutation,
  useQuery,
  useQueryClient,
  type UseMutationOptions,
} from '@tanstack/react-query'

import { api } from '@/lib/api'
import {
  queryKeysFactory,
  type UseQueryOptionsWrapper,
  buildOptions,
} from '@/lib/tanstack-query/root-provider'
import type {
  CreatedTransaction,
  TransactionCategory,
  TransactionCategoryList,
  TransactionCategoryListQueryParam,
  TransactionListQueryParam,
} from '@/types/transaction'
import type { TransactionFormData } from '@/components/transaction-form'

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
    ReturnType<TransactionCategoryQueryKeys['detail']>
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
    ReturnType<TransactionCategoryQueryKeys['list']>
  >,
) => {
  return useQuery({
    ...transactionCategoriesOptions(query),
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
    ReturnType<TransactionQueryKeys['list']>
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
    ...buildOptions(queryClient, [transactionKeys.all], options),
  })
}
