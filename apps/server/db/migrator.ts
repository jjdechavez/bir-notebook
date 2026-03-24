import { FileMigrationProvider, Migrator } from "kysely";
import { promises as fs } from "fs";
import path from "path";
import { fileURLToPath } from "url";
import type { Kysely } from "kysely";
import type { DB } from "./types.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const migrationsDir = path.resolve(__dirname, "migrations");

export function createMigrator(db: Kysely<DB>): Migrator {
  return new Migrator({
    db,
    provider: new FileMigrationProvider({
      fs,
      path,
      migrationFolder: migrationsDir,
    }),
  });
}

export function getMigrationsDir(): string {
  return migrationsDir;
}
