import { DateTime } from 'luxon'
import { BaseModel, belongsTo, column } from '@adonisjs/lucid/orm'
import User from './user.js'
import type { BelongsTo } from '@adonisjs/lucid/types/relations'

export const navigationLayouts = {
  sidebar: 'sidebar',
  navbar: 'navbar',
} as const

export type NavigationLayout = (typeof navigationLayouts)[keyof typeof navigationLayouts]

export const themes = {
  light: 'light',
  dark: 'dark',
  system: 'system',
} as const

export type Theme = (typeof themes)[keyof typeof themes]

export default class UserPreference extends BaseModel {
  @column({ isPrimary: true })
  declare id: number

  @column()
  declare userId: number

  @belongsTo(() => User)
  declare user: BelongsTo<typeof User>

  @column()
  declare navigationLayout: NavigationLayout

  @column()
  declare theme: Theme

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime
}
