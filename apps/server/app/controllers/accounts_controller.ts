import { UserDto } from '#dto/user'
import { changePasswordValidator, updateAccountValidator } from '#validators/account'
import type { HttpContext } from '@adonisjs/core/http'

export default class AccountsController {
  async update({ auth, request, response }: HttpContext) {
    const payload = await request.validateUsing(updateAccountValidator)

    const user = auth.user!

    user.merge(payload)
    await user.save()

    await user.load('role')

    return response.ok(new UserDto(user).toJson())
  }

  async changePassword({ request, auth, response }: HttpContext) {
    const payload = await request.validateUsing(changePasswordValidator)
    const authUser = auth.user!
    const validPassword = await authUser.verifyPassword(payload.currentPassword)

    if (!validPassword) {
      return response.unprocessableEntity({ message: 'Invalid credentials' })
    }

    authUser.merge({ password: payload.newPassword })
    await authUser.save()

    return response.ok(new UserDto(authUser).toJson())
  }
}
