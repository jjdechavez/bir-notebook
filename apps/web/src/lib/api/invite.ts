import type {
	InviteCompleteInput,
	InviteListQuery,
	NewInviteInput,
	UpdateInviteInput,
} from "@bir-notebook/shared/models/invite"
import { requestApi } from "../request"
import { cleanEmptyParams } from "../api"
import type { Invite, InviteList } from "@/types/invite"

const ENDPOINT = "/invites"

export const invite = {
	create: async (input: NewInviteInput) =>
		requestApi<Invite>(ENDPOINT, { method: "POST", body: input }),
	list: async (query: InviteListQuery = {}) => {
		const cleanQuery = cleanEmptyParams(query)
		return requestApi<InviteList>(ENDPOINT, {
			method: "GET",
			query: cleanQuery,
		})
	},
	update: async (id: string, input: UpdateInviteInput) =>
		requestApi<Invite>(`${ENDPOINT}/${id}`, { method: "PUT", body: input }),
	detail: async (id: string) =>
		requestApi<Invite>(`${ENDPOINT}/${id}`, { method: "GET" }),
	generateLink: async (id: string) =>
		requestApi<{ link: string }>(`${ENDPOINT}/${id}/generate`, {
			method: "GET",
		}),
	complete: async (id: string, input: InviteCompleteInput) =>
		requestApi(`${ENDPOINT}/${id}/complete`, { method: "POST", body: input }),
}
