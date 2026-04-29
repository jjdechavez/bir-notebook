import { type FetchOptions, ofetch } from "ofetch"
import { getAuthToken } from "./auth-token"
import { camelKeys } from "./utils"

const isDev = import.meta.env.DEV

const ofetchBaseConfig: FetchOptions = {
	timeout: 3000,
	async onRequest({ request, options }) {
		if (isDev) {
			console.log("[fetch request]", request, options)
		}
	},
	async onRequestError({ request, response, error }) {
		if (isDev) {
			console.log(
				"[fetch request error]",
				request,
				response?.status,
				response?.body,
			)
			console.error(error)
		}
	},
	async onResponse({ request, options, response }) {
		if (isDev) {
			console.log("[fetch response]", request, options)
		}
		response._data = camelKeys(response._data)
	},
}

export const request = ofetch.create({
	...ofetchBaseConfig,
	baseURL: import.meta.env.VITE_API_URL || "",
})

export const requestApi = ofetch.create({
	...ofetchBaseConfig,
	baseURL: import.meta.env.VITE_API_URL
		? `${import.meta.env.VITE_API_URL}/api`
		: "/api",
	credentials: "include",
	async onRequest({ request, options }) {
		if (isDev) {
			console.log("[fetch request]", request, options)
		}
		const token = getAuthToken()
		if (token) {
			options.headers.set("Authorization", `Bearer ${token}`)
		}
	},
	async onResponse({ request, options, response }) {
		if (isDev) {
			console.log("[fetch response]", request, options)
		}
		response._data = camelKeys(response._data)
		if (response.status === 401) {
			console.warn("Unauthorized: redirecting to login")
			if (typeof window !== "undefined") {
				window.location.href = "/login"
			}
		}
	},
})
