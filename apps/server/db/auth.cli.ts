import { betterAuth } from "better-auth"
import { admin, bearer, jwt } from "better-auth/plugins"
import { Pool } from "pg"

const databaseUrl = process.env["DATABASE_URL"] ?? ""
const baseURL = process.env["BETTER_AUTH_URL"] ?? ""
const secret = process.env["BETTER_AUTH_SECRET"] ?? ""
const trustedOrigins = (process.env["AUTH_TRUSTED_ORIGINS"] ?? "")
	.split(",")
	.map((origin) => origin.trim())
	.filter(Boolean)

export const auth = betterAuth({
	appName: "Kleber API",
	baseURL,
	basePath: "/api/auth",
	trustedOrigins,
	secret,
	database: new Pool({
		connectionString: databaseUrl,
	}),
	emailAndPassword: {
		enabled: true,
		requireEmailVerification: false,
	},
	plugins: [bearer(), jwt(), admin()],
})

export default auth
