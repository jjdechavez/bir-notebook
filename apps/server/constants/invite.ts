export const inviteStatus = {
	pending: "pending",
	accepted: "accepted",
	expired: "expired",
} as const

export type InviteStatus = (typeof inviteStatus)[keyof typeof inviteStatus]

export type InviteConfirmStatus =
	| "not_found"
	| "already_confirmed"
	| "expired"
	| "confirmed"

export type InviteConfirmResult = {
	status: InviteConfirmStatus
	message: string
}

export type InviteCompleteStatus = "not_found" | "completed"

export type InviteCompleteResult = {
	status: InviteCompleteStatus
	message: string
}
