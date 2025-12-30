import User from '#models/user'

export class UserDto {
  constructor(private user: User) {}

  toJson() {
    return {
      id: this.user.id,
      name: this.user.firstName + ' ' + this.user.lastName,
      firstName: this.user.firstName,
      lastName: this.user.lastName,
      email: this.user.email,
      createdAt: this.user.createdAt.toString(),
      updatedAt: this.user.updatedAt?.toString(),
      roleId: this.user.roleId,
      role: this.user.role?.name,
    }
  }
}
