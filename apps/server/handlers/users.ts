import {
  createError,
  defineEventHandler,
  getQuery,
  getRequestURL,
  getRouterParams,
  readBody,
  setResponseStatus,
} from "h3";
import { requireAuth } from "../middleware/auth.js";
import { userListSchema, updateUserSchema } from "../validators/user.js";
import { listUsers, getUserWithProfile } from "../services/users.js";
import { buildPaginationMeta } from "../utils/pagination.js";

export const listUsersHandler = defineEventHandler({
  onRequest: [requireAuth()],
  handler: async (event) => {
    const payload = userListSchema.parse(getQuery(event));
    const qs = getQuery(event);
    const page = payload.page ?? 1;
    const limit = payload.limit ?? 10;
    const search = typeof qs["s"] === "string" ? qs["s"] : undefined;

    const result = await listUsers(event.context.db, {
      page,
      limit,
      ...(search ? { search } : {}),
    });

    const url = getRequestURL(event);
    const baseUrl = `${url.origin}${url.pathname}`;

    return {
      data: result.users,
      meta: buildPaginationMeta(result.total, limit, page, baseUrl),
    };
  },
});

export const updateUserHandler = defineEventHandler({
  onRequest: [requireAuth()],
  handler: async (event) => {
    const params = getRouterParams(event);
    const userId = params["id"];
    if (!userId) {
      setResponseStatus(event, 400);
      return { message: "User id is required" };
    }
    const payload = updateUserSchema.parse(await readBody(event));

    const existingUser = await event.context.db
      .selectFrom("user")
      .select(["id"])
      .where("id", "=", userId)
      .executeTakeFirst();

    if (!existingUser) {
      setResponseStatus(event, 404);
      throw createError({
        statusCode: 404,
        statusMessage: "Not Found",
        message: `User not found with ${userId} ID`,
      });
    }

    const updatePayload: {
      userId: string;
      firstName?: string;
      lastName?: string;
      role?: string | null;
    } = { userId };

    if (payload.firstName !== undefined)
      updatePayload.firstName = payload.firstName;
    if (payload.lastName !== undefined)
      updatePayload.lastName = payload.lastName;
    if (payload.role !== undefined) updatePayload.role = payload.role;

    const user = await getUserWithProfile(event.context.db, userId);
    return user;
  },
});
