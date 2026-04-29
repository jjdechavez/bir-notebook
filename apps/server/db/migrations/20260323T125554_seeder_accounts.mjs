import { fileURLToPath } from "node:url"
import { Kysely } from "kysely"
import { loadAppConfig } from "../../config.js"
import { getAuth } from "../auth.js"

/**
 * @param {Kysely<any>} db
 * @returns {Promise<void>}
 */
export async function up(db) {
	const adminEmail = "admin@acme.com"
	const admin = await db
		.selectFrom("user")
		.where("email", "=", adminEmail)
		.executeTakeFirst()

	if (!admin) {
		const config = await loadAppConfig(
			fileURLToPath(new URL(".", import.meta.url)),
		)
		const auth = getAuth(config)

		const firstName = "Admin"
		const lastName = "Acme"
		const name = `${firstName} ${lastName}`
		await auth.api.createUser({
			body: {
				email: adminEmail,
				name: name,
				role: "admin",
				password: "admin@Acme",
				emailVerified: true,
				data: {
					firstName,
					lastName,
				},
			},
		})
	}
}

/**
 * @param {Kysely<any>} db
 * @returns {Promise<void>}
 */
export async function down() {
	// Migration code
}
