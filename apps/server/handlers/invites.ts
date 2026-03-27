import {
  createError,
  defineEventHandler,
  eventHandler,
  getQuery,
  getRequestURL,
  getRouterParams,
  readValidatedBody,
  sendRedirect,
  setResponseStatus,
} from "h3";
import { requireAdmin } from "../middleware/auth.js";
import {
  completeInviteSchema,
  createInviteSchema,
  updateInviteSchema,
} from "../validators/invite.js";
import { type Selectable, sql } from "kysely";
import type { Invites } from "../db/types.js";
import { signUrl, verifySignedUrl } from "../utils/signed-url.js";
import { buildPaginationMeta } from "../utils/pagination.js";
import { toValidationError } from "../utils/validation.js";

export const createInviteHandler = defineEventHandler({
  onRequest: [requireAdmin()],
  handler: async (event) => {
    const payload = await readValidatedBody(
      event,
      createInviteSchema.safeParse,
    );

    if (!payload.success) {
      return toValidationError(payload.error);
    }

    const existingUser = await event.context.db
      .selectFrom("user")
      .select(["id"])
      .where("email", "=", payload.data.email)
      .executeTakeFirst();

    if (existingUser) {
      setResponseStatus(event, 400);
      throw createError({
        statusCode: 400,
        message: "Email is already in use",
      });
    }

    const roles = ["user", "admin"];
    const validRole = roles.includes(payload.data.role);

    if (!validRole) {
      throw createError({
        statusCode: 422,
        statusMessage: "Invalid Request",
        message: "Invalid role",
      });
    }

    const invite = await event.context.db
      .insertInto("invites")
      .values({
        email: payload.data.email,
        role: payload.data.role,
        invited_by_id: event.context.currentUser!.id,
        status: "pending",
        created_at: new Date(),
        updated_at: new Date(),
      })
      .returningAll()
      .executeTakeFirst();

    setResponseStatus(event, 201);
    return invite;
  },
});

export const listInvitesHandler = defineEventHandler({
  onRequest: [requireAdmin()],
  handler: async (event) => {
    const query = getQuery(event);
    const page = Number(query["page"] ?? 1);
    const limit = Number(query["limit"] ?? 10);
    const offset = (page - 1) * limit;
    const search = typeof query["s"] === "string" ? query["s"] : "";
    const status =
      typeof query["status"] === "string"
        ? query["status"].split(",")
        : undefined;

    let base = event.context.db.selectFrom("invites");
    if (search) {
      base = base.where("email", "ilike", `%${search}%`);
    }
    if (status?.length) {
      base = base.where("status", "in", status);
    }

    const totalResult = await base
      .select((eb) => eb.fn.count<number>("id").as("total"))
      .executeTakeFirst();
    const total = Number(totalResult?.total ?? 0);

    let invitesQuery = event.context.db
      .selectFrom("invites")
      .innerJoin("user", "user.id", "invites.invited_by_id")
      .select(({ ref }) => [
        "invites.id",
        "invites.email",
        "invites.role",
        "invites.status",
        "invites.accepted_at",
        "invites.created_at",
        "invites.updated_at",
        "invites.invited_by_id",
        sql<string>`concat(${ref("user.firstName")}, ' ', ${ref("user.lastName")})`.as(
          "invited_by",
        ),
      ]);

    if (search.length > 0) {
      invitesQuery = invitesQuery.where("email", "ilike", `%${search}%`);
    }

    if (status?.length) {
      invitesQuery = invitesQuery.where("status", "in", status);
    }

    const invites: Array<Selectable<Invites>> = await invitesQuery
      .limit(limit)
      .offset(offset)
      .execute();

    const url = getRequestURL(event);
    const baseUrl = `${url.origin}${url.pathname}`;

    return {
      data: invites,
      meta: buildPaginationMeta(total, limit, page, baseUrl),
    };
  },
});

export const generateInviteLinkHandler = defineEventHandler({
  onRequest: [requireAdmin()],
  handler: async (event) => {
    const params = getRouterParams(event);
    const link = signUrl(
      event.context.config.auth.baseURL,
      `/invites/${params["id"]}/confirm`,
      event.context.config.auth.secret,
      60 * 60 * 24 * 3,
    );

    return { link };
  },
});

export const confirmInviteHandler = eventHandler(async (event) => {
  const params = getRouterParams(event);
  const query = getQuery(event);
  const validSignature = verifySignedUrl(
    `/invites/${params["id"]}/confirm`,
    event.context.config.auth.secret,
    typeof query["expires"] === "string" ? query["expires"] : null,
    typeof query["signature"] === "string" ? query["signature"] : null,
  );

  const invite = await event.context.db
    .selectFrom("invites")
    .selectAll()
    .where("id", "=", Number(params["id"]))
    .executeTakeFirst();

  if (!invite) {
    setResponseStatus(event, 404);
    return {
      status: "not_found",
      message: `Invite not found with ${params["id"]} ID`,
    };
  }

  if (invite.status === "accepted") {
    setResponseStatus(event, 400);
    return {
      status: "already_confirmed",
      message: `Invite has already been confirmed with ${params["id"]} ID`,
    };
  }

  if (!validSignature) {
    await event.context.db
      .updateTable("invites")
      .set({ status: "expired", updated_at: new Date() })
      .where("id", "=", invite.id)
      .execute();

    setResponseStatus(event, 400);
    return {
      status: "expired",
      message: `Invite has already expired with ${params["id"]} ID`,
    };
  }

  const feLink = signUrl(
    event.context.config.feUrl,
    `/invites/${params["id"]}/confirm`,
    event.context.config.auth.secret,
    60 * 60 * 24 * 3,
  );

  return sendRedirect(event, feLink, 302);
});

export const showInviteHandler = eventHandler(async (event) => {
  const params = getRouterParams(event);
  const invite = await event.context.db
    .selectFrom("invites")
    .selectAll()
    .where("id", "=", Number(params["id"]))
    .executeTakeFirst();

  if (!invite) {
    throw createError({
      statusCode: 400,
      statusMessage: "Not Found",
      message: `Invite not found with ${params["id"]} ID`,
    });
  }

  return invite;
});

export const completeInviteHandler = eventHandler(async (event) => {
  const params = getRouterParams(event);
  const payload = await readValidatedBody(
    event,
    completeInviteSchema.safeParse,
  );

  if (!payload.success) {
    throw toValidationError(payload.error);
  }

  const invite = await event.context.db
    .selectFrom("invites")
    .selectAll()
    .where("id", "=", Number(params["id"]))
    .executeTakeFirst();

  if (!invite) {
    throw createError({
      statusCode: 404,
      statusMessage: "Not Found",
      message: `Failed to complete invitation: Invite not found with ${params["id"]} ID`,
    });
  }

  const userName = `${payload.data.firstName} ${payload.data.lastName}`.trim();
  try {
    await event.context.auth.api.createUser({
      body: {
        name: userName,
        email: invite.email,
        password: payload.data.password,
        role: invite.role as "user" | "admin",
        data: {
          firstName: payload.data.firstName,
          lastName: payload.data.lastName,
        },
      },
      headers: event.headers,
    });
  } catch (e) {
    throw createError({
      statusCode: 400,
      message: "Unable to create user",
      data: {
        errors: [
          {
            message: "Unable to create user",
            field: "email",
          },
        ],
      },
    });
  }

  await event.context.db
    .updateTable("invites")
    .set({ status: "accepted", accepted_at: new Date() })
    .where("id", "=", invite.id)
    .execute();

  setResponseStatus(event, 201);
  return "";
});

export const updateInviteHandler = defineEventHandler({
  onRequest: [requireAdmin()],
  handler: async (event) => {
    const params = getRouterParams(event);
    const payload = await readValidatedBody(
      event,
      updateInviteSchema.safeParse,
    );

    if (!payload.success) {
      throw toValidationError(payload.error);
    }

    const existing = await event.context.db
      .selectFrom("invites")
      .selectAll()
      .where("email", "=", payload.data.email)
      .where("id", "!=", Number(params["id"]))
      .executeTakeFirst();

    if (existing) {
      throw createError({
        statusCode: 400,
        statusMessage: "Bad Request",
        message: "Email is already used",
      });
    }

    const invite = await event.context.db
      .updateTable("invites")
      .set({
        email: payload.data.email,
        role: payload.data.role,
        updated_at: new Date(),
      })
      .where("id", "=", Number(params["id"]))
      .returningAll()
      .executeTakeFirst();

    if (!invite) {
      throw createError({
        statusCode: 404,
        statusMessage: "Not Found",
        message: `Invite not found with ${params["id"]} ID`,
      });
    }

    return invite;
  },
});
