import type { Kysely } from "kysely";
import type { Pool } from "pg";
import type { AppConfig } from "../config.js";
import type { DB } from "../db/types.js";
import type { Logger } from "../utils/logger.js";
import type { betterAuth, Session, User } from "better-auth";

declare module "h3" {
  interface H3EventContext {
    requestId: string;
    config: AppConfig;
    db: Kysely<DB>;
    pool: Pool;
    auth: ReturnType<typeof betterAuth>;
    logger: Logger;
    currentUser?: User;
    currentSession?: Session;
  }
}
