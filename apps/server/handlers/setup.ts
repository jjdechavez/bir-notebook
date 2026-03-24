import { defineEventHandler } from "h3";

export const systemHasBeenSetup = defineEventHandler(async (event) => {
  const db = event.context.db;

  const hasUsers = await db
    .selectFrom("user")
    .select(db.fn.countAll().as("count_user"))
    .executeTakeFirstOrThrow();

  if (Number(hasUsers.count_user) > 0) {
    return { setup: "completed" };
  }

  return { setup: "pending" };
});
