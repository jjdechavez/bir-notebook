import {
	queryOptions,
	type UseMutationOptions,
	useMutation,
	useQuery,
	useQueryClient,
} from "@tanstack/react-query"
import { api } from "@/lib/api"
import type { CorInitInput } from "@/types/cor"
import {
	buildOptions,
	queryKeysFactory,
	type UseQueryOptionsWrapper,
} from "@/lib/tanstack-query/root-provider"

const COR_QUERY_KEY = `cor` as const
export const corKeys = queryKeysFactory(COR_QUERY_KEY)

export const corProfileOptions = () =>
	queryOptions({
		queryKey: corKeys.details(),
		queryFn: () => api.cor.profile(),
	})

export const useCorProfile = (
	options?: UseQueryOptionsWrapper<
		Awaited<ReturnType<typeof api.cor.profile>>,
		Error,
		ReturnType<typeof corKeys.details>
	>,
) => useQuery({ ...corProfileOptions(), ...options })

export const useInitCorUpload = (
	options?: UseMutationOptions<
		Awaited<ReturnType<typeof api.cor.init>>,
		Error,
		CorInitInput
	>,
) => {
	return useMutation({
		mutationFn: (input: CorInitInput) => api.cor.init(input),
		...options,
	})
}

export const useExtractCor = (
	options?: UseMutationOptions<
		Awaited<ReturnType<typeof api.cor.extract>>,
		Error,
		{ docId: number; force?: boolean }
	>,
) => {
	const queryClient = useQueryClient()
	return useMutation({
		mutationFn: ({ docId, force }: { docId: number; force?: boolean }) =>
			api.cor.extract(docId, force),
		...buildOptions(queryClient, [corKeys.all], options),
	})
}

export const useConfirmCor = (
	options?: UseMutationOptions<
		Awaited<ReturnType<typeof api.cor.confirm>>,
		Error,
		Record<string, unknown>
	>,
) => {
	const queryClient = useQueryClient()
	return useMutation({
		mutationFn: (payload: Record<string, unknown>) => api.cor.confirm(payload),
		...buildOptions(queryClient, [corKeys.all], options),
	})
}

const TAX_QUERY_KEY = `tax` as const
export const taxKeys = queryKeysFactory(TAX_QUERY_KEY)

export const worksheetOptions = (q: {
	year: number
	quarter: number
	priorCumulative51?: number
	priorPaid?: number
	grossOverride?: number
	penaltySurcharge?: number
	penaltyInterest?: number
	penaltyCompromise?: number
	withheld2307?: number
	nonOperating?: number
}) =>
	queryOptions({
		queryKey: taxKeys.detailWithFilter(`ws-${q.year}-Q${q.quarter}`, q),
		queryFn: () => api.tax.worksheet(q),
	})

export const filingsOptions = () =>
	queryOptions({
		queryKey: taxKeys.list(),
		queryFn: () => api.tax.filings(),
	})

export const useFilings = (
	options?: UseQueryOptionsWrapper<
		Awaited<ReturnType<typeof api.tax.filings>>,
		Error,
		ReturnType<typeof taxKeys.list>
	>,
) => useQuery({ ...filingsOptions(), ...options })

const COR_DOCS_QUERY_KEY = `cor-docs` as const
export const corDocsKeys = queryKeysFactory(COR_DOCS_QUERY_KEY)

export const corDocsOptions = () =>
	queryOptions({
		queryKey: corDocsKeys.list(),
		queryFn: () => api.cor.docs(),
	})

export const useCorDocs = (
	options?: UseQueryOptionsWrapper<
		Awaited<ReturnType<typeof api.cor.docs>>,
		Error,
		ReturnType<typeof corDocsKeys.list>
	>,
) => useQuery({ ...corDocsOptions(), ...options })

export const useDeleteCorDoc = (
	options?: UseMutationOptions<
		Awaited<ReturnType<typeof api.cor.removeDoc>>,
		Error,
		number
	>,
) => {
	const queryClient = useQueryClient()
	return useMutation({
		mutationFn: (id: number) => api.cor.removeDoc(id),
		...buildOptions(queryClient, [corDocsKeys.all], options),
	})
}

export const corPreviewOptions = (id: number | null) =>
	queryOptions({
		queryKey: corDocsKeys.detail(id?.toString() ?? "none"),
		queryFn: () => api.cor.preview(id as number),
		enabled: id !== null,
		staleTime: 10 * 60 * 1000,
	})

export const useCorPreview = (
	id: number | null,
	options?: UseQueryOptionsWrapper<
		Awaited<ReturnType<typeof api.cor.preview>>,
		Error,
		ReturnType<typeof corDocsKeys.detail>
	>,
) => useQuery({ ...corPreviewOptions(id), ...options })
