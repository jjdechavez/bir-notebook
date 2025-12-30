import type { tuyau } from '@/main'
import type { InferRequestType, InferResponseType } from '@tuyau/react-query'

export type Invite = InferResponseType<
  typeof tuyau.api.invites.$get
>['data'][number]

export type InviteInput = InferRequestType<typeof tuyau.api.invites.$post>

export type InviteCompleteInput = InferRequestType<
  (typeof tuyau.api.invites)[':id']['complete']['$post']
> & { password_confirmation: string }
