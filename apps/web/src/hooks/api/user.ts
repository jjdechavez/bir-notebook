import type {
	UserPreference,
	UserPreferenceInput,
} from "@bir-notebook/shared/models/user"
import {
	queryOptions,
	type UseMutationOptions,
	useMutation,
	useQuery,
	useQueryClient,
} from "@tanstack/react-query"
import { api } from "@/lib/api"
import {
	buildOptions,
	queryKeysFactory,
	type UseQueryOptionsWrapper,
} from "@/lib/tanstack-query/root-provider"
import type {
	ChangePasswordInput,
	PersonalInformationInput,
} from "@/types/account"
import type {
	ListUserQueryParam,
	User,
	UserInput,
	UserList,
} from "@/types/user"

const USER_PREFERENCE_QUERY_KEY = `user-preference` as const

export const userPreferenceKeys = queryKeysFactory(USER_PREFERENCE_QUERY_KEY)

type UserPreferenceQueryKey = typeof userPreferenceKeys

export const useUserPreference = (
	options?: UseQueryOptionsWrapper<
		UserPreference,
		Error,
		ReturnType<UserPreferenceQueryKey["details"]>
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

const USER_QUERY_KEY = `user` as const

export const userKeys = queryKeysFactory(USER_QUERY_KEY)

type UserQueryKeys = typeof userKeys

export const usersOptions = (query: ListUserQueryParam = {}) =>
	queryOptions({
		queryKey: userKeys.list(query),
		queryFn: () => api.user.list(query),
	})

export const useUsers = (
	query?: ListUserQueryParam,
	options?: UseQueryOptionsWrapper<
		UserList,
		Error,
		ReturnType<UserQueryKeys["list"]>
	>,
) => {
	return useQuery({
		...usersOptions(query),
		...options,
	})
}

export const useUpdateUser = (
	id: string,
	options?: UseMutationOptions<User, Error, UserInput>,
) => {
	const queryClient = useQueryClient()
	return useMutation({
		mutationFn: (input: UserInput) => api.user.update(id, input),
		...buildOptions(queryClient, [userKeys.all], options),
	})
}

export const useChangePassword = (
	options?: UseMutationOptions<User, Error, ChangePasswordInput>,
) => {
	const queryClient = useQueryClient()
	return useMutation({
		mutationFn: (input: ChangePasswordInput) =>
			api.user.account.changePassword(input),
		...buildOptions(queryClient, [], options),
	})
}

export const useUpdatePersonalInformation = (
	options?: UseMutationOptions<User, Error, PersonalInformationInput>,
) => {
	const queryClient = useQueryClient()
	return useMutation({
		mutationFn: (input: PersonalInformationInput) =>
			api.user.account.update(input),
		...buildOptions(queryClient, [], options),
	})
}
