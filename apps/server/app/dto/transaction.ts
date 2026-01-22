import Account from '#models/account'
import Transaction from '#models/transaction'
import TransactionCategory from '#models/transaction_category'

export class TransactionDto {
  constructor(private transaction: Transaction) {}

  toJson() {
    return {
      id: this.transaction.id,
      amount: this.transaction.amount,
      description: this.transaction.description,
      transactionDate: this.transaction.transactionDate.toString(),
      bookType: this.transaction.bookType,
      referenceNumber: this.transaction.referenceNumber,
      vatType: this.transaction.vatType,
      vatAmount: this.transaction.vatAmount,
      createdAt: this.transaction.createdAt.toString(),
      categoryId: this.transaction.categoryId,
      category: this.transaction.category
        ? {
            id: this.transaction.category.id,
            name: this.transaction.category.name,
            bookType: this.transaction.category.bookType,
          }
        : null,
      debitAccountId: this.transaction.debitAccountId,
      debitAccount: this.transaction.debitAccount
        ? {
            id: this.transaction.debitAccount.id,
            code: this.transaction.debitAccount.code,
            name: this.transaction.debitAccount.name,
            type: this.transaction.debitAccount.type,
          }
        : null,
      creditAccountId: this.transaction.creditAccountId,
      creditAccount: this.transaction.creditAccount
        ? {
            id: this.transaction.creditAccount.id,
            code: this.transaction.creditAccount.code,
            name: this.transaction.creditAccount.name,
            type: this.transaction.creditAccount.type,
          }
        : null,
      recorded: !!this.transaction?.recordedAt,
    }
  }
}

export class TransactionCategoryDto {
  constructor(private category: TransactionCategory) {}

  toJson() {
    return {
      id: this.category.id,
      name: this.category.name,
      bookType: this.category.bookType,
      defaultDebitAccountId: this.category.defaultDebitAccountId,
      defaultCreditAccountId: this.category.defaultCreditAccountId,
    }
  }
}

export class AccountDto {
  constructor(private account: Account) {}

  toJson() {
    return {
      id: this.account.id,
      code: this.account.code,
      name: this.account.name,
      type: this.account.type,
    }
  }
}
