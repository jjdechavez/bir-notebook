import type { Kysely, Selectable } from "kysely";
import type { User, DB } from "../db/types.js";

export type UserWithProfile = {
  user: Selectable<User>;
};

export async function getUserWithProfile(
  db: Kysely<DB>,
  userId: string,
): Promise<UserWithProfile | null> {
  const row = await db
    .selectFrom("user as u")
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

  return { user };
}

export async function listUsers(
  db: Kysely<DB>,
  params: { page: number; limit: number; search?: string },
) {
  const { page, limit, search } = params;
  const offset = (page - 1) * limit;

  let base = db.selectFrom("user as u");

  if (search) {
    const searchQuery = `%${search}%`;
    base = base.where((eb) =>
      eb.or([
        eb("u.name", "ilike", searchQuery),
        eb("u.email", "ilike", searchQuery),
        eb("u.firstName", "ilike", searchQuery),
        eb("u.lastName", "ilike", searchQuery),
      ]),
    );
  }

  const totalResult = await base
    .select((eb) => eb.fn.count<number>("u.id").as("total"))
    .executeTakeFirst();
  const total = Number(totalResult?.total ?? 0);

  let listQuery = db
    .selectFrom("user as u")
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
    ]);

  if (search) {
    const searchQuery = `%${search}%`;
    listQuery = listQuery.where((eb) =>
      eb.or([
        eb("u.name", "ilike", searchQuery),
        eb("u.email", "ilike", searchQuery),
        eb("u.firstName", "ilike", searchQuery),
        eb("u.lastName", "ilike", searchQuery),
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

    return { user };
  });

  return { total, users };
}
