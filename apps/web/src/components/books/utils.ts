import type { ChartOfAccount, Transaction } from "@/types/transaction"

export const getChartOfAccounts = (transactions: Transaction[]) => {
	const accounts = new Set()
	transactions.forEach((transaction) => {
		if (transaction.debitAccount) {
			accounts.add(JSON.stringify(transaction.debitAccount))
		}
		if (transaction.creditAccount) {
			accounts.add(JSON.stringify(transaction.creditAccount))
		}
	})
	return Array.from(accounts).map(
		(account) => JSON.parse(account as string) as ChartOfAccount,
	)
}

export const getColorClasses = (color: string) => {
	const colors = {
		green: "border-success bg-success/50 dark:bg-success/30",
		red: "border-destructive/20 dark:border-destructive bg-destructive/20 dark:bg-destructive/30",
		blue: "border-blue-200 bg-blue-50",
		purple: "border-purple-200 bg-purple-50",
	}
	return colors[color as keyof typeof colors] || colors.blue
}

export type ColumnSize = 6 | 10 | 14
export type ColumnarBookType =
	| "cash_receipts"
	| "cash_disbursements"
	| "general_journal"

// Counted columns include: Reference + Sundry + Sundry Amount
export const COLUMNAR_FIXED_COLUMNS = 3

export interface ColumnarBookConfig {
	bookType: ColumnarBookType
	columnSize: ColumnSize
	columns: string[] // Account codes that get dedicated columns (4, 8, or 12)
}

export const defaultColumnarConfigs: Record<
	ColumnarBookType,
	ColumnarBookConfig
> = {
	cash_receipts: {
		bookType: "cash_receipts",
		columnSize: 6,
		columns: [
			"1101", // Cash on Hand
			"1102", // Cash in Bank
			"1201", // Accounts Receivable
			"4105", // Commission Income
		],
	},
	cash_disbursements: {
		bookType: "cash_disbursements",
		columnSize: 6,
		columns: [
			"1101", // Cash on Hand
			"1102", // Cash in Bank
			"5302", // Utilities Expense
			"5304", // Office Supplies Expense
		],
	},
	general_journal: {
		bookType: "general_journal",
		columnSize: 6,
		columns: [
			"5600", // Depreciation Expense
			"1510", // Accumulated Depreciation
			"3000", // Capital
			"3200", // Drawings
		],
	},
}
