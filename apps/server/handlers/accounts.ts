import { readBody, setResponseStatus } from "h3";
import { requireAuth } from "../middleware/auth.js";
import { changePasswordSchema, updateAccountSchema } from "../validators/account.js";
import { getUserWithProfile, upsertUserProfile } from "../services/users.js";
import { serializeUserSummary } from "../serializers/user.js";

export const updateAccount = requireAuth(async (event) => {
  const payload = updateAccountSchema.parse(await readBody(event));
  const userId = event.context.currentUser!.id;

  const updatePayload: {
    userId: string;
    firstName?: string;
    lastName?: string;
  } = { userId };

  if (payload.firstName !== undefined) updatePayload.firstName = payload.firstName;
  if (payload.lastName !== undefined) updatePayload.lastName = payload.lastName;

  const profile = await upsertUserProfile(event.context.db, updatePayload);

  const fullName = [profile.first_name, profile.last_name]
    .filter(Boolean)
    .join(" ")
    .trim();

  await event.context.db
    .updateTable("user")
    .set({ name: fullName || event.context.currentUser!.name })
    .where("id", "=", userId)
    .execute();

  const user = await getUserWithProfile(event.context.db, userId);
  if (!user) {
    setResponseStatus(event, 404);
    return { message: "User not found" };
  }

  return serializeUserSummary(user.user, user.profile, user.role);
});

export const changePassword = requireAuth(async (event) => {
  const payload = changePasswordSchema.parse(await readBody(event));

  try {
    await event.context.auth.api.changePassword({
      headers: event.headers,
      body: {
        currentPassword: payload.currentPassword,
        newPassword: payload.newPassword
      }
    });
  } catch {
    setResponseStatus(event, 422);
    return {
      errors: [
        {
          message: "Invalid credentials",
          field: "currentPassword"
        }
      ]
    };
  }

  const user = await getUserWithProfile(
    event.context.db,
    event.context.currentUser!.id
  );

  if (!user) {
    setResponseStatus(event, 404);
    return { message: "User not found" };
  }

  return serializeUserSummary(user.user, user.profile, user.role);
});
