import UserPreference, { NavigationLayout, Theme } from '#models/user_preference'
import type { HttpContext } from '@adonisjs/core/http'
import UserPreferenceDto from '../dtos/user_preference.js'
import { updateUserPreferenceValidator } from '#validators/user'

export default class UserPreferencesController {
  async show({ auth, response }: HttpContext) {
    const preference = await UserPreference.findBy({ userId: auth.user!.id })

    if (!preference) {
      return response.notFound({ message: 'User preference not found' })
    }

    return new UserPreferenceDto(preference)
  }

  async update({ request, auth, response }: HttpContext) {
    const payload = await request.validateUsing(updateUserPreferenceValidator)

    const preference = await UserPreference.findBy({ userId: auth.user!.id })

    if (!preference) {
      const createdPreference = new UserPreference()
      await createdPreference
        .merge({
          userId: auth.user!.id,
          navigationLayout:
            (payload?.navigationLayout as NavigationLayout | undefined) || undefined,
          theme: (payload?.theme as Theme | undefined) || undefined,
        })
        .save()

      return response.created({
        message: 'User preference has been created',
        data: new UserPreferenceDto(createdPreference),
      })
    }

    await preference
      .merge({
        userId: auth.user!.id,
        navigationLayout: (payload?.navigationLayout as NavigationLayout | undefined) || undefined,
        theme: (payload?.theme as Theme | undefined) || undefined,
      })
      .save()

    return response.ok({
      message: 'User preference has been updated',
      data: new UserPreferenceDto(preference),
    })
  }
}
