import type { tuyau } from '@/main'
import type { InferRequestType, InferResponseType } from '@tuyau/react-query'

export type Transaction = InferResponseType<
  (typeof tuyau.api)['transactions']['$get']
>['data'][number]

export type TransactionCategory = InferResponseType<
  (typeof tuyau.api)['transaction-categories']['$get']
>['data'][number]

export type TransactionAccount = InferResponseType<
  (typeof tuyau.api)['transaction-accounts']['$get']
>['data'][number]

export type TransactionSearch = InferRequestType<
  (typeof tuyau.api)['transactions']['$get']
>
