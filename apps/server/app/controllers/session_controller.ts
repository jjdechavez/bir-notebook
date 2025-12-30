import { UserDto } from '#dto/user'
import User from '#models/user'
import { sessionStoreValidator } from '#validators/session'
import type { HttpContext } from '@adonisjs/core/http'

export default class SessionsController {
  async store({ request, auth }: HttpContext) {
    const { email, password } = await request.validateUsing(sessionStoreValidator)

    const user = await User.verifyCredentials(email, password)
    return await auth.use('api').createToken(user, ['*'], { expiresIn: '7 days' })
  }

  async destroy({ auth, response }: HttpContext) {
    await auth.use('api').invalidateToken()
    return response.noContent()
  }

  async me({ auth }: HttpContext) {
    await auth.check()
    const user = auth.user!
    await user.load('role')
    return new UserDto(auth.user!).toJson()
  }
}
