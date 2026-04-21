import { Kysely } from "kysely"

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
		const now = new Date()
		await db
			.insertInto("user")
			.values({
				email: adminEmail,
				password: "admin@Acme",
				firstName: "Admin",
				lastName: "Acme",
				name: "Admin Acme",
				role: "admin",
				emailVerified: true,
				createdAt: now,
				updatedAt: now,
			})
			.execute()
	}
}

/**
 * @param {Kysely<any>} db
 * @returns {Promise<void>}
 */
export async function down(db) {
	// Migration code
}
