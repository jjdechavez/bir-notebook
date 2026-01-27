import { BaseModelDto } from '@adocasts.com/dto/base'
import Invite from '#models/invite'
import RoleDto from '#dtos/role'
import UserDto from '#dtos/user'
import { InviteStatus } from '@bir-notebook/shared/models/invite'

export default class InviteDto extends BaseModelDto {
  declare id: number
  declare email: string
  declare roleId: number
  declare role: RoleDto | null
  declare invitedById: number
  declare invitedBy: UserDto | null
  declare status: InviteStatus
  declare acceptedAt: string
  declare createdAt: string
  declare updatedAt: string

  constructor(invite?: Invite) {
    super()

    if (!invite) return
    this.id = invite.id
    this.email = invite.email
    this.roleId = invite.roleId
    this.role = invite.role && new RoleDto(invite.role)
    this.invitedById = invite.invitedById
    this.invitedBy = invite.invitedBy && new UserDto(invite.invitedBy)
    this.status = invite.status
    this.acceptedAt = invite.acceptedAt.toISO()!
    this.createdAt = invite.createdAt.toISO()!
    this.updatedAt = invite.updatedAt.toISO()!
  }
}