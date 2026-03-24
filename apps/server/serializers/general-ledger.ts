import type { Selectable } from "kysely";
import type {
  ChartOfAccountsTable,
  TransactionCategoryTable,
  TransactionTable
} from "../db/types.js";
import {
  calculateVatAmount,
  transactionVatTypes
} from "../constants/transaction.js";
import { toIsoString } from "../utils/date.js";
import { serializeAccount } from "./account.js";
import { serializeTransactionCategory } from "./transaction-category.js";
import { serializeTransaction } from "./transaction.js";

export function serializeGeneralLedger(
  transaction: Selectable<TransactionTable>,
  category?: Selectable<TransactionCategoryTable> | null,
  debitAccount?: Selectable<ChartOfAccountsTable> | null,
  creditAccount?: Selectable<ChartOfAccountsTable> | null,
  children: Array<{
    transaction: Selectable<TransactionTable>;
    category?: Selectable<TransactionCategoryTable> | null;
    debitAccount?: Selectable<ChartOfAccountsTable> | null;
    creditAccount?: Selectable<ChartOfAccountsTable> | null;
  }> = []
) {
  return {
    id: transaction.id,
    userId: transaction.user_id,
    categoryId: transaction.category_id,
    category: category ? serializeTransactionCategory(category) : null,
    amount: transaction.amount,
    description: transaction.description ?? "",
    transactionDate: toIsoString(transaction.transaction_date),
    creditAccountId: transaction.credit_account_id,
    creditAccount: creditAccount ? serializeAccount(creditAccount) : null,
    debitAccountId: transaction.debit_account_id,
    debitAccount: debitAccount ? serializeAccount(debitAccount) : null,
    bookType: transaction.book_type,
    referenceNumber: transaction.reference_number ?? "",
    vatType: transaction.vat_type ?? null,
    createdAt: toIsoString(transaction.created_at),
    vatAmount: calculateVatAmount(
      transaction.amount,
      (transaction.vat_type ?? transactionVatTypes.vatExempt) as any
    ),
    recordedAt: toIsoString(transaction.recorded_at),
    transferredToGlAt: toIsoString(transaction.transferred_to_gl_at),
    glPostingMonth: transaction.gl_posting_month,
    children: children.map((child) =>
      serializeTransaction(
        child.transaction,
        child.category,
        child.debitAccount,
        child.creditAccount
      )
    )
  };
}
