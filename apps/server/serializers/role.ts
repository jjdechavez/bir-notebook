import type { Selectable } from "kysely"
import type { RoleTable } from "../db/types.js"
import { toIsoString } from "../utils/date.js"

export function serializeRole(role: Selectable<RoleTable>) {
	return {
		id: role.id,
		name: role.name,
		createdAt: toIsoString(role.created_at),
		updatedAt: toIsoString(role.updated_at),
	}
}
