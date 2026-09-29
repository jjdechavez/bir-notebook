import { createApp, setResponseHeader, setResponseStatus } from "h3"
import type { AppConfig } from "./config.js"
import { contextMiddleware } from "./middleware/context.js"
import { corsMiddleware } from "./middleware/cors.js"
import { createApiRouter } from "./routes/index.js"

export function createApiApp(config: AppConfig) {
	const app = createApp({
		onError(error, event) {
			const requestId = event.context.requestId

			const statusCode =
				error instanceof Error && "statusCode" in error
					? Number((error as { statusCode?: number }).statusCode)
					: 500

			// Full technical detail stays server-side; the client only gets
			// a safe message plus the request id for support lookups.
			event.context.logger?.error("unhandled request error", {
				requestId,
				message: error instanceof Error ? error.message : String(error),
				stack: error instanceof Error ? error.stack : undefined,
			})

			setResponseStatus(event, statusCode || 500)
			setResponseHeader(event, "content-type", "application/json")

			const clientMessage =
				statusCode >= 500
					? "Something went wrong on our end. Please try again."
					: error instanceof Error
						? error.message
						: "Unhandled error"

			return {
				code: statusCode >= 500 ? "INTERNAL_ERROR" : "REQUEST_ERROR",
				message: clientMessage,
				requestId,
			}
		},
	})

	app.use(contextMiddleware(config))
	app.use(corsMiddleware(config))
	app.use(createApiRouter())

	return app
}
