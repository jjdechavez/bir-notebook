import { createError } from "h3"
import type { ZodError } from "zod"

export function toValidationError(error: ZodError) {
	const formattedErrors = error.issues.map((item) => ({
		message: item.message,
		field: item.path.join(".") || "body",
	}))

	return createError({
		status: 422,
		statusMessage: "Validation Error",
		message: "Request validation failed",
		data: formattedErrors,
	})
}
