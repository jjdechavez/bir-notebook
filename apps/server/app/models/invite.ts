import { DateTime } from 'luxon'
import { BaseModel, belongsTo, column } from '@adonisjs/lucid/orm'
import Role from './role.js'
import type { BelongsTo } from '@adonisjs/lucid/types/relations'
import User from './user.js'
import { type InviteStatus } from '@acme/shared/models/invite'

export default class Invite extends BaseModel {
  @column({ isPrimary: true })
  declare id: number

  @column()
  declare email: string

  @column()
  declare roleId: number

  @belongsTo(() => Role)
  declare role: BelongsTo<typeof Role>

  @column()
  declare invitedById: number

  @belongsTo(() => User, {
    foreignKey: 'invitedById',
  })
  declare invitedBy: BelongsTo<typeof User>

  @column()
  declare status: InviteStatus

  @column.dateTime()
  declare acceptedAt: DateTime

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime
}
