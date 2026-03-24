import { Kysely, PostgresDialect } from "kysely";
import pg from "pg";
import type { AppConfig } from "../config.js";
import type { DB } from "./types.js";

const { Pool } = pg;

let pool: pg.Pool | undefined;
let db: Kysely<DB> | undefined;

export function getPool(config: AppConfig): pg.Pool {
  if (!pool) {
    pool = new Pool({
      connectionString: config.databaseUrl,
      max: 10,
    });
  }

  return pool;
}

export function getDb(config: AppConfig): Kysely<DB> {
  if (!db) {
    db = new Kysely<DB>({
      dialect: new PostgresDialect({
        pool: getPool(config),
      }),
    });
  }

  return db;
}

export async function closeDb(): Promise<void> {
  if (db) {
    await db.destroy();
    db = undefined;
    pool = undefined;
    return;
  }

  if (pool) {
    await pool.end();
    pool = undefined;
  }
}
