import type { tuyau } from '@/main'
import type { InferResponseType } from '@tuyau/react-query'

export type TransactionCategory = InferResponseType<
  (typeof tuyau.api)['transaction-categories']['$get']
>['data'][number]

export type TransactionAccount = InferResponseType<
  (typeof tuyau.api)['transaction-accounts']['$get']
>['data'][number]
