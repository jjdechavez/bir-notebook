/**
 * Filing packet fields: ECR email confirmation + payment proof per filing.
 * @param {import("kysely").Kysely<any>} db
 * @returns {Promise<void>}
 */
export async function up(db) {
	await db.schema
		.alterTable("tax_filings")
		.addColumn("ecr_ref", "varchar(120)")
		.addColumn("paid_at", "timestamptz")
		.addColumn("paid_amount", "integer")
		.execute()
}

/**
 * @param {import("kysely").Kysely<any>} db
 * @returns {Promise<void>}
 */
export async function down(db) {
	await db.schema.alterTable("tax_filings").dropColumn("paid_amount").execute()
	await db.schema.alterTable("tax_filings").dropColumn("paid_at").execute()
	await db.schema.alterTable("tax_filings").dropColumn("ecr_ref").execute()
}
