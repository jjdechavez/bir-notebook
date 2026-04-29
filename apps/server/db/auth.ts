import { betterAuth } from "better-auth"
import { admin, bearer, jwt } from "better-auth/plugins"
import type { Pool } from "pg"
import type { AppConfig } from "../config.js"

export function getAuth(config: AppConfig, pool: Pool) {
	const auth = betterAuth({
		debug: true,
		appName: "Kleber API",
		baseURL: config.auth.baseURL,
		basePath: "/api/auth",
		trustedOrigins: config.auth.trustedOrigins,
		secret: config.auth.secret,
		database: pool,
		emailAndPassword: {
			enabled: true,
			requireEmailVerification: false,
		},
		plugins: [bearer(), jwt(), admin()],
		logger: {
			level: config.logLevel,
		},
		user: {
			additionalFields: {
				firstName: {
					type: "string",
					required: true,
				},
				lastName: {
					type: "string",
					required: true,
				},
				role: {
					type: ["user", "admin"],
					required: false,
					defaultValue: "user",
					// input: false, // don't allow user to set role
				},
			},
		},
	})
	return auth
}

export type Session = ReturnType<typeof getAuth>["$Infer"]["Session"]
