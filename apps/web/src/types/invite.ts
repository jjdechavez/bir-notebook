import type { ListResponse } from "@/lib/api"
import type { tuyau } from "@/main"
import type { InferRequestType } from "@tuyau/react-query"
import type { UserRole } from "@bir-notebook/shared/models/user"
import type { InviteStatus } from "@bir-notebook/shared/models/invite"

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

export type InviteInput = InferRequestType<typeof tuyau.api.invites.$post>

export type InviteCompleteInput = InferRequestType<
	// @ts-ignore
	(typeof tuyau.api.invites)[":id"]["complete"]["$post"]
> & { password_confirmation: string }

export type InviteList = ListResponse<Invite>
