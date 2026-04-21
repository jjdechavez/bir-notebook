import { createAuthClient } from "better-auth/react"
import { jwtClient, inferAdditionalFields } from "better-auth/client/plugins"
import { getAuthToken, setAuthToken } from "./auth"

const baseURL = import.meta.env.VITE_API_URL ?? "http://localhost:3333"

export const authClient = createAuthClient({
	baseURL,
	basePath: "/api/auth",
	plugins: [
		jwtClient(),
		inferAdditionalFields({
			user: {
				firstName: {
					type: "string",
				},
				lastName: {
					type: "string",
				},
				role: {
					type: ["user", "admin"],
					input: false,
				},
			},
		}),
	],
	fetchOptions: {
		auth: {
			type: "Bearer",
			token: () => getAuthToken() ?? "",
		},
		onSuccess: (ctx) => {
			const token = ctx.response.headers.get("set-auth-token")
			if (token) setAuthToken(token)
		},
	},
})

export type SessionClient = (typeof authClient)["$Infer"]["Session"]
