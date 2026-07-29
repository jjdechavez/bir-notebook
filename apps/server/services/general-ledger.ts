import type { GeneralLedgerViewResult } from "@bir-notebook/shared/models/general-ledger"
import type {
	ParentGlTransaction,
	TransferResult,
} from "@bir-notebook/shared/models/transaction"
import type { Kysely, Selectable } from "kysely"
import { transactionCategoryBookTypes } from "../constants/transaction.js"
import type { ChartOfAccounts, DB, Transactions } from "../db/types.js"
import { getTransactionsWithRelationsByGlId } from "./transactions.js"

export interface LedgerTransaction {
	id: number
	date: string
	description: string
	referenceNumber?: string
	debitAmount?: number
	creditAmount?: number
	counterpartAccount: {
		code: string
		name: string
	}
	transferGroupId?: string
	transferredAt?: string
	isTransferred?: boolean
}

export interface GeneralLedgerMonth {
	month: string
	openingBalance: number
	transactionCount: number
	periodClosing: {
		totalDebits: number
		totalCredits: number
		netAmount: number
		runningBalance: number
		balanceType: "debit" | "credit"
	}
}

export interface GeneralLedgerView {
	account: Selectable<ChartOfAccounts>
	dateRange: {
		from: string
		to: string
	}
	months: GeneralLedgerMonth[]
	grandTotal: {
		totalDebits: number
		totalCredits: number
		netAmount: number
		finalBalance: number
		balanceType: "debit" | "credit"
	}
}

export interface TransferValidationResult {
	isValid: boolean
	errors: string[]
	warnings: string[]
	eligibleTransactions: number[]
	ineligibleTransactions: Array<{
		id: number
		reason: string
	}>
}

function formatYearMonth(date: Date) {
	return date.toISOString().slice(0, 7)
}

function startOfMonth(date: Date) {
	return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), 1))
}

function addMonths(date: Date, months: number) {
	return new Date(
		Date.UTC(date.getUTCFullYear(), date.getUTCMonth() + months, 1),
	)
}

function getMonthsInRange(dateFrom: Date, dateTo: Date) {
	const months: string[] = []
	let current = startOfMonth(dateFrom)
	const end = startOfMonth(dateTo)

	while (current <= end) {
		months.push(formatYearMonth(current))
		current = addMonths(current, 1)
	}

	return months
}

function calculatePeriodClosing(
	totals: { totalDebits: number; totalCredits: number },
	openingBalance: number,
) {
	const { totalDebits, totalCredits } = totals

	const netAmount = totalDebits - totalCredits
	const runningBalance = openingBalance + netAmount
	const balanceType = runningBalance >= 0 ? "debit" : "credit"

	return {
		totalDebits,
		totalCredits,
		netAmount,
		runningBalance,
		balanceType,
	} as const
}

function calculateGrandTotal(
	months: GeneralLedgerMonth[],
	finalBalance: number,
) {
	const totalDebits = months.reduce(
		(sum, month) => sum + month.periodClosing.totalDebits,
		0,
	)
	const totalCredits = months.reduce(
		(sum, month) => sum + month.periodClosing.totalCredits,
		0,
	)
	const netAmount = totalDebits - totalCredits
	const balanceType = finalBalance >= 0 ? "debit" : "credit"

	return {
		totalDebits,
		totalCredits,
		netAmount,
		finalBalance,
		balanceType,
	} as const
}

async function getOpeningBalance(
	db: Kysely<DB>,
	accountId: number,
	asOfDate: Date,
	userId: string,
) {
	const previousTransactions = await db
		.selectFrom("transactions")
		.selectAll()
		.where("user_id", "=", userId)
		.where("book_type", "=", transactionCategoryBookTypes.generalLedger)
		.where("gl_id", "is", null)
		.where("gl_posting_month", "<", formatYearMonth(asOfDate))
		.where((eb) =>
			eb.or([
				eb("debit_account_id", "=", accountId),
				eb("credit_account_id", "=", accountId),
			]),
		)
		.execute()

	let totalDebits = 0
	let totalCredits = 0

	for (const transaction of previousTransactions) {
		if (transaction.debit_account_id === accountId) {
			totalDebits += transaction.amount
		} else {
			totalCredits += transaction.amount
		}
	}

	return totalDebits - totalCredits
}

async function getMonthTransactions(
	db: Kysely<DB>,
	accountId: number,
	month: string,
	userId: string,
	options?: { limit?: number; offset?: number },
) {
	let query = db
		.selectFrom("transactions as t")
		.leftJoin("chart_of_accounts as debit", "debit.id", "t.debit_account_id")
		.leftJoin("chart_of_accounts as credit", "credit.id", "t.credit_account_id")
		.select([
			"t.id as id",
			"t.debit_account_id as debit_account_id",
			"t.credit_account_id as credit_account_id",
			"t.amount as amount",
			"t.description as description",
			"t.reference_number as reference_number",
			"t.transaction_date as transaction_date",
			"t.created_at as created_at",
			"debit.code as debit_code",
			"debit.name as debit_name",
			"credit.code as credit_code",
			"credit.name as credit_name",
		])
		.where("t.user_id", "=", userId)
		.where("t.gl_posting_month", "=", month)
		.where((eb) =>
			eb.or([
				eb("t.debit_account_id", "=", accountId),
				eb("t.credit_account_id", "=", accountId),
			]),
		)
		.where("t.book_type", "=", transactionCategoryBookTypes.generalLedger)
		.where("t.gl_id", "is", null)
		.orderBy("t.created_at", "asc")
		.orderBy("t.id", "asc")

	if (options?.limit !== undefined) query = query.limit(options.limit)
	if (options?.offset !== undefined) query = query.offset(options.offset)

	const transactions = await query.execute()

	return transactions.map((transaction) => {
		const isDebit = transaction.debit_account_id === accountId
		const counterpartCode = isDebit
			? (transaction.credit_code ?? "")
			: (transaction.debit_code ?? "")
		const counterpartName = isDebit
			? (transaction.credit_name ?? "")
			: (transaction.debit_name ?? "")

		const ledgerItem: LedgerTransaction = {
			id: transaction.id,
			date: (
				transaction.transaction_date ?? transaction.created_at
			).toISOString(),
			description: transaction.description ?? "",
			...(transaction.reference_number
				? { referenceNumber: transaction.reference_number }
				: {}),
			...(isDebit
				? { debitAmount: transaction.amount }
				: { creditAmount: transaction.amount }),
			counterpartAccount: {
				code: counterpartCode,
				name: counterpartName,
			},
			transferGroupId: String(transaction.id),
			transferredAt: transaction.created_at.toISOString(),
			isTransferred: true,
		}

		return ledgerItem
	})
}

async function getMonthTransactionStats(
	db: Kysely<DB>,
	accountId: number,
	month: string,
	userId: string,
) {
	const result = await db
		.selectFrom("transactions as t")
		.select((eb) => [
			eb.fn.count<number>("t.id").as("transaction_count"),
			eb.fn
				.sum<number>(
					eb
						.case()
						.when("t.debit_account_id", "=", accountId)
						.then(eb.ref("t.amount"))
						.else(0)
						.end(),
				)
				.as("total_debits"),
			eb.fn
				.sum<number>(
					eb
						.case()
						.when("t.credit_account_id", "=", accountId)
						.then(eb.ref("t.amount"))
						.else(0)
						.end(),
				)
				.as("total_credits"),
		])
		.where("t.user_id", "=", userId)
		.where("t.gl_posting_month", "=", month)
		.where("t.book_type", "=", transactionCategoryBookTypes.generalLedger)
		.where("t.gl_id", "is", null)
		.where((eb) =>
			eb.or([
				eb("t.debit_account_id", "=", accountId),
				eb("t.credit_account_id", "=", accountId),
			]),
		)
		.executeTakeFirst()

	return {
		transactionCount: Number(result?.transaction_count ?? 0),
		totalDebits: Number(result?.total_debits ?? 0),
		totalCredits: Number(result?.total_credits ?? 0),
	}
}

export async function getGeneralLedgerView(
	db: Kysely<DB>,
	accountId: number,
	dateFrom: Date,
	dateTo: Date,
	userId: string,
): Promise<GeneralLedgerViewResult> {
	const account = await db
		.selectFrom("chart_of_accounts")
		.selectAll()
		.where("id", "=", accountId)
		.executeTakeFirst()

	if (!account) {
		return {
			status: "not_found" as const,
			message: `Account with ID ${accountId} not found`,
		}
	}

	const months = getMonthsInRange(dateFrom, dateTo)
	const monthData: GeneralLedgerMonth[] = []
	let runningBalance = await getOpeningBalance(db, accountId, dateFrom, userId)

	for (const month of months) {
		const stats = await getMonthTransactionStats(db, accountId, month, userId)
		const periodClosing = calculatePeriodClosing(stats, runningBalance)

		monthData.push({
			month,
			openingBalance: runningBalance,
			transactionCount: stats.transactionCount,
			periodClosing,
		})

		runningBalance = periodClosing.runningBalance
	}

	return {
		status: "success" as const,
		data: {
			account,
			dateRange: {
				from: dateFrom.toISOString(),
				to: dateTo.toISOString(),
			},
			months: monthData,
			grandTotal: calculateGrandTotal(monthData, runningBalance),
		},
	}
}

export async function getGeneralLedgerEntries(
	db: Kysely<DB>,
	accountId: number,
	month: string,
	userId: string,
	page: number,
	limit: number,
) {
	const stats = await getMonthTransactionStats(db, accountId, month, userId)
	const start = (page - 1) * limit
	const entries = await getMonthTransactions(db, accountId, month, userId, {
		limit,
		offset: start,
	})

	return {
		status: "success" as const,
		data: entries,
		meta: {
			total: stats.transactionCount,
			page,
			limit,
			totalPages: Math.ceil(stats.transactionCount / limit),
		},
	}
}

export async function validateTransferEligibility(
	db: Kysely<DB>,
	transactionIds: number[],
	userId: string,
): Promise<TransferValidationResult> {
	const transactions = await db
		.selectFrom("transactions")
		.selectAll()
		.where("id", "in", transactionIds)
		.where("user_id", "=", userId)
		.execute()

	const eligibleTransactions: number[] = []
	const ineligibleTransactions: Array<{ id: number; reason: string }> = []
	const errors: string[] = []
	const warnings: string[] = []

	for (const transaction of transactions) {
		if (!transaction.recorded_at) {
			ineligibleTransactions.push({
				id: transaction.id,
				reason: "Transaction must be recorded before transfer",
			})
			continue
		}

		if (transaction.transferred_to_gl_at) {
			ineligibleTransactions.push({
				id: transaction.id,
				reason: "Transaction already transferred to General Ledger",
			})
			continue
		}

		eligibleTransactions.push(transaction.id)
	}

	const foundIds = transactions.map((t) => t.id)
	const missingIds = transactionIds.filter((id) => !foundIds.includes(id))

	if (missingIds.length > 0) {
		errors.push(`Transactions not found: ${missingIds.join(", ")}`)
	}

	return {
		isValid: eligibleTransactions.length > 0 && errors.length === 0,
		errors,
		warnings,
		eligibleTransactions,
		ineligibleTransactions,
	}
}

export async function transferToGeneralLedger(
	db: Kysely<DB>,
	transactionIds: number[],
	targetMonth: string,
	glDescription: string,
	userId: string,
): Promise<{ status: string; result?: TransferResult; errors?: string[] }> {
	const validation = await validateTransferEligibility(
		db,
		transactionIds,
		userId,
	)

	if (!validation.isValid || validation.eligibleTransactions.length === 0) {
		return {
			status: "error" as const,
			errors:
				validation.errors.length > 0
					? validation.errors
					: ["No eligible transactions to transfer"],
		}
	}

	try {
		const sourceTransactions: Array<Selectable<Transactions>> = await db
			.selectFrom("transactions")
			.selectAll()
			.where("id", "in", validation.eligibleTransactions)
			.where("user_id", "=", userId)
			.execute()

		const groupMap = new Map<string, Array<Selectable<Transactions>>>()
		for (const transaction of sourceTransactions) {
			const key = `${transaction.debit_account_id}-${
				transaction.credit_account_id
			}`
			const existing = groupMap.get(key) ?? []
			existing.push(transaction)
			groupMap.set(key, existing)
		}

		const parentGlTransactions: ParentGlTransaction[] = []

		for (const [key, group] of groupMap.entries()) {
			const totalAmount = group.reduce((sum, t) => sum + t.amount, 0)
			const parts = key.split("-")
			if (parts.length !== 2) {
				return {
					status: "error" as const,
					errors: ["Invalid account pair for transfer"],
				}
			}

			const debitAccountId = Number(parts[0])
			const creditAccountId = Number(parts[1])

			if (
				!Number.isFinite(debitAccountId) ||
				!Number.isFinite(creditAccountId)
			) {
				return {
					status: "error" as const,
					errors: ["Invalid account pair for transfer"],
				}
			}

			const parent = await db
				.insertInto("transactions")
				.values({
					book_type: transactionCategoryBookTypes.generalLedger,
					description: glDescription,
					amount: totalAmount,
					debit_account_id: debitAccountId,
					credit_account_id: creditAccountId,
					user_id: userId,
					gl_id: null,
					gl_posting_month: targetMonth,
					category_id: null,
					reference_number: null,
					vat_type: null,
					created_at: new Date(),
				})
				.returningAll()
				.executeTakeFirst()

			parentGlTransactions.push({
				id: parent?.id as number,
				description: parent?.description ?? "",
				amount: parent?.amount || 0,
				accountPair: key,
				debitAccountId,
				creditAccountId,
				targetMonth,
			})

			await db
				.updateTable("transactions")
				.set({
					gl_id: parent?.id,
					transferred_to_gl_at: new Date(),
					gl_posting_month: targetMonth,
				})
				.where(
					"id",
					"in",
					group.map((t) => t.id),
				)
				.execute()
		}

		const result: TransferResult = {
			parentGlTransactions,
			totalTransactions: sourceTransactions.length,
			totalGroups: groupMap.size,
		}

		return { status: "success" as const, result }
	} catch (error) {
		return {
			status: "error" as const,
			errors: [
				error instanceof Error ? error.message : "Unknown error occurred",
			],
		}
	}
}

export async function getTransferHistory(
	db: Kysely<DB>,
	userId: string,
	transferGroupId?: string,
): Promise<Array<Selectable<Transactions>>> {
	if (transferGroupId) {
		const parentId = Number(transferGroupId)
		const parents: Array<Selectable<Transactions>> = await db
			.selectFrom("transactions")
			.selectAll()
			.where("user_id", "=", userId)
			.where((eb) =>
				eb.or([eb("id", "=", parentId), eb("gl_id", "=", parentId)]),
			)
			.execute()

		return parents
	}

	return db
		.selectFrom("transactions")
		.selectAll()
		.where("user_id", "=", userId)
		.where("book_type", "=", transactionCategoryBookTypes.generalLedger)
		.where("gl_id", "is", null)
		.orderBy("created_at", "desc")
		.execute()
}

export async function listTransferHistoryItems(
	db: Kysely<DB>,
	userId: string,
	transferGroupId?: string,
) {
	let query = db
		.selectFrom("transactions as t")
		.leftJoin("transaction_categories as c", "c.id", "t.category_id")
		.leftJoin("chart_of_accounts as da", "da.id", "t.debit_account_id")
		.leftJoin("chart_of_accounts as ca", "ca.id", "t.credit_account_id")
		.select([
			"t.id as id",
			"t.gl_id as transfer_group_id",
			"t.transferred_to_gl_at as transferred_to_gl_at",
			"t.transaction_date as transaction_date",
			"t.description as description",
			"t.amount as amount",
			"da.id as debit_id",
			"da.code as debit_code",
			"da.name as debit_name",
			"ca.id as credit_id",
			"ca.code as credit_code",
			"ca.name as credit_name",
			"c.name as category_name",
		])
		.where("t.user_id", "=", userId)
		.where("t.gl_id", "is not", null)
		.where("t.transferred_to_gl_at", "is not", null)
		.orderBy("t.transferred_to_gl_at", "desc")
		.orderBy("t.id", "desc")

	if (transferGroupId) {
		query = query.where("t.gl_id", "=", Number(transferGroupId))
	}

	return query.execute()
}

export async function getChildTransactions(
	db: Kysely<DB>,
	parentIds: number[],
) {
	const rows = await getTransactionsWithRelationsByGlId(db, parentIds)
	const grouped = new Map<number, typeof rows>()

	for (const row of rows) {
		const parentId = row.gl_id
		if (!parentId) continue
		const list = grouped.get(parentId) ?? []
		list.push(row)
		grouped.set(parentId, list)
	}

	return grouped
}
