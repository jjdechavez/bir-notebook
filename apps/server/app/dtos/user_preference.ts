import { BaseModelDto } from '@adocasts.com/dto/base'
import UserPreference, { NavigationLayout, Theme } from '#models/user_preference'
import UserDto from '#dtos/user'

export default class UserPreferenceDto extends BaseModelDto {
  declare id: number
  declare userId: number
  declare user: UserDto | null
  declare navigationLayout: NavigationLayout
  declare theme: Theme
  declare createdAt: string
  declare updatedAt: string

  constructor(userPreference?: UserPreference) {
    super()

    if (!userPreference) return
    this.id = userPreference.id
    this.userId = userPreference.userId
    this.user = userPreference.user && new UserDto(userPreference.user)
    this.navigationLayout = userPreference.navigationLayout
    this.theme = userPreference.theme
    this.createdAt = userPreference.createdAt.toISO()!
    this.updatedAt = userPreference.updatedAt.toISO()!
  }
}
