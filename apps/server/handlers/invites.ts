import {
  eventHandler,
  getQuery,
  getRequestURL,
  getRouterParams,
  readBody,
  sendRedirect,
  setResponseStatus,
} from "h3";
import { requireAdmin } from "../middleware/auth.js";
import {
  completeInviteSchema,
  createInviteSchema,
  updateInviteSchema,
} from "../validators/invite.js";
import { serializeInvite } from "../serializers/invite.js";
import type { Selectable } from "kysely";
import type { Invites, Roles } from "../db/types.js";
import { getUserWithProfile, upsertUserProfile } from "../services/users.js";
import { signUrl, verifySignedUrl } from "../utils/signed-url.js";
import { buildPaginationMeta } from "../utils/pagination.js";

export const createInviteHandler = requireAdmin(async (event) => {
  const payload = createInviteSchema.parse(await readBody(event));

  const existingUser = await event.context.db
    .selectFrom("user")
    .select(["id"])
    .where("email", "=", payload.email)
    .executeTakeFirst();

  if (existingUser) {
    setResponseStatus(event, 400);
    return { message: "Email is already in use" };
  }

  const role = await event.context.db
    .selectFrom("roles")
    .selectAll()
    .where("id", "=", payload.roleId)
    .executeTakeFirst();

  if (!role) {
    setResponseStatus(event, 404);
    return { message: "Role not found" };
  }

  const invite = await event.context.db
    .insertInto("invites")
    .values({
      email: payload.email,
      role_id: payload.roleId,
      invited_by_id: event.context.currentUser!.id,
      status: "pending",
      created_at: new Date(),
      updated_at: new Date(),
    })
    .returningAll()
    .executeTakeFirst();

  setResponseStatus(event, 201);
  return serializeInvite(invite as any, role as any, null);
});

export const listInvitesHandler = requireAdmin(async (event) => {
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

  let invitesQuery = event.context.db.selectFrom("invites").selectAll();

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

  const roleIds = invites
    .map((invite) => invite.role_id)
    .filter(Boolean) as number[];
  const roles: Array<Selectable<Roles>> = roleIds.length
    ? await event.context.db
        .selectFrom("roles")
        .selectAll()
        .where("id", "in", roleIds)
        .execute()
    : [];
  const roleMap = new Map(roles.map((role) => [role.id, role]));

  const invitedByIds = invites
    .map((invite) => invite.invited_by_id)
    .filter(Boolean) as string[];
  const invitedByUsers = await Promise.all(
    invitedByIds.map((id) => getUserWithProfile(event.context.db, id)),
  );
  const invitedByMap = new Map(
    invitedByUsers.filter(Boolean).map((user) => [user!.user.id, user!]),
  );

  const url = getRequestURL(event);
  const baseUrl = `${url.origin}${url.pathname}`;

  return {
    data: invites.map((invite) =>
      serializeInvite(
        invite as any,
        invite.role_id ? ((roleMap.get(invite.role_id) as any) ?? null) : null,
        invite.invited_by_id
          ? ((invitedByMap.get(invite.invited_by_id) as any) ?? null)
          : null,
      ),
    ),
    meta: buildPaginationMeta(total, limit, page, baseUrl),
  };
});

export const generateInviteLinkHandler = requireAdmin(async (event) => {
  const params = getRouterParams(event);
  const link = signUrl(
    event.context.config.auth.baseURL,
    `/invites/${params["id"]}/confirm`,
    event.context.config.auth.secret,
    60 * 60 * 24 * 3,
  );

  return { link };
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
    setResponseStatus(event, 404);
    return { message: `Invite not found with ${params["id"]} ID` };
  }

  const role = invite.role_id
    ? await event.context.db
        .selectFrom("roles")
        .selectAll()
        .where("id", "=", invite.role_id)
        .executeTakeFirst()
    : null;

  return serializeInvite(invite as any, role as any, null);
});

export const completeInviteHandler = eventHandler(async (event) => {
  const params = getRouterParams(event);
  const payload = completeInviteSchema.parse(await readBody(event));

  const invite = await event.context.db
    .selectFrom("invites")
    .selectAll()
    .where("id", "=", Number(params["id"]))
    .executeTakeFirst();

  if (!invite) {
    setResponseStatus(event, 404);
    return {
      message: `Failed to complete invitation: Invite not found with ${params["id"]} ID`,
    };
  }

  const userName = `${payload.firstName} ${payload.lastName}`.trim();
  let signUp: { user: { id: string } };
  try {
    signUp = await event.context.auth.api.signUpEmail({
      body: {
        name: userName,
        email: invite.email,
        password: payload.password,
      },
      headers: event.headers,
    });
  } catch {
    setResponseStatus(event, 400);
    return {
      errors: [
        {
          message: "Unable to create user",
          field: "email",
        },
      ],
    };
  }

  const profilePayload: {
    userId: string;
    firstName?: string;
    lastName?: string;
    roleId?: number | null;
  } = {
    userId: signUp.user.id,
    firstName: payload.firstName,
    lastName: payload.lastName,
  };

  if (invite.role_id !== null) {
    profilePayload.roleId = invite.role_id;
  }

  await upsertUserProfile(event.context.db, profilePayload);

  await event.context.db
    .updateTable("invites")
    .set({ status: "accepted", accepted_at: new Date() })
    .where("id", "=", invite.id)
    .execute();

  setResponseStatus(event, 201);
  return "";
});

export const updateInviteHandler = requireAdmin(async (event) => {
  const params = getRouterParams(event);
  const payload = updateInviteSchema.parse(await readBody(event));

  const existing = await event.context.db
    .selectFrom("invites")
    .selectAll()
    .where("email", "=", payload.email)
    .where("id", "!=", Number(params["id"]))
    .executeTakeFirst();

  if (existing) {
    setResponseStatus(event, 400);
    return { message: "Email is already in use" };
  }

  const role = await event.context.db
    .selectFrom("roles")
    .selectAll()
    .where("id", "=", payload.roleId)
    .executeTakeFirst();

  if (!role) {
    setResponseStatus(event, 404);
    return { message: "Role not found" };
  }

  const invite = await event.context.db
    .updateTable("invites")
    .set({
      email: payload.email,
      role_id: payload.roleId,
      updated_at: new Date(),
    })
    .where("id", "=", Number(params["id"]))
    .returningAll()
    .executeTakeFirst();

  if (!invite) {
    setResponseStatus(event, 404);
    return { message: `Invite not found with ${params["id"]} ID` };
  }

  return serializeInvite(invite as any, role as any, null);
});
