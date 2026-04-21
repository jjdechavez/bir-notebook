import type { Selectable } from "kysely"
import type {
	InviteTable,
	RoleTable,
	UserProfileTable,
	BetterAuthUserTable,
} from "../db/types.js"
import { toIsoString } from "../utils/date.js"
import { serializeRole } from "./role.js"
import { serializeUserDetail } from "./user.js"

export function serializeInvite(
	invite: Selectable<InviteTable>,
	role?: Selectable<RoleTable> | null,
	invitedBy?: {
		user: Selectable<BetterAuthUserTable>
		profile: Selectable<UserProfileTable> | null
		role: Selectable<RoleTable> | null
	} | null,
) {
	return {
		id: invite.id,
		email: invite.email,
		roleId: invite.role_id,
		role: role ? serializeRole(role) : null,
		invitedById: invite.invited_by_id,
		invitedBy: invitedBy
			? serializeUserDetail(invitedBy.user, invitedBy.profile, invitedBy.role)
			: null,
		status: invite.status,
		acceptedAt: toIsoString(invite.accepted_at),
		createdAt: toIsoString(invite.created_at),
		updatedAt: toIsoString(invite.updated_at),
	}
}
