import { DateTime } from 'luxon'
import { BaseModel, column } from '@adonisjs/lucid/orm'
import { type AccountType } from '@bir-notebook/shared/models/account'

export default class Account extends BaseModel {
  @column({ isPrimary: true })
  declare id: number

  @column()
  declare code: string

  @column()
  declare name: string

  @column()
  declare type: AccountType

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime

  @column.dateTime({ serializeAs: null })
  declare deletedAt: DateTime | null
}
