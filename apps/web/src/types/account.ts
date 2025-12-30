import type { tuyau } from '@/main'
import type { InferRequestType } from '@tuyau/react-query'

export type PersonalInformationInput = InferRequestType<
  (typeof tuyau.api.accounts)['$put']
>

export type ChangePasswordInput = InferRequestType<
  typeof tuyau.api.accounts.passwords.$post
> & { newPassword_confirmation: string }
