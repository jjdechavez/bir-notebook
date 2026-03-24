import { readBody, setResponseStatus } from "h3";
import { requireAuth } from "../middleware/auth.js";
import { updateUserPreferenceSchema } from "../validators/user.js";
import { serializeUserPreference } from "../serializers/user-preference.js";
import type { Selectable } from "kysely";
import type { UserPreferenceTable } from "../db/types.js";

export const getUserPreferences = requireAuth(async (event) => {
  const userId = event.context.currentUser!.id;
  let preference: Selectable<UserPreferenceTable> | undefined =
    await event.context.db
    .selectFrom("user_preferences")
    .selectAll()
    .where("user_id", "=", userId)
    .executeTakeFirst();

  if (!preference) {
    preference = await event.context.db
      .insertInto("user_preferences")
      .values({
        user_id: userId,
        navigation_layout: "sidebar",
        theme: "system",
        created_at: new Date(),
        updated_at: new Date()
      })
      .returningAll()
      .executeTakeFirst();
  }

  return serializeUserPreference(preference as any);
});

export const updateUserPreferences = requireAuth(async (event) => {
  const userId = event.context.currentUser!.id;
  const payload = updateUserPreferenceSchema.parse(await readBody(event));

  const preference: Selectable<UserPreferenceTable> | undefined =
    await event.context.db
    .selectFrom("user_preferences")
    .selectAll()
    .where("user_id", "=", userId)
    .executeTakeFirst();

  if (!preference) {
    const created = await event.context.db
      .insertInto("user_preferences")
      .values({
        user_id: userId,
        navigation_layout: payload.navigationLayout ?? "sidebar",
        theme: payload.theme ?? "system",
        created_at: new Date(),
        updated_at: new Date()
      })
      .returningAll()
      .executeTakeFirst();

    setResponseStatus(event, 201);
    return {
      message: "User preference has been created",
      data: serializeUserPreference(created as any)
    };
  }

  const updated = await event.context.db
    .updateTable("user_preferences")
    .set({
      navigation_layout:
        payload.navigationLayout ?? preference.navigation_layout,
      theme: payload.theme ?? preference.theme,
      updated_at: new Date()
    })
    .where("user_id", "=", userId)
    .returningAll()
    .executeTakeFirst();

  return {
    message: "User preference has been updated",
    data: serializeUserPreference(updated as any)
  };
});
