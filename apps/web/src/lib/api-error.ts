/**
 * Extract the user-safe message from an API error. The server guarantees
 * `message` is non-technical; technical detail stays server-side under
 * `requestId`, which we surface shortened for support lookups.
 */
export function getServerMessage(error: unknown, fallback: string): string {
	const data = (
		error as {
			data?: { message?: unknown; requestId?: unknown }
			response?: { _data?: { message?: unknown; requestId?: unknown } }
		}
	)?.data
	const body = data ?? (error as { response?: { _data?: unknown } })?.response?._data
	const parsed = body as { message?: unknown; requestId?: unknown } | undefined
	const message =
		typeof parsed?.message === "string" && parsed.message.length > 0
			? parsed.message
			: null
	if (!message) return fallback
	const requestId =
		typeof parsed?.requestId === "string" ? parsed.requestId : null
	return requestId ? `${message} (ref ${requestId.slice(0, 8)})` : message
}
