import type {
  TransactionCategoryList,
  TransactionCategory,
  TransactionCategoryListQueryParam,
  CreatedTransaction,
  UpdatedTransaction,
  TransactionSummary,
} from '@/types/transaction'
import { requestApi } from '../request'
import { cleanEmptyParams } from '../api'
import type { TransactionFormData } from '@/components/transaction-form'

const TRANSACTION_ENDPOINT = '/transactions'
const TRANSACTION_CATEGORY_ENDPOINT = '/transaction-categories'

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
}
