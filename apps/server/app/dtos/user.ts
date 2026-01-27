import { BaseModelDto } from '@adocasts.com/dto/base'
import User from '#models/user'
import RoleDto from '#dtos/role'

export default class UserDto extends BaseModelDto {
  declare id: number
  declare firstName: string
  declare lastName: string
  declare email: string
  declare password: string
  declare createdAt: string
  declare updatedAt: string | null
  declare roleId: number
  declare role: RoleDto | null

  constructor(user?: User) {
    super()

    if (!user) return
    this.id = user.id
    this.firstName = user.firstName
    this.lastName = user.lastName
    this.email = user.email
    this.password = user.password
    this.createdAt = user.createdAt.toISO()!
    this.updatedAt = user.updatedAt?.toISO()!
    this.roleId = user.roleId
    this.role = user.role && new RoleDto(user.role)
  }
}