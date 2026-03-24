import { eventHandler, setResponseStatus } from "h3";

export function requireAuth(
  handler: Parameters<typeof eventHandler>[0]
) {
  return eventHandler(async (event) => {
    const session = await event.context.auth.api.getSession({
      headers: event.headers
    });

    if (!session) {
      setResponseStatus(event, 401);
      return {
        code: "UNAUTHORIZED",
        message: "Session not found",
        requestId: event.context.requestId
      };
    }

    event.context.currentUser = session.user;
    event.context.currentSession = session.session;

    return handler(event);
  });
}

export function requireAdmin(
  handler: Parameters<typeof eventHandler>[0]
) {
  return requireAuth(async (event) => {
    const profile = await event.context.db
      .selectFrom("user_profiles as profile")
      .leftJoin("roles as role", "role.id", "profile.role_id")
      .select(["role.name as role_name"])
      .where("profile.user_id", "=", event.context.currentUser!.id)
      .executeTakeFirst();

    if (!profile?.role_name || profile.role_name !== "Admin") {
      setResponseStatus(event, 403);
      return {
        code: "FORBIDDEN",
        message: "Insufficient permissions",
        requestId: event.context.requestId
      };
    }

    return handler(event);
  });
}
