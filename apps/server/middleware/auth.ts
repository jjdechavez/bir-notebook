import { createError, defineEventHandler } from "h3";

export const requireAuth = () =>
  defineEventHandler(async (event) => {
    const session = await event.context.auth.api.getSession({
      headers: event.headers,
    });

    if (!session) {
      throw createError({
        statusCode: 401,
        message: "Session not found",
        data: {
          requestId: event.context.requestId,
        },
      });
    }

    event.context.currentUser = session.user;
    event.context.currentSession = session.session;
  });

export const requireAdmin = () =>
  defineEventHandler({
    onRequest: [requireAuth()],
    handler: async (event) => {
      const user = event.context!.currentUser;

      if (user!.role !== "admin") {
        throw createError({
          statusCode: 403,
          statusMessage: "Forbidden",
          message: "Insufficient permissions",
          data: {
            requestId: event.context.requestId,
          },
        });
      }
    },
  });
