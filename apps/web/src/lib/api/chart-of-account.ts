import type {
	ChartOfAccountList,
	ChartOfAccountListQueryParam,
} from "@/types/transaction"
import { cleanEmptyParams } from "../api"
import { requestApi } from "../request"

const CHART_OF_ACCOUNTS_ENDPOINT = "/chart-of-accounts"

export const chartOfAccount = {
	list: async (query: ChartOfAccountListQueryParam = {}) => {
		const qs = cleanEmptyParams(query)
		return requestApi<ChartOfAccountList>(CHART_OF_ACCOUNTS_ENDPOINT, {
			method: "GET",
			query: qs,
		})
	},
	accounts: async () =>
		requestApi<ChartOfAccountList>(`${CHART_OF_ACCOUNTS_ENDPOINT}/accounts`, {
			method: "GET",
		}),
}
