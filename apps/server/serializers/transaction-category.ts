import type { Selectable } from "kysely";
import type { ChartOfAccounts, TransactionCategories } from "../db/types.js";
import { toIsoString } from "../utils/date.js";
import { serializeAccount } from "./account.js";

export function serializeTransactionCategory(
  category: Selectable<TransactionCategories>,
  defaultDebitAccount?: Selectable<ChartOfAccounts> | null,
  defaultCreditAccount?: Selectable<ChartOfAccounts> | null
) {
  return {
    id: category.id,
    name: category.name,
    bookType: category.book_type,
    defaultDebitAccountId: category.default_debit_account_id,
    defaultDebitAccount: defaultDebitAccount
      ? serializeAccount(defaultDebitAccount)
      : null,
    defaultCreditAccountId: category.default_credit_account_id,
    defaultCreditAccount: defaultCreditAccount
      ? serializeAccount(defaultCreditAccount)
      : null,
    createdAt: toIsoString(category.created_at),
    updatedAt: toIsoString(category.updated_at)
  };
}
