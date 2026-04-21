import { eventHandler, setResponseHeader } from "h3"
import { randomUUID } from "crypto"
import type { AppConfig } from "../config.js"
import { getDb, getPool } from "../db/index.js"
import { getAuth } from "../db/auth.js"
import { createLogger } from "../utils/logger.js"

export function contextMiddleware(config: AppConfig) {
	return eventHandler((event) => {
		const requestId = randomUUID()
		const pool = getPool(config)
		const db = getDb(config)
		const auth = getAuth(config, pool)
		const logger = createLogger(config.logLevel, { requestId })

		event.context.requestId = requestId
		event.context.pool = pool
		event.context.db = db
		event.context.config = config
		event.context.auth = auth
		event.context.logger = logger

		setResponseHeader(event, "x-request-id", requestId)
	})
}
