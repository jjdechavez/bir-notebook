import { loadConfig, setupDotenv } from "c12"
import { z } from "zod"

const configSchema = z.object({
	env: z.enum(["development", "test", "production"]),
	host: z.string().default("0.0.0.0"),
	port: z.number().int().min(1).max(65535),
	logLevel: z.enum(["debug", "info", "warn", "error"]),
	databaseUrl: z.string().min(1),
	corsOrigins: z.array(z.string()).default([]),
	feUrl: z.string().min(1),
	auth: z.object({
		baseURL: z.string().min(1),
		secret: z.string().min(1),
		trustedOrigins: z.array(z.string()).default([]),
	}),
})

export type AppConfig = z.infer<typeof configSchema>

function parseList(value: string | undefined): string[] {
	if (!value) return []
	return value
		.split(",")
		.map((item) => item.trim())
		.filter(Boolean)
}

export async function loadAppConfig(cwd = process.cwd()): Promise<AppConfig> {
	await setupDotenv({ cwd })

	const env = (process.env["NODE_ENV"] as AppConfig["env"]) ?? "development"
	const host = process.env["HOST"] ?? "0.0.0.0"
	const port = Number(process.env["PORT"] ?? 3000)
	const baseURL =
		process.env["BETTER_AUTH_URL"] ??
		process.env["AUTH_BASE_URL"] ??
		`http://localhost:${port}`
	const secret =
		process.env["BETTER_AUTH_SECRET"] ??
		process.env["AUTH_SECRET"] ??
		(env === "production" ? "" : "dev-secret-change-me")

	const defaults: AppConfig = {
		env,
		host,
		port,
		logLevel: (process.env["LOG_LEVEL"] as AppConfig["logLevel"]) ?? "info",
		databaseUrl: process.env["DATABASE_URL"] ?? "",
		corsOrigins: parseList(process.env["CORS_ORIGINS"]),
		feUrl: process.env["FE_URL"] ?? "",
		auth: {
			baseURL,
			secret,
			trustedOrigins: parseList(process.env["AUTH_TRUSTED_ORIGINS"]),
		},
	}

	const { config } = await loadConfig<AppConfig>({
		name: "app",
		cwd,
		dotenv: true,
		defaults,
	})
	return configSchema.parse(config)
}
