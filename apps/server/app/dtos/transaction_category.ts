import { BaseModelDto } from '@adocasts.com/dto/base'
import TransactionCategory from '#models/transaction_category'
import { TransactionCategoryBookType } from '@bir-notebook/shared/models/transaction'
import AccountDto from '#dtos/account'

export default class TransactionCategoryDto extends BaseModelDto {
  declare id: number
  declare name: string
  declare bookType: TransactionCategoryBookType
  declare defaultDebitAccountId: number
  declare defaultDebitAccount: AccountDto | null
  declare defaultCreditAccountId: number
  declare defaultCreditAccount: AccountDto | null
  declare createdAt: string
  declare updatedAt: string

  constructor(transactionCategory?: TransactionCategory) {
    super()

    if (!transactionCategory) return
    this.id = transactionCategory.id
    this.name = transactionCategory.name
    this.bookType = transactionCategory.bookType
    this.defaultDebitAccountId = transactionCategory.defaultDebitAccountId
    this.defaultDebitAccount =
      transactionCategory.defaultDebitAccount &&
      new AccountDto(transactionCategory.defaultDebitAccount)
    this.defaultCreditAccountId = transactionCategory.defaultCreditAccountId
    this.defaultCreditAccount =
      transactionCategory.defaultCreditAccount &&
      new AccountDto(transactionCategory.defaultCreditAccount)
    this.createdAt = transactionCategory.createdAt.toISO()!
    this.updatedAt = transactionCategory.updatedAt.toISO()!
  }
}
