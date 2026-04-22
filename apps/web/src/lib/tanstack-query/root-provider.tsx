import {
	defaultShouldDehydrateQuery,
	isServer,
	QueryClient,
	QueryClientProvider,
	type QueryKey,
	type UseMutationOptions,
	type UseQueryOptions,
} from "@tanstack/react-query"

export function getContext() {
	const queryClient = new QueryClient({
		defaultOptions: {
			queries: {
				staleTime: 60 * 1000,
			},
			dehydrate: {
				// include pending queries in dehydration
				shouldDehydrateQuery: (query) =>
					defaultShouldDehydrateQuery(query) ||
					query.state.status === "pending",
			},
		},
	})
	return {
		queryClient,
	}
}

export function Provider({
	children,
	queryClient,
}: {
	children: React.ReactNode
	queryClient: QueryClient
}) {
	return (
		<QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
	)
}

let browserQueryClient: QueryClient | undefined = undefined

export function getQueryClient() {
	if (isServer) {
		// Server: always make a new query client
		return getContext().queryClient
	} else {
		// Browser: make a new query client if we don't already have one
		// This is very important, so we don't re-make a new client if React
		// suspends during the initial render. This may not be needed if we
		// have a suspense boundary BELOW the creation of the query client
		if (!browserQueryClient) browserQueryClient = getContext().queryClient
		return browserQueryClient
	}
}

export type UseQueryOptionsWrapper<
	// Return type of queryFn
	TQueryFn = unknown,
	// Type thrown in case the queryFn rejects
	E = Error,
	// Query key type
	TQueryKey extends QueryKey = QueryKey,
> = Omit<
	UseQueryOptions<TQueryFn, E, TQueryFn, TQueryKey>,
	"queryKey" | "queryFn" | "select" | "refetchInterval"
>

export type TQueryKey<
	TKey,
	TListQuery = unknown,
	TDetailQuery = string,
	TDetailFilterQueryType = unknown,
> = {
	all: [TKey]
	lists: () => [...TQueryKey<TKey>["all"], "list"]
	list: (
		query?: TListQuery,
	) => [
		...ReturnType<TQueryKey<TKey>["lists"]>,
		{ query: TListQuery | undefined },
	]
	details: () => [...TQueryKey<TKey>["all"], "detail"]
	detail: (
		id: TDetailQuery,
	) => [...ReturnType<TQueryKey<TKey>["details"]>, TDetailQuery]
	detailWithFilter: (
		id: TDetailQuery,
		filter: TDetailFilterQueryType,
	) => [
		...ReturnType<TQueryKey<TKey>["details"]>,
		TDetailQuery,
		{ filter: TDetailFilterQueryType | undefined },
	]
}

export const queryKeysFactory = <
	T,
	TListQueryType = unknown,
	TDetailQueryType = string,
	TDetailFilterQueryType = unknown,
>(
	globalKey: T,
) => {
	const queryKeyFactory: TQueryKey<
		T,
		TListQueryType,
		TDetailQueryType,
		TDetailFilterQueryType
	> = {
		all: [globalKey],
		lists: () => [...queryKeyFactory.all, "list"],
		list: (query?: TListQueryType) => [...queryKeyFactory.lists(), { query }],
		details: () => [...queryKeyFactory.all, "detail"],
		detail: (id: TDetailQueryType) => [...queryKeyFactory.details(), id],
		detailWithFilter: (
			id: TDetailQueryType,
			filter?: TDetailFilterQueryType,
		) => [...queryKeyFactory.detail(id), { filter }],
	}
	return queryKeyFactory
}

export const buildOptions = <
	TData,
	TError,
	TVariables,
	TContext,
	TKey extends QueryKey,
>(
	queryClient: QueryClient,
	queryKey?: TKey,
	options?: UseMutationOptions<TData, TError, TVariables, TContext>,
): UseMutationOptions<TData, TError, TVariables, TContext> => {
	return {
		...options,
		onSuccess: (...args) => {
			if (queryKey !== undefined) {
				queryKey.forEach((key) => {
					queryClient.invalidateQueries({ queryKey: key as QueryKey })
				})
			}

			if (options?.onSuccess) {
				return options.onSuccess(...args)
			}
		},
	}
}
