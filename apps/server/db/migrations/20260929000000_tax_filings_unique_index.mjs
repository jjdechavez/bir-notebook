import { sql } from "kysely"

/**
 * The original tax onboarding migration created a PLAIN index named
 * uq_tax_filings_user_form_year_quarter. Postgres ON CONFLICT requires a
 * real unique/exclusion constraint, so every upsert failed with
 * "there is no unique or exclusion constraint matching the ON CONFLICT
 * specification". Replace it with a genuine unique index.
 * NULLS NOT DISTINCT (Postgres 15+) keeps annual rows (quarter IS NULL)
 * covered by the same uniqueness rule.
 *
 * @param {import("kysely").Kysely<any>} db
 * @returns {Promise<void>}
 */
export async function up(db) {
	await sql`DROP INDEX IF EXISTS "uq_tax_filings_user_form_year_quarter"`.execute(
		db,
	)
	await sql`
    CREATE UNIQUE INDEX "uq_tax_filings_user_form_year_quarter"
    ON "tax_filings" ("user_id", "form_type", "year", "quarter")
    NULLS NOT DISTINCT
  `.execute(db)
}

/**
 * @param {import("kysely").Kysely<any>} db
 * @returns {Promise<void>}
 */
export async function down(db) {
	await sql`DROP INDEX IF EXISTS "uq_tax_filings_user_form_year_quarter"`.execute(
		db,
	)
	await sql`
    CREATE INDEX "uq_tax_filings_user_form_year_quarter"
    ON "tax_filings" ("user_id", "form_type", "year", "quarter")
  `.execute(db)
}
