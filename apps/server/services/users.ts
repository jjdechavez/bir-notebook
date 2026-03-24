import type { Kysely, Selectable } from "kysely";
import type { User, DB, Roles, UserProfiles } from "../db/types.js";

export type UserWithProfile = {
  user: Selectable<User>;
  profile: Selectable<UserProfiles> | null;
  role: Selectable<Roles> | null;
};

export async function getUserWithProfile(
  db: Kysely<DB>,
  userId: string,
): Promise<UserWithProfile | null> {
  const row = await db
    .selectFrom("user as u")
    .leftJoin("user_profiles as p", "p.user_id", "u.id")
    .leftJoin("roles as r", "r.id", "p.role_id")
    .select([
      "u.id as u_id",
      "u.name as u_name",
      "u.firstName as u_firstName",
      "u.lastName as u_lastName",
      "u.email as u_email",
      "u.emailVerified as u_email_verified",
      "u.image as u_image",
      "u.createdAt as u_created_at",
      "u.updatedAt as u_updated_at",
      "u.role as u_role",
      "u.banned as u_banned",
      "u.banReason as u_ban_reason",
      "u.banExpires as u_ban_expires",
      "p.user_id as p_user_id",
      "p.first_name as p_first_name",
      "p.last_name as p_last_name",
      "p.role_id as p_role_id",
      "p.created_at as p_created_at",
      "p.updated_at as p_updated_at",
      "r.id as r_id",
      "r.name as r_name",
      "r.created_at as r_created_at",
      "r.updated_at as r_updated_at",
    ])
    .where("u.id", "=", userId)
    .executeTakeFirst();

  if (!row) return null;

  const user: Selectable<User> = {
    id: row["u_id"],
    name: row["u_name"],
    firstName: row["u_firstName"],
    lastName: row["u_lastName"],
    email: row["u_email"],
    emailVerified: row["u_email_verified"],
    image: row["u_image"],
    createdAt: row["u_created_at"],
    updatedAt: row["u_updated_at"],
    role: row["u_role"],
    banned: row["u_banned"],
    banReason: row["u_ban_reason"],
    banExpires: row["u_ban_expires"],
  };

  const profile: Selectable<UserProfiles> | null = row["p_user_id"]
    ? {
        user_id: row["p_user_id"],
        first_name: row["p_first_name"] ?? "",
        last_name: row["p_last_name"] ?? "",
        role_id: row["p_role_id"],
        created_at: row["p_created_at"] ?? new Date(),
        updated_at: row["p_updated_at"] ?? new Date(),
      }
    : null;

  const role: Selectable<Roles> | null = row["r_id"]
    ? {
        id: row["r_id"],
        name: row["r_name"] ?? "",
        created_at: row["r_created_at"] ?? new Date(),
        updated_at: row["r_updated_at"] ?? new Date(),
      }
    : null;

  return { user, profile, role };
}

export async function listUsers(
  db: Kysely<DB>,
  params: { page: number; limit: number; search?: string },
) {
  const { page, limit, search } = params;
  const offset = (page - 1) * limit;

  let base = db
    .selectFrom("user as u")
    .leftJoin("user_profiles as p", "p.user_id", "u.id");

  if (search) {
    const searchQuery = `%${search}%`;
    base = base.where((eb) =>
      eb.or([
        eb("u.name", "ilike", searchQuery),
        eb("u.email", "ilike", searchQuery),
        eb("p.first_name", "ilike", searchQuery),
        eb("p.last_name", "ilike", searchQuery),
      ]),
    );
  }

  const totalResult = await base
    .select((eb) => eb.fn.count<number>("u.id").as("total"))
    .executeTakeFirst();
  const total = Number(totalResult?.total ?? 0);

  let listQuery = db
    .selectFrom("user as u")
    .leftJoin("user_profiles as p", "p.user_id", "u.id")
    .leftJoin("roles as r", "r.id", "p.role_id")
    .select([
      "u.id as u_id",
      "u.name as u_name",
      "u.firstName as u_firstName",
      "u.lastName as u_lastName",
      "u.email as u_email",
      "u.emailVerified as u_email_verified",
      "u.image as u_image",
      "u.createdAt as u_created_at",
      "u.updatedAt as u_updated_at",
      "u.role as u_role",
      "u.banned as u_banned",
      "u.banReason as u_ban_reason",
      "u.banExpires as u_ban_expires",
      "p.user_id as p_user_id",
      "p.first_name as p_first_name",
      "p.last_name as p_last_name",
      "p.role_id as p_role_id",
      "p.created_at as p_created_at",
      "p.updated_at as p_updated_at",
      "r.id as r_id",
      "r.name as r_name",
      "r.created_at as r_created_at",
      "r.updated_at as r_updated_at",
    ]);

  if (search) {
    const searchQuery = `%${search}%`;
    listQuery = listQuery.where((eb) =>
      eb.or([
        eb("u.name", "ilike", searchQuery),
        eb("u.email", "ilike", searchQuery),
        eb("p.first_name", "ilike", searchQuery),
        eb("p.last_name", "ilike", searchQuery),
      ]),
    );
  }

  const rows: Array<Record<string, any>> = await listQuery
    .orderBy("u.createdAt", "desc")
    .limit(limit)
    .offset(offset)
    .execute();

  const users = rows.map((row) => {
    const user: Selectable<User> = {
      id: row["u_id"],
      name: row["u_name"],
      firstName: row["u_firstName"],
      lastName: row["u_lastName"],
      email: row["u_email"],
      emailVerified: row["u_email_verified"],
      image: row["u_image"],
      createdAt: row["u_created_at"],
      updatedAt: row["u_updated_at"],
      role: row["u_role"],
      banned: row["u_banned"],
      banReason: row["u_ban_reason"],
      banExpires: row["u_ban_expires"],
    };

    const profile: Selectable<UserProfiles> | null = row["p_user_id"]
      ? {
          user_id: row["p_user_id"],
          first_name: row["p_first_name"] ?? "",
          last_name: row["p_last_name"] ?? "",
          role_id: row["p_role_id"],
          created_at: row["p_created_at"] ?? new Date(),
          updated_at: row["p_updated_at"] ?? new Date(),
        }
      : null;

    const role: Selectable<Roles> | null = row["r_id"]
      ? {
          id: row["r_id"],
          name: row["r_name"] ?? "",
          created_at: row["r_created_at"] ?? new Date(),
          updated_at: row["r_updated_at"] ?? new Date(),
        }
      : null;

    return { user, profile, role };
  });

  return { total, users };
}

export async function upsertUserProfile(
  db: Kysely<DB>,
  params: {
    userId: string;
    firstName?: string;
    lastName?: string;
    roleId?: number | null;
  },
) {
  const existing = await db
    .selectFrom("user_profiles")
    .selectAll()
    .where("user_id", "=", params.userId)
    .executeTakeFirst();

  if (!existing) {
    const inserted = await db
      .insertInto("user_profiles")
      .values({
        user_id: params.userId,
        first_name: params.firstName ?? "",
        last_name: params.lastName ?? "",
        role_id: params.roleId ?? null,
        created_at: new Date(),
        updated_at: new Date(),
      })
      .returningAll()
      .executeTakeFirst();
    return inserted!;
  }

  const updated = await db
    .updateTable("user_profiles")
    .set({
      first_name: params.firstName ?? existing.first_name,
      last_name: params.lastName ?? existing.last_name,
      role_id: params.roleId === undefined ? existing.role_id : params.roleId,
      updated_at: new Date(),
    })
    .where("user_id", "=", params.userId)
    .returningAll()
    .executeTakeFirst();

  return updated!;
}
