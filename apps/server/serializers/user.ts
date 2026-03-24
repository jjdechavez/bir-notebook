import type { Selectable } from "kysely";
import type {
  BetterAuthUserTable,
  RoleTable,
  UserProfileTable
} from "../db/types.js";
import { toIsoString } from "../utils/date.js";
import { serializeRole } from "./role.js";

export function serializeUserSummary(
  user: Selectable<BetterAuthUserTable>,
  profile?: Selectable<UserProfileTable> | null,
  role?: Selectable<RoleTable> | null
) {
  const firstName = profile?.first_name ?? "";
  const lastName = profile?.last_name ?? "";
  const fallbackName = user.name ?? "";

  const fullName = [firstName, lastName].filter(Boolean).join(" ").trim();

  return {
    id: user.id,
    name: fullName || fallbackName,
    firstName,
    lastName,
    email: user.email,
    createdAt: toIsoString(user.createdAt),
    updatedAt: toIsoString(user.updatedAt),
    roleId: profile?.role_id ?? null,
    role: role?.name ?? null
  };
}

export function serializeUserDetail(
  user: Selectable<BetterAuthUserTable>,
  profile?: Selectable<UserProfileTable> | null,
  role?: Selectable<RoleTable> | null
) {
  const [firstName, lastName] = [
    profile?.first_name ?? "",
    profile?.last_name ?? ""
  ];

  return {
    id: user.id,
    firstName,
    lastName,
    email: user.email,
    createdAt: toIsoString(user.createdAt),
    updatedAt: toIsoString(user.updatedAt),
    roleId: profile?.role_id ?? null,
    role: role ? serializeRole(role) : null
  };
}
