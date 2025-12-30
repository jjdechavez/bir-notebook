import User from '#models/user'
import { BasePolicy } from '@adonisjs/bouncer'
import type { AuthorizerResponse } from '@adonisjs/bouncer/types'

export default class InvitePolicy extends BasePolicy {
  isAdmin(user: User): AuthorizerResponse {
    return user.role.name === 'Admin'
  }
}
