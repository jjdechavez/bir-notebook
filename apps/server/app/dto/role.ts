import Role from '#models/role'

export class RoleDto {
  constructor(private role: Role) {}

  toJson() {
    return {
      id: this.role.id,
      name: this.role.name,
      createdAt: this.role.createdAt.toString(),
      updatedAt: this.role.updatedAt?.toString(),
    }
  }
}
