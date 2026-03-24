import { sql } from "kysely";

/**
 * @param {import("kysely").Kysely<any>} db
 * @returns {Promise<void>}
 */
export async function up(db) {
  await sql`
    create table "user" ("id" text not null primary key, "name" text not null, "firstName" text not null, "lastName" text not null, "email" text not null unique, "emailVerified" boolean not null, "image" text, "createdAt" timestamptz default CURRENT_TIMESTAMP not null, "updatedAt" timestamptz default CURRENT_TIMESTAMP not null)
  `.execute(db);

  await sql`
    create table "session" ("id" text not null primary key, "expiresAt" timestamptz not null, "token" text not null unique, "createdAt" timestamptz default CURRENT_TIMESTAMP not null, "updatedAt" timestamptz not null, "ipAddress" text, "userAgent" text, "userId" text not null references "user" ("id") on delete cascade)
  `.execute(db);

  await sql`
    create table "account" ("id" text not null primary key, "accountId" text not null, "providerId" text not null, "userId" text not null references "user" ("id") on delete cascade, "accessToken" text, "refreshToken" text, "idToken" text, "accessTokenExpiresAt" timestamptz, "refreshTokenExpiresAt" timestamptz, "scope" text, "password" text, "createdAt" timestamptz default CURRENT_TIMESTAMP not null, "updatedAt" timestamptz not null)
  `.execute(db);

  await sql`
    create table "verification" ("id" text not null primary key, "identifier" text not null, "value" text not null, "expiresAt" timestamptz not null, "createdAt" timestamptz default CURRENT_TIMESTAMP not null, "updatedAt" timestamptz default CURRENT_TIMESTAMP not null)
  `.execute(db);

  await sql`
    create table "jwks" ("id" text not null primary key, "publicKey" text not null, "privateKey" text not null, "createdAt" timestamptz not null, "expiresAt" timestamptz)
  `.execute(db);

  await sql`
    create index "session_userId_idx" on "session" ("userId")
  `.execute(db);

  await sql`
    create index "account_userId_idx" on "account" ("userId")
  `.execute(db);

  await sql`
    create index "verification_identifier_idx" on "verification" ("identifier")
  `.execute(db);

  await sql`
    alter table "user" add column "role" text
  `.execute(db);

  await sql`
    alter table "user" add column "banned" boolean
  `.execute(db);

  await sql`
    alter table "user" add column "banReason" text
  `.execute(db);

  await sql`
    alter table "user" add column "banExpires" timestamptz
  `.execute(db);

  await sql`
    alter table "session" add column "impersonatedBy" text
  `.execute(db);

  await db.schema
    .createTable("chart_of_accounts")
    .addColumn("id", "serial", (col) => col.primaryKey())
    .addColumn("code", "varchar(10)", (col) => col.notNull().unique())
    .addColumn("name", "varchar(100)", (col) => col.notNull())
    .addColumn("type", "varchar(40)", (col) => col.notNull())
    .addColumn("created_at", "timestamptz", (col) =>
      col.defaultTo(sql`CURRENT_TIMESTAMP`).notNull()
    )
    .addColumn("updated_at", "timestamptz", (col) =>
      col.defaultTo(sql`CURRENT_TIMESTAMP`).notNull()
    )
    .addColumn("deleted_at", "timestamptz")
    .execute();

  await db.schema
    .createTable("transaction_categories")
    .addColumn("id", "serial", (col) => col.primaryKey())
    .addColumn("name", "varchar(100)", (col) => col.notNull())
    .addColumn("book_type", "varchar(100)", (col) => col.notNull())
    .addColumn("default_debit_account_id", "integer")
    .addColumn("default_credit_account_id", "integer")
    .addColumn("created_at", "timestamptz", (col) =>
      col.defaultTo(sql`CURRENT_TIMESTAMP`).notNull()
    )
    .addColumn("updated_at", "timestamptz", (col) =>
      col.defaultTo(sql`CURRENT_TIMESTAMP`).notNull()
    )
    .addColumn("deleted_at", "timestamptz")
    .addForeignKeyConstraint(
      "transaction_categories_default_debit_fk",
      ["default_debit_account_id"],
      "chart_of_accounts",
      ["id"],
      (fk) => fk.onDelete("set null")
    )
    .addForeignKeyConstraint(
      "transaction_categories_default_credit_fk",
      ["default_credit_account_id"],
      "chart_of_accounts",
      ["id"],
      (fk) => fk.onDelete("set null")
    )
    .execute();

  await db.schema
    .createTable("transactions")
    .addColumn("id", "serial", (col) => col.primaryKey())
    .addColumn("user_id", "text", (col) => col.notNull())
    .addColumn("category_id", "integer")
    .addColumn("amount", "integer", (col) => col.notNull())
    .addColumn("description", "text")
    .addColumn("transaction_date", "timestamptz")
    .addColumn("debit_account_id", "integer", (col) => col.notNull())
    .addColumn("credit_account_id", "integer", (col) => col.notNull())
    .addColumn("book_type", "varchar(100)", (col) => col.notNull())
    .addColumn("reference_number", "varchar(120)")
    .addColumn("vat_type", "varchar(100)")
    .addColumn("created_at", "timestamptz", (col) =>
      col.defaultTo(sql`CURRENT_TIMESTAMP`).notNull()
    )
    .addColumn("recorded_at", "timestamptz")
    .addColumn("transferred_to_gl_at", "timestamptz")
    .addColumn("gl_posting_month", "varchar(7)")
    .addColumn("gl_id", "integer")
    .addForeignKeyConstraint(
      "transactions_user_id_fk",
      ["user_id"],
      "user",
      ["id"],
      (fk) => fk.onDelete("cascade")
    )
    .addForeignKeyConstraint(
      "transactions_category_id_fk",
      ["category_id"],
      "transaction_categories",
      ["id"],
      (fk) => fk.onDelete("set null")
    )
    .addForeignKeyConstraint(
      "transactions_debit_account_fk",
      ["debit_account_id"],
      "chart_of_accounts",
      ["id"],
      (fk) => fk.onDelete("restrict")
    )
    .addForeignKeyConstraint(
      "transactions_credit_account_fk",
      ["credit_account_id"],
      "chart_of_accounts",
      ["id"],
      (fk) => fk.onDelete("restrict")
    )
    .addForeignKeyConstraint(
      "transactions_gl_id_fk",
      ["gl_id"],
      "transactions",
      ["id"],
      (fk) => fk.onDelete("set null")
    )
    .execute();

  await db.schema
    .createIndex("idx_transactions_gl_id")
    .on("transactions")
    .column("gl_id")
    .execute();

  await db.schema
    .createIndex("idx_transactions_gl_parent")
    .on("transactions")
    .columns(["book_type", "gl_id"])
    .execute();

  await sql`
    alter table "transactions"
    add constraint "check_debit_not_credit" check (debit_account_id <> credit_account_id)
  `.execute(db);

  await sql`
    alter table "transactions"
    add constraint "check_amount_positive" check (amount > 0)
  `.execute(db);

  await db.schema
    .createTable("invites")
    .addColumn("id", "serial", (col) => col.primaryKey())
    .addColumn("email", "varchar(120)", (col) => col.notNull())
    .addColumn("role", "text")
    .addColumn("invited_by_id", "text")
    .addColumn("status", "varchar(100)", (col) =>
      col.defaultTo("pending").notNull()
    )
    .addColumn("accepted_at", "timestamptz")
    .addColumn("created_at", "timestamptz", (col) =>
      col.defaultTo(sql`CURRENT_TIMESTAMP`).notNull()
    )
    .addColumn("updated_at", "timestamptz", (col) =>
      col.defaultTo(sql`CURRENT_TIMESTAMP`).notNull()
    )
    .addForeignKeyConstraint(
      "invites_invited_by_fk",
      ["invited_by_id"],
      "user",
      ["id"],
      (fk) => fk.onDelete("set null")
    )
    .execute();

  await db.schema
    .createTable("user_preferences")
    .addColumn("id", "serial", (col) => col.primaryKey())
    .addColumn("user_id", "text", (col) => col.notNull())
    .addColumn("navigation_layout", "varchar(40)", (col) =>
      col.defaultTo("sidebar").notNull()
    )
    .addColumn("theme", "varchar(40)", (col) =>
      col.defaultTo("light").notNull()
    )
    .addColumn("created_at", "timestamptz", (col) =>
      col.defaultTo(sql`CURRENT_TIMESTAMP`).notNull()
    )
    .addColumn("updated_at", "timestamptz", (col) =>
      col.defaultTo(sql`CURRENT_TIMESTAMP`).notNull()
    )
    .addForeignKeyConstraint(
      "user_preferences_user_id_fk",
      ["user_id"],
      "user",
      ["id"],
      (fk) => fk.onDelete("cascade")
    )
    .execute();
}

/**
 * @param {import("kysely").Kysely<any>} db
 * @returns {Promise<void>}
 */
export async function down(db) {
  await db.schema.dropTable("user_preferences").ifExists().execute();
  await db.schema.dropTable("invites").ifExists().execute();
  await db.schema.dropTable("transactions").ifExists().execute();
  await db.schema.dropTable("transaction_categories").ifExists().execute();
  await db.schema.dropTable("chart_of_accounts").ifExists().execute();
  await db.schema.dropTable("session").ifExists().execute();
  await db.schema.dropTable("account").ifExists().execute();
  await db.schema.dropTable("verification").ifExists().execute();
  await db.schema.dropTable("jwks").ifExists().execute();
  await db.schema.dropTable("user").ifExists().execute();
}
