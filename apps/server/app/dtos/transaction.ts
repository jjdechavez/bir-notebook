import { BaseModelDto } from '@adocasts.com/dto/base'
import Transaction from '#models/transaction'
import UserDto from '#dtos/user'
import TransactionCategoryDto from '#dtos/transaction_category'
import AccountDto from '#dtos/account'
import {
  TransactionCategoryBookType,
  TransactionVatType,
} from '@bir-notebook/shared/models/transaction'

export default class TransactionDto extends BaseModelDto {
  declare id: number
  declare userId: number
  declare user: UserDto | null
  declare categoryId: number
  declare category: TransactionCategoryDto | null
  declare amount: number
  declare description: string
  declare transactionDate: string
  declare creditAccountId: number
  declare creditAccount: AccountDto | null
  declare debitAccountId: number
  declare debitAccount: AccountDto | null
  declare bookType: TransactionCategoryBookType
  declare referenceNumber: string
  declare vatType: TransactionVatType
  declare createdAt: string
  declare vatAmount: number
  declare recordedAt: string | null

  constructor(transaction?: Transaction) {
    super()

    if (!transaction) return
    this.id = transaction.id
    this.userId = transaction.userId
    this.user = transaction.user && new UserDto(transaction.user)
    this.categoryId = transaction.categoryId
    this.category = transaction.category && new TransactionCategoryDto(transaction.category)
    this.amount = transaction.amount
    this.description = transaction.description
    this.transactionDate = transaction.transactionDate.toISO()!
    this.creditAccountId = transaction.creditAccountId
    this.creditAccount = transaction.creditAccount && new AccountDto(transaction.creditAccount)
    this.debitAccountId = transaction.debitAccountId
    this.debitAccount = transaction.debitAccount && new AccountDto(transaction.debitAccount)
    this.bookType = transaction.bookType
    this.referenceNumber = transaction.referenceNumber
    this.vatType = transaction.vatType
    this.createdAt = transaction.createdAt.toISO()!
    this.vatAmount = transaction.vatAmount
    this.recordedAt = transaction.recordedAt?.toISO()!
  }
}
