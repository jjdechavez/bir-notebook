import type { Selectable } from "kysely"
import {
	calculateVatAmount,
	type TransactionVatType,
	transactionVatTypes,
} from "../constants/transaction.js"
import type {
	ChartOfAccounts,
	TransactionCategories,
	Transactions,
} from "../db/types.js"
import { toIsoString } from "../utils/date.js"
import { serializeAccount } from "./account.js"
import { serializeTransactionCategory } from "./transaction-category.js"

export function serializeTransaction(
	transaction: Selectable<Transactions>,
	category?: Selectable<TransactionCategories> | null,
	debitAccount?: Selectable<ChartOfAccounts> | null,
	creditAccount?: Selectable<ChartOfAccounts> | null,
	generalLedger?: Selectable<Transactions> | null,
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
		vatType: transaction.vat_type ?? transactionVatTypes.vatExempt,
		createdAt: toIsoString(transaction.created_at),
		vatAmount: calculateVatAmount(
			transaction.amount,
			(transaction.vat_type as TransactionVatType) ??
				transactionVatTypes.vatExempt,
		),
		recorded: Boolean(transaction.recorded_at),
		transferredToGlAt: toIsoString(transaction.transferred_to_gl_at),
		glPostingMonth: transaction.gl_posting_month,
		glId: transaction.gl_id,
		generalLedger: generalLedger ?? null,
	}
}
