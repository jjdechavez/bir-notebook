import { z } from "zod"
import { transactionVatTypes } from "../constants/transaction.js"

export const createTransactionSchema = z.object({
	categoryId: z.number().int(),
	amount: z.number().positive(),
	description: z.string().max(500),
	transactionDate: z.union([
		z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
		z.string().regex(/^\d+$/),
	]),
	debitAccountId: z.number().int(),
	creditAccountId: z.number().int(),
	referenceNumber: z.string().max(50).optional(),
	vatType: z
		.enum(Object.values(transactionVatTypes) as [string, ...string[]])
		.optional(),
})

export const updateTransactionSchema = z.object({
	categoryId: z.number().int(),
	amount: z.number().positive(),
	description: z.string().max(500).optional(),
	transactionDate: z.union([
		z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
		z.string().regex(/^\d+$/),
	]),
	debitAccountId: z.number().int(),
	creditAccountId: z.number().int(),
	referenceNumber: z.string().max(50).optional(),
	vatType: z
		.enum(Object.values(transactionVatTypes) as [string, ...string[]])
		.optional(),
})

export const bulkRecordTransactionSchema = z.object({
	transactionIds: z.array(z.number().int()),
})

export const transactionCategoryQuerySchema = z.object({
	page: z.coerce.number().int().positive().optional(),
	limit: z.coerce.number().int().positive().optional(),
	s: z.string().optional(),
})
