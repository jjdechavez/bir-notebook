import { createError, defineEventHandler, readValidatedBody } from "h3"
import { requireAuth } from "../middleware/auth.js"
import {
	changePasswordSchema,
	updateAccountSchema,
} from "../validators/account.js"
import { getUserWithProfile } from "../services/users.js"
import { toValidationError } from "../utils/validation.js"

export const updateAccount = defineEventHandler({
	onRequest: [requireAuth()],
	handler: async (event) => {
		const payload = await readValidatedBody(
			event,
			updateAccountSchema.safeParse,
		)
		const userId = event.context.currentUser!.id

		const updatePayload: {
			userId: string
			firstName?: string
			lastName?: string
		} = { userId }

		if (payload.data?.firstName !== undefined)
			updatePayload.firstName =
				payload.data?.firstName || event.context.currentUser!.firstName
		if (payload.data?.lastName !== undefined)
			updatePayload.lastName =
				payload.data?.lastName || event.context.currentUser!.lastName

		const fullName = `${updatePayload.firstName} ${updatePayload.lastName}`

		await event.context.db
			.updateTable("user")
			.set({
				name: fullName || event.context.currentUser!.name,
				firstName: updatePayload.firstName,
				lastName: updatePayload.lastName,
			})
			.where("id", "=", userId)
			.execute()

		const user = await getUserWithProfile(event.context.db, userId)
		if (!user) {
			throw createError({
				statusCode: 404,
				statusMessage: "Not Found",
				message: "User not found",
			})
		}

		return user
	},
})

export const changePassword = defineEventHandler({
	onRequest: [requireAuth()],
	handler: async (event) => {
		const validate = await readValidatedBody(
			event,
			changePasswordSchema.safeParse,
		)

		if (!validate.success) {
			throw toValidationError(validate.error)
		}

		const payload = validate.data

		try {
			await event.context.auth.api.changePassword({
				headers: event.headers,
				body: {
					currentPassword: payload.currentPassword,
					newPassword: payload.newPassword,
				},
			})
		} catch {
			throw createError({
				statusCode: 422,
				message: "Invalid Credentials",
				data: {
					errors: [
						{
							message: "Invalid credentials",
							field: "currentPassword",
						},
					],
				},
			})
		}

		const user = await getUserWithProfile(
			event.context.db,
			event.context.currentUser!.id,
		)

		if (!user) {
			throw createError({
				statusCode: 404,
				statusMessage: "Not Found",
				message: "User not found",
			})
		}

		return user
	},
})
