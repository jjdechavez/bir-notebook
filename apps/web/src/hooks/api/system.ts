import { useQuery } from "@tanstack/react-query"

import { api } from "@/lib/api"
import {
	queryKeysFactory,
	type UseQueryOptionsWrapper,
} from "@/lib/tanstack-query/root-provider"
import type { Health } from "@bir-notebook/shared/models/system"

const HEALTH_QUERY_KEY = `health` as const

export const healthKeys = queryKeysFactory(HEALTH_QUERY_KEY)

type HealthQueryKey = typeof healthKeys

export const useHealth = (
	options?: UseQueryOptionsWrapper<
		Health,
		Error,
		ReturnType<HealthQueryKey["details"]>
	>,
) => {
	return useQuery({
		queryKey: healthKeys.details(),
		queryFn: () => api.systems.health(),
		...options,
	})
}
