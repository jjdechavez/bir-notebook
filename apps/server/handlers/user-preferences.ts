import { defineEventHandler, readValidatedBody, setResponseStatus } from "h3"
import { requireAuth } from "../middleware/auth.js"
import { updateUserPreferenceSchema } from "../validators/user.js"
import { toValidationError } from "../utils/validation.js"
import { serializeUserPreference } from "../serializers/user-preference.js"
import { UserPreferences } from "../db/types.js"
import { Selectable } from "kysely"

export const getUserPreferences = defineEventHandler({
	onRequest: [requireAuth()],
	handler: async (event) => {
		const userId = event.context.currentUser!.id
		let preference = await event.context.db
			.selectFrom("user_preferences")
			.selectAll()
			.where("user_id", "=", userId)
			.executeTakeFirst()

		if (!preference) {
			preference = await event.context.db
				.insertInto("user_preferences")
				.values({
					user_id: userId,
					navigation_layout: "sidebar",
					theme: "system",
					created_at: new Date(),
					updated_at: new Date(),
				})
				.returningAll()
				.executeTakeFirst()
		}

		return preference
	},
})

export const updateUserPreferences = defineEventHandler({
	onRequest: [requireAuth()],
	handler: async (event) => {
		const userId = event.context.currentUser!.id
		const payload = await readValidatedBody(event, (body) =>
			updateUserPreferenceSchema.safeParse(body),
		)

		if (!payload.success) {
			return toValidationError(payload.error)
		}

		const preference = await event.context.db
			.selectFrom("user_preferences")
			.selectAll()
			.where("user_id", "=", userId)
			.executeTakeFirst()

		if (!preference) {
			const created = await event.context.db
				.insertInto("user_preferences")
				.values({
					user_id: userId,
					navigation_layout: payload.data.navigationLayout ?? "sidebar",
					theme: payload.data.theme ?? "system",
					created_at: new Date(),
					updated_at: new Date(),
				})
				.returningAll()
				.executeTakeFirst()

			setResponseStatus(event, 201)
			return {
				message: "User preference has been created",
				data: created,
			}
		}

		const updated = await event.context.db
			.updateTable("user_preferences")
			.set({
				navigation_layout:
					payload.data.navigationLayout ?? preference.navigation_layout,
				theme: payload.data.theme ?? preference.theme,
				updated_at: new Date(),
			})
			.where("user_id", "=", userId)
			.returningAll()
			.executeTakeFirst()

		return {
			message: "User preference has been updated",
			data: updated,
		}
	},
})
