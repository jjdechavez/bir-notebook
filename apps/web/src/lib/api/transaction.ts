import type {
  TransactionCategoryList,
  TransactionCategory,
  TransactionCategoryListQueryParam,
  CreatedTransaction,
  UpdatedTransaction,
  TransactionSummary,
  BulkRecordTransactionInput,
} from '@/types/transaction'
import { requestApi } from '../request'
import { cleanEmptyParams } from '../api'
import type { TransactionFormData } from '@/components/transaction-form'

const TRANSACTION_ENDPOINT = '/transactions' as const
const TRANSACTION_CATEGORY_ENDPOINT = '/transaction-categories' as const
const TRANSACTION_RECORD_ENDPOINT = `${TRANSACTION_ENDPOINT}/record` as const

export const transaction = {
  list: async (query: TransactionCategoryListQueryParam = {}) => {
    const qs = cleanEmptyParams(query)
    return requestApi(TRANSACTION_ENDPOINT, { method: 'GET', query: qs })
  },
  create: async (payload: TransactionFormData) =>
    requestApi<CreatedTransaction>(TRANSACTION_ENDPOINT, {
      method: 'POST',
      body: payload,
    }),
  update: async (id: number, payload: TransactionFormData) =>
    requestApi<UpdatedTransaction>(`${TRANSACTION_ENDPOINT}/${id}`, {
      method: 'PUT',
      body: payload,
    }),
  summary: async () =>
    requestApi<TransactionSummary>(`${TRANSACTION_ENDPOINT}/summary`, {
      method: 'GET',
    }),

  categories: {
    list: async (query: TransactionCategoryListQueryParam = {}) => {
      const qs = cleanEmptyParams(query)
      return requestApi<TransactionCategoryList>(
        TRANSACTION_CATEGORY_ENDPOINT,
        { method: 'GET', query: qs },
      )
    },
    detail: async (id: string) =>
      requestApi<TransactionCategory>(
        `${TRANSACTION_CATEGORY_ENDPOINT}/${id}`,
        { method: 'GET' },
      ),
  },

  record: {
    withId: async (id: number) =>
      requestApi(`${TRANSACTION_ENDPOINT}/${id}/record`, { method: 'POST' }),
    bulk: async (input: BulkRecordTransactionInput) =>
      requestApi(`${TRANSACTION_RECORD_ENDPOINT}/bulk`, {
        method: 'POST',
        body: input,
      }),
    undo: {
      withId: async (id: number) =>
        requestApi(`${TRANSACTION_ENDPOINT}/${id}/record/undo`, {
          method: 'POST',
        }),
      bulk: async (input: BulkRecordTransactionInput) =>
        requestApi(`${TRANSACTION_RECORD_ENDPOINT}/undo/bulk`, {
          method: 'POST',
          body: input,
        }),
    },
  },
}
