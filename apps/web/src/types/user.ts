import type { tuyau } from '@/main'
import type { InferRequestType, InferResponseType } from '@tuyau/react-query'

export type User = InferResponseType<
  typeof tuyau.api.users.$get
>['data'][number]

export type UserInput = InferRequestType<
  // @ts-ignore
  (typeof tuyau.api.users)[':id']['$put']
>
