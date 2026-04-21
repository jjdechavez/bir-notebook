import { queryOptions, useQuery } from "@tanstack/react-query"

import { api } from "@/lib/api"
import {
	queryKeysFactory,
	type UseQueryOptionsWrapper,
} from "@/lib/tanstack-query/root-provider"
import type {
	ChartOfAccountList,
	ChartOfAccountListQueryParam,
} from "@/types/transaction"

const CHART_OF_ACCOUNT_QUERY_KEY = `chart-of-account` as const

export const chartOfAccountKeys = queryKeysFactory(CHART_OF_ACCOUNT_QUERY_KEY)

type ChartOfAccountQueryKeys = typeof chartOfAccountKeys

export const chartOfAccountsOptions = (query?: ChartOfAccountListQueryParam) =>
	queryOptions({
		queryKey: chartOfAccountKeys.list(query),
		queryFn: () => api.chartOfAccount.list(query),
	})

export const useChartOfAccounts = (
	query?: ChartOfAccountListQueryParam,
	options?: UseQueryOptionsWrapper<
		ChartOfAccountList,
		Error,
		ReturnType<ChartOfAccountQueryKeys["list"]>
	>,
) => {
	return useQuery({
		...chartOfAccountsOptions(query),
		...options,
	})
}

export const currentChartOfAccountsOptions = () =>
	queryOptions({
		queryKey: chartOfAccountKeys.details(),
		queryFn: () => api.chartOfAccount.accounts(),
	})

export const useCurrentChartOfAccounts = (
	options?: UseQueryOptionsWrapper<
		ChartOfAccountList,
		Error,
		ReturnType<ChartOfAccountQueryKeys["details"]>
	>,
) => {
	return useQuery({
		...currentChartOfAccountsOptions(),
		...options,
	})
}
