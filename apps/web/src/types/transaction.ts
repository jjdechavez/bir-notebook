import type { ListQueryParam, ListResponse } from '@/lib/api';
import type { tuyau } from '@/main'
import type { TransactionCategoryBookType, TransactionVatType } from '@bir-notebook/shared/models/transaction';
import type { InferRequestType, InferResponseType } from '@tuyau/react-query'

export type TransactionAccount = InferResponseType<
  (typeof tuyau.api)['transaction-accounts']['$get']
>['data'][number]

export type TransactionSearch = InferRequestType<
  (typeof tuyau.api)['transactions']['$get']
>

export type ChartOfAccount = {
  id: number;
  code: string;
  name: string;
  type: string;
  createdAt: string;
  updatedAt: string;
}

export type ChartOfAccountList = {
  data: Array<ChartOfAccount>
}

export type ChartOfAccountListQueryParam = ListQueryParam & {
  s?: string
}

export type TransactionCategory = {
  id: number;
  name: string;
  bookType: TransactionCategoryBookType;
  defaultDebitAccountId: number | null
  defaultCreditAccountId: number | null
  createdAt: string
  updatedAt: string

  defaultDebitAccount: ChartOfAccount | null
  defaultCreditAccount: ChartOfAccount | null
}

export type TransactionCategoryList = ListResponse<TransactionCategory>

export type TransactionCategoryListQueryParam = ListQueryParam & {
  s?: string
}

export type Transaction = {
  id: number;
  userId: number;
  categoryId: number;
  amount: number;
  description: string;
  transactionDate: string;
  creditAccountId: number;
  debitAccountId: number;
  bookType: TransactionCategoryBookType;
  referenceNumber: string;
  vatType: TransactionVatType;
  vatAmount: number;
  createdAt: string
  recorded: boolean;

  category: TransactionCategory | null
  creditAccount: ChartOfAccount | null
  debitAccount: ChartOfAccount | null
}

export type CreatedTransaction = {
  data: Transaction;
  message: string;
}

export type TransactionList = ListResponse<Transaction>
export type TransactionListQueryParam = ListQueryParam & {
  s?: string;
}
