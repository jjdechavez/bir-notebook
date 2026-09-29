import { sql } from "kysely"

/**
 * @param {import("kysely").Kysely<any>} db
 * @returns {Promise<void>}
 */
export async function up(db) {
	await db.schema
		.createTable("tax_profiles")
		.addColumn("user_id", "text", (col) => col.primaryKey())
		.addColumn("tin", "varchar(14)", (col) => col.notNull())
		.addColumn("branch_code", "varchar(5)", (col) =>
			col.defaultTo("00000").notNull(),
		)
		.addColumn("rdo_code", "varchar(10)", (col) => col.notNull())
		.addColumn("taxpayer_type", "varchar(40)", (col) => col.notNull())
		.addColumn("atc", "varchar(10)", (col) => col.notNull())
		.addColumn("registered_name", "text", (col) => col.notNull())
		.addColumn("trade_name", "varchar(120)")
		.addColumn("registered_address", "text", (col) => col.notNull())
		.addColumn("zip", "varchar(10)")
		.addColumn("registration_date", "date", (col) => col.notNull())
		.addColumn("tin_issuance_date", "date")
		.addColumn("is_vat", "boolean", (col) => col.defaultTo(false).notNull())
		.addColumn("is_8pct_current_year", "boolean", (col) =>
			col.defaultTo(false).notNull(),
		)
		.addColumn("eight_pct_year", "integer")
		.addColumn("has_employees", "boolean", (col) =>
			col.defaultTo(false).notNull(),
		)
		.addColumn("psic", "varchar(20)")
		.addColumn("line_of_business", "varchar(120)")
		.addColumn("books_type", "varchar(40)")
		.addColumn("created_at", "timestamptz", (col) =>
			col.defaultTo(sql`CURRENT_TIMESTAMP`).notNull(),
		)
		.addColumn("updated_at", "timestamptz", (col) =>
			col.defaultTo(sql`CURRENT_TIMESTAMP`).notNull(),
		)
		.addForeignKeyConstraint(
			"tax_profiles_user_id_fk",
			["user_id"],
			"user",
			["id"],
			(fk) => fk.onDelete("cascade"),
		)
		.execute()

	await sql`
    alter table "tax_profiles"
    add constraint "check_tin_format" check (tin ~ '^[0-9]{3}-[0-9]{3}-[0-9]{3}$')
  `.execute(db)

	await sql`
    alter table "tax_profiles"
    add constraint "check_branch_format" check (branch_code ~ '^[0-9]{5}$')
  `.execute(db)

	await db.schema
		.createTable("tax_obligations")
		.addColumn("id", "serial", (col) => col.primaryKey())
		.addColumn("user_id", "text", (col) => col.notNull())
		.addColumn("tax_type", "varchar(80)", (col) => col.notNull())
		.addColumn("form_type", "varchar(20)", (col) => col.notNull())
		.addColumn("frequency", "varchar(20)", (col) => col.notNull())
		.addColumn("start_date", "date", (col) => col.notNull())
		.addColumn("end_date", "date")
		.addColumn("is_active", "boolean", (col) => col.defaultTo(true).notNull())
		.addColumn("created_at", "timestamptz", (col) =>
			col.defaultTo(sql`CURRENT_TIMESTAMP`).notNull(),
		)
		.addForeignKeyConstraint(
			"tax_obligations_user_id_fk",
			["user_id"],
			"user",
			["id"],
			(fk) => fk.onDelete("cascade"),
		)
		.execute()

	await db.schema
		.createIndex("uq_tax_obligations_user_form_start")
		.on("tax_obligations")
		.columns(["user_id", "form_type", "start_date"])
		.execute()

	await db.schema
		.createTable("cor_documents")
		.addColumn("id", "serial", (col) => col.primaryKey())
		.addColumn("user_id", "text", (col) => col.notNull())
		.addColumn("r2_key_original", "text", (col) => col.notNull())
		.addColumn("r2_key_display", "text")
		.addColumn("r2_key_json", "text")
		.addColumn("mime", "varchar(40)", (col) => col.notNull())
		.addColumn("size_bytes", "integer", (col) => col.notNull())
		.addColumn("ocn", "varchar(40)")
		.addColumn("tax_year", "integer")
		.addColumn("status", "varchar(40)", (col) =>
			col.defaultTo("uploaded").notNull(),
		)
		.addColumn("original_filename", "varchar(255)")
		.addColumn("created_at", "timestamptz", (col) =>
			col.defaultTo(sql`CURRENT_TIMESTAMP`).notNull(),
		)
		.addForeignKeyConstraint(
			"cor_documents_user_id_fk",
			["user_id"],
			"user",
			["id"],
			(fk) => fk.onDelete("cascade"),
		)
		.execute()

	await db.schema
		.createIndex("idx_cor_documents_user")
		.on("cor_documents")
		.column("user_id")
		.execute()

	await db.schema
		.createTable("tax_filings")
		.addColumn("id", "serial", (col) => col.primaryKey())
		.addColumn("user_id", "text", (col) => col.notNull())
		.addColumn("form_type", "varchar(20)", (col) => col.notNull())
		.addColumn("year", "integer", (col) => col.notNull())
		.addColumn("quarter", "integer")
		.addColumn("status", "varchar(20)", (col) =>
			col.defaultTo("upcoming").notNull(),
		)
		.addColumn("inputs", "jsonb")
		.addColumn("computed", "jsonb")
		.addColumn("filed_at", "timestamptz")
		.addColumn("payment_ref", "varchar(120)")
		.addColumn("created_at", "timestamptz", (col) =>
			col.defaultTo(sql`CURRENT_TIMESTAMP`).notNull(),
		)
		.addColumn("updated_at", "timestamptz", (col) =>
			col.defaultTo(sql`CURRENT_TIMESTAMP`).notNull(),
		)
		.addForeignKeyConstraint(
			"tax_filings_user_id_fk",
			["user_id"],
			"user",
			["id"],
			(fk) => fk.onDelete("cascade"),
		)
		.execute()

	await db.schema
		.createIndex("uq_tax_filings_user_form_year_quarter")
		.unique()
		.on("tax_filings")
		.columns(["user_id", "form_type", "year", "quarter"])
		.execute()
}

/**
 * @param {import("kysely").Kysely<any>} db
 * @returns {Promise<void>}
 */
export async function down(db) {
	await db.schema.dropTable("tax_filings").ifExists().execute()
	await db.schema.dropTable("cor_documents").ifExists().execute()
	await db.schema.dropTable("tax_obligations").ifExists().execute()
	await db.schema.dropTable("tax_profiles").ifExists().execute()
}
