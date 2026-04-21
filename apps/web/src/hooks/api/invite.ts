import {
	queryOptions,
	useMutation,
	useQuery,
	useQueryClient,
	type UseMutationOptions,
} from "@tanstack/react-query"

import { api, type ServerValidationError } from "@/lib/api"
import {
	buildOptions,
	queryKeysFactory,
	type UseQueryOptionsWrapper,
} from "@/lib/tanstack-query/root-provider"
import type {
	InviteCompleteInput,
	InviteListQuery,
	NewInviteInput,
	UpdateInviteInput,
} from "@bir-notebook/shared/models/invite"
import type { Invite, InviteList } from "@/types/invite"

const INVITE_QUERY_KEY = `invite` as const

export const inviteKeys = queryKeysFactory(INVITE_QUERY_KEY)

type InviteQueryKeys = typeof inviteKeys

export const invitesOptions = (query: InviteListQuery = {}) =>
	queryOptions({
		queryKey: inviteKeys.list(query),
		queryFn: () => api.invite.list(query),
	})

export const useInvites = (
	query?: InviteListQuery,
	options?: UseQueryOptionsWrapper<
		InviteList,
		Error,
		ReturnType<InviteQueryKeys["list"]>
	>,
) => {
	return useQuery({
		...invitesOptions(query),
		...options,
	})
}

export const inviteOptions = (id: string) =>
	queryOptions({
		queryKey: inviteKeys.detail(id),
		queryFn: () => api.invite.detail(id),
	})

export const useInvite = (
	id: string,
	options?: UseQueryOptionsWrapper<
		Invite,
		Error,
		ReturnType<InviteQueryKeys["detail"]>
	>,
) => {
	return useQuery({
		...inviteOptions(id),
		...options,
	})
}

export const useCreateInvite = (
	options?: UseMutationOptions<Invite, Error, NewInviteInput>,
) => {
	const queryClient = useQueryClient()
	return useMutation({
		mutationFn: (input: NewInviteInput) => api.invite.create(input),
		...buildOptions(queryClient, [inviteKeys.all], options),
	})
}

export const useUpdateInvite = (
	id: string,
	options?: UseMutationOptions<Invite, Error, UpdateInviteInput>,
) => {
	const queryClient = useQueryClient()
	return useMutation({
		mutationFn: (input: UpdateInviteInput) => api.invite.update(id, input),
		...buildOptions(
			queryClient,
			[inviteKeys.all, inviteKeys.detail(id)],
			options,
		),
	})
}

export const useGenerateInviteLink = (
	id: string,
	options?: UseMutationOptions<{ link: string }, Error, void>,
) => {
	const queryClient = useQueryClient()
	return useMutation({
		mutationFn: () => api.invite.generateLink(id),
		...buildOptions(queryClient, [], options),
	})
}

export const useCompleteInvite = (
	id: string,
	options?: UseMutationOptions<
		void,
		ServerValidationError,
		InviteCompleteInput
	>,
) => {
	const queryClient = useQueryClient()
	return useMutation({
		mutationFn: (input: InviteCompleteInput) => api.invite.complete(id, input),
		...buildOptions(
			queryClient,
			[inviteKeys.lists(), inviteKeys.detail(id)],
			options,
		),
	})
}
