import { createError } from "h3"

type PgError = Error & {
	code?: string
	constraint?: string
	detail?: string
}

/**
 * Convert low-level Postgres/driver errors into H3 errors with user-safe
 * messages. Technical details stay in server logs (pass requestId through);
 * the client only ever sees `message` + `data.code`/`data.requestId`.
 */
export function toDbError(error: unknown, requestId?: string) {
	// Intentional HTTP errors (validation, 404s, auth) pass through untouched.
	if (
		typeof error === "object" &&
		error !== null &&
		"statusCode" in error &&
		typeof (error as { statusCode?: unknown }).statusCode === "number"
	) {
		return error
	}
	const pg = error as PgError
	const code = typeof pg?.code === "string" ? pg.code : null
	const data = { code: code ?? "DB_ERROR", requestId }

	switch (code) {
		case "23505":
			return createError({
				statusCode: 409,
				message:
					"That record already exists — your existing entry was kept and nothing was overwritten.",
				data,
			})
		case "23503":
			return createError({
				statusCode: 422,
				message:
					"That action refers to a record that no longer exists. Refresh and try again.",
				data,
			})
		case "23502":
		case "23514":
		case "22000":
		case "22P02":
			return createError({
				statusCode: 422,
				message:
					"Some of the submitted data looks invalid. Check the highlighted fields and try again.",
				data,
			})
		case "42P01":
		case "42P02":
		case "42703":
			return createError({
				statusCode: 503,
				message:
					"The database isn't up to date yet — the server needs its pending migrations run. Try again in a bit.",
				data,
			})
		case "08000":
		case "08003":
		case "08006":
		case "57P01":
			return createError({
				statusCode: 503,
				message:
					"Couldn't reach the database. Check your connection and try again.",
				data,
			})
		default:
			return createError({
				statusCode: 500,
				message: "Something went wrong while saving. Please try again.",
				data,
			})
	}
}

/** True for errors that came out of the pg driver (have a SQLSTATE code). */
export function isDbError(error: unknown): boolean {
	const pg = error as PgError
	return typeof pg?.code === "string" && /^[0-9A-Z]{5}$/.test(pg.code)
}
