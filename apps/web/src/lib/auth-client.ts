import { inferAdditionalFields, jwtClient } from "better-auth/client/plugins"
import { createAuthClient } from "better-auth/react"
import { getAuthToken, setAuthToken } from "./auth-token"

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
