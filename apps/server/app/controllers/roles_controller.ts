import { PaginateDto } from '#dto/paginate'
import { RoleDto } from '#dto/role'
import Role from '#models/role'
import { roleListValidator } from '#validators/role'
import type { HttpContext } from '@adonisjs/core/http'

export default class RolesController {
  async index({ request }: HttpContext) {
    const { page = 1, limit = 10, s = '' } = await request.validateUsing(roleListValidator)

    const roles = await Role.query()
      .if(s, (query) => {
        query.whereILike('name', `%${s}%`)
      })
      .paginate(page, limit)

    return {
      data: roles.all().map((role) => new RoleDto(role).toJson()),
      meta: new PaginateDto(roles.getMeta()).metaToJson(),
    }
  }
}
