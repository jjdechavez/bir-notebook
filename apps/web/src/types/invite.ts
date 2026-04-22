import type { InviteStatus } from "@bir-notebook/shared/models/invite"
import type { UserRole } from "@bir-notebook/shared/models/user"
import type { ListResponse } from "@/lib/api"

export type Invite = {
	id: number
	role: UserRole
	email: string
	status: InviteStatus
	createdAt: string
	updatedAt: string
	acceptedAt: string | null
	invitedById: number
	invitedBy: string
}

export type InviteList = ListResponse<Invite>
