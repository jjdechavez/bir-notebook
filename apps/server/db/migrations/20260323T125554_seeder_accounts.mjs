import { fileURLToPath } from "node:url"
import { Kysely } from "kysely"
import { loadAppConfig } from "../../config.js"
import { getAuth } from "../auth.js"
import { getPool } from "../index.js"

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
		const pool = getPool(config)
		const auth = getAuth(config, pool)

		const firstName = "Admin"
		const lastName = "Acme"
		const name = `${firstName} ${lastName}`
		await auth.api
			.createUser({
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
			.catch((e) => console.error(e))
	}
}

/**
 * @param {Kysely<any>} db
 * @returns {Promise<void>}
 */
export async function down() {
	// Migration code
}
