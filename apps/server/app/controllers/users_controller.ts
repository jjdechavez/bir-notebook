import { PaginateDto } from '#dto/paginate'
import { UserDto } from '#dto/user'
import User from '#models/user'
import { UserService } from '#services/user_service'
import { userListValidator, updateUserValidator } from '#validators/user'
import { inject } from '@adonisjs/core'
import type { HttpContext } from '@adonisjs/core/http'

@inject()
export default class UsersController {
  constructor(protected userService: UserService) {}

  async index({ request }: HttpContext) {
    const { page = 1, limit = 10 } = await request.validateUsing(userListValidator)
    const qs = request.qs()
    const result = await this.userService.paginate(page, limit, qs)
    const resultJson = result.toJSON()

    return {
      data: resultJson.data.map((user) => new UserDto(user as User).toJson()),
      meta: new PaginateDto(resultJson.meta).metaToJson(),
    }
  }

  async update({ params, request, response }: HttpContext) {
    const payload = await request.validateUsing(updateUserValidator)
    const updateResult = await this.userService.update(params.id, payload)

    if (updateResult.status === 'not_found') {
      return response.notFound({ message: `User not found with ${params.id} ID` })
    }

    return new UserDto(updateResult.data).toJson()
  }
}
