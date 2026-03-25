import {
  useMutation,
  useQuery,
  useQueryClient,
  type UseMutationOptions,
} from '@tanstack/react-query'

import { api } from '@/lib/api'
import {
  buildOptions,
  queryKeysFactory,
  type UseQueryOptionsWrapper,
} from '@/lib/tanstack-query/root-provider'
import type {
  UserPreference,
  UserPreferenceInput,
} from '@bir-notebook/shared/models/user'

const USER_PREFERENCE_QUERY_KEY = `user-preference` as const

export const userPreferenceKeys = queryKeysFactory(USER_PREFERENCE_QUERY_KEY)

type UserPreferenceQueryKey = typeof userPreferenceKeys

export const useUserPreference = (
  options?: UseQueryOptionsWrapper<
    UserPreference,
    Error,
    ReturnType<UserPreferenceQueryKey['details']>
  >,
) => {
  return useQuery({
    queryKey: userPreferenceKeys.details(),
    queryFn: () => api.user.preferences.detail(),
    ...options,
  })
}

export const useUpdateUserPreference = (
  options?: UseMutationOptions<UserPreference, Error, UserPreferenceInput>,
) => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (input: UserPreferenceInput) =>
      api.user.preferences.update(input),
    ...buildOptions(queryClient, [userPreferenceKeys.all], options),
  })
}
