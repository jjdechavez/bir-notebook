import { AccountDto } from '#dto/transaction'
import Account from '#models/account'
import { TransactionService } from '#services/transaction_service'
import { inject } from '@adonisjs/core'
import type { HttpContext } from '@adonisjs/core/http'

@inject()
export default class TransactionAccountsController {
  constructor(protected transactionService: TransactionService) {}

  async all({}: HttpContext) {
    const accounts = await Account.query().whereNull('deleted_at').orderBy('type').orderBy('name')

    return {
      data: accounts.map((account) => new AccountDto(account).toJson()),
    }
  }

  async currentChartOfAccounts({ auth }: HttpContext) {
    const accounts = await this.transactionService.getUsedChartOfAccounts(auth.user!.id)
    return {
      data: accounts.map((account) => new AccountDto(account).toJson()),
    }
  }
}
