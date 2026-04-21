import {
	eventHandler,
	getRequestHeader,
	setResponseHeader,
	setResponseStatus,
} from "h3"
import type { AppConfig } from "../config.js"

function isOriginAllowed(origin: string, allowed: string[]): boolean {
	if (allowed.length === 0) return false
	if (allowed.includes("*")) return true
	return allowed.includes(origin)
}

export function corsMiddleware(config: AppConfig) {
	return eventHandler((event) => {
		const origin = getRequestHeader(event, "origin")
		if (!origin) return

		if (isOriginAllowed(origin, config.corsOrigins)) {
			setResponseHeader(event, "access-control-allow-origin", origin)
			setResponseHeader(event, "access-control-allow-credentials", "true")
			setResponseHeader(
				event,
				"access-control-allow-headers",
				"content-type, authorization",
			)
			setResponseHeader(
				event,
				"access-control-allow-methods",
				"GET,POST,PUT,PATCH,DELETE,OPTIONS",
			)
			setResponseHeader(
				event,
				"access-control-expose-headers",
				"content-length, x-request-id",
			)
			setResponseHeader(event, "vary", "origin")
		}

		if (event.method === "OPTIONS") {
			setResponseStatus(event, 204)
			return ""
		}
	})
}
