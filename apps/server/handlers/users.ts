import {
  createError,
  defineEventHandler,
  getQuery,
  getRequestURL,
  getRouterParams,
  readValidatedBody,
} from "h3";
import { requireAuth } from "../middleware/auth.js";
import { userListSchema, updateUserSchema } from "../validators/user.js";
import { listUsers, getUserWithProfile } from "../services/users.js";
import { buildPaginationMeta } from "../utils/pagination.js";
import { toValidationError } from "../utils/validation.js";

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
      throw createError({
        statusCode: 400,
        message: "User id is required",
      });
    }

    const payload = await readValidatedBody(event, updateUserSchema.safeParse);

    if (!payload.success) {
      throw toValidationError(payload.error);
    }

    const existingUser = await event.context.db
      .selectFrom("user")
      .select(["id"])
      .where("id", "=", userId)
      .executeTakeFirst();

    if (!existingUser) {
      throw createError({
        statusCode: 404,
        statusMessage: "Not Found",
        message: `User not found with ${userId} ID`,
      });
    }

    const updatePayload: {
      firstName?: string;
      lastName?: string;
      role?: string | null;
    } = {};

    if (payload.data.firstName !== undefined)
      updatePayload.firstName = payload.data.firstName;
    if (payload.data.lastName !== undefined)
      updatePayload.lastName = payload.data.lastName;
    if (payload.data.role !== undefined) updatePayload.role = payload.data.role;

    await event.context.db
      .updateTable("user")
      .set(updatePayload)
      .where("id", "=", userId)
      .execute();

    const user = await getUserWithProfile(event.context.db, userId);
    return user;
  },
});
