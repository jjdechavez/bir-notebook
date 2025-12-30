import Invite from '#models/invite'

export class InviteDto {
  constructor(private invite: Invite) {}

  toJson() {
    return {
      id: this.invite.id,
      email: this.invite.email,
      status: this.invite.status,
      createdAt: this.invite.createdAt.toString(),
      updatedAt: this.invite.updatedAt?.toString(),
      roleId: this.invite.roleId,
      role: this.invite.role?.name || null,
      invitedById: this.invite.invitedById,
      invitedBy: this.invite?.invitedBy?.email || null,
    }
  }
}
