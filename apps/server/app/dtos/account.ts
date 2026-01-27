import { BaseModelDto } from '@adocasts.com/dto/base'
import Account from '#models/account'
import { AccountType } from '@bir-notebook/shared/models/account'

export default class AccountDto extends BaseModelDto {
  declare id: number
  declare code: string
  declare name: string
  declare type: AccountType
  declare createdAt: string
  declare updatedAt: string
  declare deletedAt: string | null

  constructor(account?: Account) {
    super()

    if (!account) return
    this.id = account.id
    this.code = account.code
    this.name = account.name
    this.type = account.type
    this.createdAt = account.createdAt.toISO()!
    this.updatedAt = account.updatedAt.toISO()!
    this.deletedAt = account.deletedAt?.toISO()!
  }
}