import type { Kysely, Selectable } from "kysely"
import { transactionVatTypes } from "../constants/transaction.js"
import type {
	ChartOfAccounts,
	DB,
	TransactionCategories,
	Transactions,
} from "../db/types.js"
import { toCents } from "../utils/currency.js"

type TransactionWithRelations = Selectable<Transactions> & {
	category: Selectable<TransactionCategories> | null
	debitAccount: Selectable<ChartOfAccounts> | null
	creditAccount: Selectable<ChartOfAccounts> | null
}

function mapTransactionRow(row: Record<string, any>): TransactionWithRelations {
	const transaction: Selectable<Transactions> = {
		id: row["t_id"],
		user_id: row["t_user_id"],
		category_id: row["t_category_id"],
		amount: row["t_amount"],
		description: row["t_description"],
		transaction_date: row["t_transaction_date"],
		debit_account_id: row["t_debit_account_id"],
		credit_account_id: row["t_credit_account_id"],
		book_type: row["t_book_type"],
		reference_number: row["t_reference_number"],
		vat_type: row["t_vat_type"],
		created_at: row["t_created_at"],
		recorded_at: row["t_recorded_at"],
		transferred_to_gl_at: row["t_transferred_to_gl_at"],
		gl_posting_month: row["t_gl_posting_month"],
		gl_id: row["t_gl_id"],
	}

	const category: Selectable<TransactionCategories> | null = row["c_id"]
		? {
				id: row["c_id"],
				name: row["c_name"],
				book_type: row["c_book_type"],
				default_debit_account_id: row["c_default_debit_account_id"],
				default_credit_account_id: row["c_default_credit_account_id"],
				created_at: row["c_created_at"],
				updated_at: row["c_updated_at"],
				deleted_at: row["c_deleted_at"],
			}
		: null

	const debitAccount: Selectable<ChartOfAccounts> | null = row["da_id"]
		? {
				id: row["da_id"],
				code: row["da_code"],
				name: row["da_name"],
				type: row["da_type"],
				created_at: row["da_created_at"],
				updated_at: row["da_updated_at"],
				deleted_at: row["da_deleted_at"],
			}
		: null

	const creditAccount: Selectable<ChartOfAccounts> | null = row["ca_id"]
		? {
				id: row["ca_id"],
				code: row["ca_code"],
				name: row["ca_name"],
				type: row["ca_type"],
				created_at: row["ca_created_at"],
				updated_at: row["ca_updated_at"],
				deleted_at: row["ca_deleted_at"],
			}
		: null

	return { ...transaction, category, debitAccount, creditAccount }
}

function withTransactionJoins(db: Kysely<DB>) {
	return db
		.selectFrom("transactions as t")
		.leftJoin("transaction_categories as c", "c.id", "t.category_id")
		.leftJoin("chart_of_accounts as da", "da.id", "t.debit_account_id")
		.leftJoin("chart_of_accounts as ca", "ca.id", "t.credit_account_id")
		.select([
			"t.id as t_id",
			"t.user_id as t_user_id",
			"t.category_id as t_category_id",
			"t.amount as t_amount",
			"t.description as t_description",
			"t.transaction_date as t_transaction_date",
			"t.debit_account_id as t_debit_account_id",
			"t.credit_account_id as t_credit_account_id",
			"t.book_type as t_book_type",
			"t.reference_number as t_reference_number",
			"t.vat_type as t_vat_type",
			"t.created_at as t_created_at",
			"t.recorded_at as t_recorded_at",
			"t.transferred_to_gl_at as t_transferred_to_gl_at",
			"t.gl_posting_month as t_gl_posting_month",
			"t.gl_id as t_gl_id",
			"c.id as c_id",
			"c.name as c_name",
			"c.book_type as c_book_type",
			"c.default_debit_account_id as c_default_debit_account_id",
			"c.default_credit_account_id as c_default_credit_account_id",
			"c.created_at as c_created_at",
			"c.updated_at as c_updated_at",
			"c.deleted_at as c_deleted_at",
			"da.id as da_id",
			"da.code as da_code",
			"da.name as da_name",
			"da.type as da_type",
			"da.created_at as da_created_at",
			"da.updated_at as da_updated_at",
			"da.deleted_at as da_deleted_at",
			"ca.id as ca_id",
			"ca.code as ca_code",
			"ca.name as ca_name",
			"ca.type as ca_type",
			"ca.created_at as ca_created_at",
			"ca.updated_at as ca_updated_at",
			"ca.deleted_at as ca_deleted_at",
		])
}

export async function findTransactionById(
	db: Kysely<DB>,
	id: number,
	userId?: string,
) {
	let query = withTransactionJoins(db).where("t.id", "=", id)

	if (userId) {
		query = query.where("t.user_id", "=", userId)
	}

	const row = await query.executeTakeFirst()
	return row ? mapTransactionRow(row) : null
}

export async function createTransaction(
	db: Kysely<DB>,
	input: {
		userId: string
		categoryId: number
		amount: number
		description: string
		transactionDate: Date
		debitAccountId: number
		creditAccountId: number
		referenceNumber?: string
		vatType?: string
	},
) {
	const category = await db
		.selectFrom("transaction_categories")
		.selectAll()
		.where("id", "=", input.categoryId)
		.where("deleted_at", "is", null)
		.executeTakeFirst()

	if (!category) {
		return {
			status: "not_found",
			message: "Transaction category not found",
		} as const
	}

	if (input.debitAccountId === input.creditAccountId) {
		return {
			status: "bad_request",
			message: "Debit and credit accounts must be different",
		} as const
	}

	const amount = toCents(input.amount)

	const inserted = await db
		.insertInto("transactions")
		.values({
			user_id: input.userId,
			category_id: input.categoryId,
			amount,
			description: input.description,
			transaction_date: input.transactionDate,
			debit_account_id: input.debitAccountId,
			credit_account_id: input.creditAccountId,
			book_type: category.book_type,
			reference_number: input.referenceNumber ?? null,
			vat_type: input.vatType ?? transactionVatTypes.vatExempt,
			created_at: new Date(),
		})
		.returningAll()
		.executeTakeFirst()

	return { status: "success", data: inserted } as const
}

export async function paginateTransactions(
	db: Kysely<DB>,
	params: {
		page: number
		limit: number
		userId: string
		filters: {
			bookType?: string
			categoryId?: number
			dateFrom?: Date
			dateTo?: Date
			search?: string
			record?: string
			exclude?: string[]
		}
	},
): Promise<{ total: number; rows: TransactionWithRelations[] }> {
	const { page, limit, userId, filters } = params
	const offset = (page - 1) * limit

	let base = db.selectFrom("transactions as t").where("t.user_id", "=", userId)

	if (filters.bookType) {
		base = base.where("t.book_type", "=", filters.bookType)
	}

	if (filters.categoryId) {
		base = base.where("t.category_id", "=", filters.categoryId)
	}

	if (filters.dateFrom) {
		base = base.where("t.transaction_date", ">=", filters.dateFrom)
	}

	if (filters.dateTo) {
		base = base.where("t.transaction_date", "<=", filters.dateTo)
	}

	if (filters.search) {
		base = base.where((eb) =>
			eb.or([
				eb("t.description", "ilike", `%${filters.search}%`),
				eb("t.reference_number", "ilike", `%${filters.search}%`),
			]),
		)
	}

	if (filters.record === "draft") {
		base = base.where("t.recorded_at", "is", null)
	}

	if (filters.record === "recorded") {
		base = base.where("t.recorded_at", "is not", null)
	}

	if (filters.exclude && filters.exclude.length > 0) {
		base = base.where("t.book_type", "not in", filters.exclude)
	}

	const totalResult = await base
		.select((eb) => eb.fn.count<number>("t.id").as("total"))
		.executeTakeFirst()

	const total = Number(totalResult?.total ?? 0)

	let rowsQuery = withTransactionJoins(db).where("t.user_id", "=", userId)

	if (filters.bookType) {
		rowsQuery = rowsQuery.where("t.book_type", "=", filters.bookType)
	}

	if (filters.categoryId) {
		rowsQuery = rowsQuery.where("t.category_id", "=", filters.categoryId)
	}

	if (filters.dateFrom) {
		rowsQuery = rowsQuery.where("t.transaction_date", ">=", filters.dateFrom)
	}

	if (filters.dateTo) {
		rowsQuery = rowsQuery.where("t.transaction_date", "<=", filters.dateTo)
	}

	if (filters.search) {
		rowsQuery = rowsQuery.where((eb) =>
			eb.or([
				eb("t.description", "ilike", `%${filters.search}%`),
				eb("t.reference_number", "ilike", `%${filters.search}%`),
			]),
		)
	}

	if (filters.record === "draft") {
		rowsQuery = rowsQuery.where("t.recorded_at", "is", null)
	}

	if (filters.record === "recorded") {
		rowsQuery = rowsQuery.where("t.recorded_at", "is not", null)
	}

	if (filters.exclude && filters.exclude.length > 0) {
		rowsQuery = rowsQuery.where("t.book_type", "not in", filters.exclude)
	}

	const rows = await rowsQuery
		.orderBy("t.transaction_date", "desc")
		.limit(limit)
		.offset(offset)
		.execute()

	return {
		total,
		rows: rows.map(mapTransactionRow),
	}
}

export async function updateTransaction(
	db: Kysely<DB>,
	id: number,
	userId: string,
	payload: {
		categoryId: number
		amount: number
		description?: string
		transactionDate: Date
		debitAccountId: number
		creditAccountId: number
		referenceNumber?: string
		vatType?: string
	},
) {
	const transaction = await db
		.selectFrom("transactions")
		.selectAll()
		.where("id", "=", id)
		.where("user_id", "=", userId)
		.executeTakeFirst()

	if (!transaction) {
		return { status: "not_found", message: "Transaction not found" } as const
	}

	const category = await db
		.selectFrom("transaction_categories")
		.selectAll()
		.where("id", "=", payload.categoryId)
		.where("deleted_at", "is", null)
		.executeTakeFirst()

	if (!category) {
		return {
			status: "not_found",
			message: "Transaction category not found",
		} as const
	}

	if (payload.debitAccountId === payload.creditAccountId) {
		return {
			status: "bad_request",
			message: "Debit and credit accounts must be different",
		} as const
	}

	const amount = toCents(payload.amount)

	const updated = await db
		.updateTable("transactions")
		.set({
			category_id: payload.categoryId,
			amount,
			description:
				payload.description !== undefined
					? payload.description
					: transaction.description,
			transaction_date: payload.transactionDate,
			debit_account_id: payload.debitAccountId,
			credit_account_id: payload.creditAccountId,
			book_type: category.book_type,
			reference_number:
				payload.referenceNumber !== undefined
					? payload.referenceNumber
					: transaction.reference_number,
			vat_type:
				payload.vatType !== undefined ? payload.vatType : transaction.vat_type,
		})
		.where("id", "=", id)
		.returningAll()
		.executeTakeFirst()

	return { status: "updated", data: updated } as const
}

export async function recordTransaction(db: Kysely<DB>, id: number) {
	const transaction = await db
		.selectFrom("transactions")
		.selectAll()
		.where("id", "=", id)
		.executeTakeFirst()

	if (!transaction) {
		return {
			status: "not_found",
			message: `Transaction not found with ${id} ID`,
		} as const
	}

	const updated = await db
		.updateTable("transactions")
		.set({ recorded_at: new Date() })
		.where("id", "=", id)
		.returningAll()
		.executeTakeFirst()

	return {
		status: "success",
		message: "Transaction has been recorded",
		data: updated,
	} as const
}

export async function undoRecordTransaction(db: Kysely<DB>, id: number) {
	const transaction = await db
		.selectFrom("transactions")
		.selectAll()
		.where("id", "=", id)
		.executeTakeFirst()

	if (!transaction) {
		return {
			status: "not_found",
			message: `Transaction not found with ${id} ID`,
		} as const
	}

	const updated = await db
		.updateTable("transactions")
		.set({ recorded_at: null })
		.where("id", "=", id)
		.returningAll()
		.executeTakeFirst()

	return {
		status: "success",
		message: "Transaction has been moved to draft",
		data: updated,
	} as const
}

export async function bulkRecordTransactions(
	db: Kysely<DB>,
	transactionIds: number[],
) {
	const now = new Date()

	const updated = await db
		.updateTable("transactions")
		.set({ recorded_at: now })
		.where("id", "in", transactionIds)
		.returning(["id", "recorded_at"])
		.execute()

	return {
		status: "success",
		summary: {
			total: transactionIds.length,
			updated: updated.length,
		},
		message: "Transactions have been recorded",
	} as const
}

export async function bulkUndoRecordTransactions(
	db: Kysely<DB>,
	transactionIds: number[],
) {
	const updated = await db
		.updateTable("transactions")
		.set({ recorded_at: null })
		.where("id", "in", transactionIds)
		.returning(["id", "recorded_at"])
		.execute()

	return {
		status: "success",
		summary: {
			total: transactionIds.length,
			updated: updated.length,
		},
		message: "Transactions have been moved to draft",
	} as const
}

export async function summary(db: Kysely<DB>, userId: string) {
	const incomeResult = await db
		.selectFrom("transactions")
		.select((eb) => eb.fn.sum<number>("amount").as("sum"))
		.where("book_type", "=", "cash_receipt_journal")
		.where("user_id", "=", userId)
		.executeTakeFirst()

	const expensesResult = await db
		.selectFrom("transactions")
		.select((eb) => eb.fn.sum<number>("amount").as("sum"))
		.where("book_type", "=", "cash_disbursement_journal")
		.where("user_id", "=", userId)
		.executeTakeFirst()

	const totalIncome = Number(incomeResult?.sum ?? 0)
	const totalExpenses = Number(expensesResult?.sum ?? 0)

	const chartAccounts = await getUsedChartOfAccounts(db, userId)
	const totalChartOfAccounts = chartAccounts.length
	const netIncome = totalIncome - totalExpenses

	return { totalIncome, totalExpenses, netIncome, totalChartOfAccounts }
}

export async function getUsedChartOfAccounts(db: Kysely<DB>, userId: string) {
	const debitIds = await db
		.selectFrom("transactions")
		.select("debit_account_id as accountId")
		.where("user_id", "=", userId)
		.execute()

	const creditIds = await db
		.selectFrom("transactions")
		.select("credit_account_id as accountId")
		.where("user_id", "=", userId)
		.execute()

	const accountIds = Array.from(
		new Set([...debitIds, ...creditIds].map((row) => row.accountId)),
	).filter((id) => typeof id === "number")

	if (accountIds.length === 0) return []

	return db
		.selectFrom("chart_of_accounts")
		.selectAll()
		.where("id", "in", accountIds)
		.where("deleted_at", "is", null)
		.execute()
}

export async function getTransactionsWithRelations(
	db: Kysely<DB>,
	ids: number[],
) {
	if (ids.length === 0) return [] as TransactionWithRelations[]

	const rows = await withTransactionJoins(db).where("t.id", "in", ids).execute()

	return rows.map(mapTransactionRow)
}

export async function getTransactionsWithRelationsByGlId(
	db: Kysely<DB>,
	glIds: number[],
) {
	if (glIds.length === 0) return [] as TransactionWithRelations[]

	const rows = await withTransactionJoins(db)
		.where("t.gl_id", "in", glIds)
		.execute()

	return rows.map(mapTransactionRow)
}
