import { eventHandler } from "h3"

export default eventHandler(async (event) => {
	const start = Date.now()
	await event.context.pool.query("select 1 as ok")
	return {
		status: "ready",
		latencyMs: Date.now() - start,
		requestId: event.context.requestId,
	}
})
