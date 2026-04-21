import type { Health } from "@bir-notebook/shared/models/system"
import { request, requestApi } from "../request"

export const systems = {
	health: async () => await request<Health>("/health", { method: "GET" }),
	systemSetupStatus: async () =>
		await requestApi<{ setup: "completed" | "pending" }>("/setup", {
			method: "GET",
		}),
}
