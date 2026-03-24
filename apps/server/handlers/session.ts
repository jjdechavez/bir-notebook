import { eventHandler, readBody, setResponseStatus } from "h3";
import { sessionStoreSchema } from "../validators/session.js";
import { requireAuth } from "../middleware/auth.js";
import { getUserWithProfile } from "../services/users.js";
import { serializeUserSummary } from "../serializers/user.js";

export const createSession = eventHandler(async (event) => {
  const payload = sessionStoreSchema.parse(await readBody(event));

  let response: { token: string };
  try {
    response = await event.context.auth.api.signInEmail({
      body: {
        email: payload.email,
        password: payload.password
      },
      headers: event.headers
    });
  } catch {
    setResponseStatus(event, 422);
    return {
      errors: [
        {
          message: "Invalid credentials",
          field: "email"
        }
      ]
    };
  }

  return {
    type: "bearer",
    name: null,
    token: response.token,
    abilities: ["*"],
    lastUsedAt: null,
    expiresAt: null
  };
});

export const destroySession = requireAuth(async (event) => {
  await event.context.auth.api.signOut({
    headers: event.headers
  });

  setResponseStatus(event, 204);
  return "";
});

export const getSession = requireAuth(async (event) => {
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
