import { AccountDto } from '#dto/transaction'
import Account from '#models/account'
import type { HttpContext } from '@adonisjs/core/http'

export default class TransactionAccountsController {
  async all({}: HttpContext) {
    const accounts = await Account.query().whereNull('deleted_at').orderBy('type').orderBy('name')

    return {
      data: accounts.map((account) => new AccountDto(account).toJson()),
    }
  }
}
