import { createServer } from "node:http"
import { fileURLToPath } from "node:url"
import { toNodeListener } from "h3"
import { createApiApp } from "./app.js"
import { loadAppConfig } from "./config.js"
import { closeDb, getDb } from "./db/index.js"

const config = await loadAppConfig(fileURLToPath(new URL(".", import.meta.url)))
const app = createApiApp(config)
const server = createServer(toNodeListener(app))

server.listen(config.port, config.host, () => {
	console.log(
		JSON.stringify({
			level: "info",
			message: "API server started",
			host: config.host,
			port: config.port,
			env: config.env,
		}),
	)
})

const shutdown = async (signal: string) => {
	console.log(
		JSON.stringify({
			level: "warn",
			message: "Shutting down",
			signal,
		}),
	)

	server.close(async () => {
		await closeDb()
		process.exit(0)
	})

	setTimeout(() => {
		console.error(
			JSON.stringify({
				level: "error",
				message: "Shutdown timeout reached",
				signal,
			}),
		)
		process.exit(1)
	}, 10000).unref()
}

process.on("SIGINT", () => void shutdown("SIGINT"))
process.on("SIGTERM", () => void shutdown("SIGTERM"))

void getDb(config)
