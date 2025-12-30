import User from '#models/user'
import { inject } from '@adonisjs/core'
import { HttpContext } from '@adonisjs/core/http'

@inject()
export class UserService {
  constructor(protected ctx: HttpContext) {}

  async paginate(page = 1, limit = 10, qs: Record<string, any>) {
    const search = qs?.s ? qs.s : ''
    const users = await User.query()
      .preload('role')
      .if(search, (query) => {
        const searchQuery = `%${search}%`
        query
          .whereILike('first_name', searchQuery)
          .orWhereILike('last_name', searchQuery)
          .orWhereILike('email', searchQuery)
      })
      .paginate(page, limit)

    return users
  }

  async findById(id: number) {
    return User.find(id)
  }

  async update(userId: number, updateWith: Partial<User>) {
    const user = await this.findById(userId)

    if (user) {
      const updated = await user.merge(updateWith).save()
      return { status: 'updated', data: updated } as const
    }

    return { status: 'not_found' } as const
  }
}
