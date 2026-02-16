import { BaseDto } from '@adocasts.com/dto/base'
import UserDto from './user.js'
import TransactionCategoryDto from './transaction_category.js'
import AccountDto from './account.js'
import {
  TransactionCategoryBookType,
  TransactionVatType,
} from '@bir-notebook/shared/models/transaction'
import TransactionDto from './transaction.js'
import Transaction from '#models/transaction'

export default class GeneralLedgerDto extends BaseDto {
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
  declare transferredToGlAt: string | null
  declare glPostingMonth: string | null
  declare children: Array<TransactionDto> | null

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
    this.transferredToGlAt = transaction.transferredToGlAt?.toISO()!
    this.glPostingMonth = transaction.glPostingMonth
    this.children = transaction.children && TransactionDto.fromArray(transaction.children)
  }
}
