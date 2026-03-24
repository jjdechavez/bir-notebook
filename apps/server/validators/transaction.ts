import { z } from "zod";
import {
  transactionCategoryBookTypes,
  transactionVatTypes
} from "../constants/transaction.js";

export const createTransactionSchema = z.object({
  categoryId: z.number().int(),
  amount: z.number().positive(),
  description: z.string().max(500),
  transactionDate: z.union([
    z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    z.string().regex(/^\d+$/)
  ]),
  debitAccountId: z.number().int(),
  creditAccountId: z.number().int(),
  referenceNumber: z.string().max(50).optional(),
  vatType: z.enum(
    Object.values(transactionVatTypes) as [string, ...string[]]
  ).optional()
});

export const transactionListSchema = z.object({
  page: z.coerce.number().int().positive().optional(),
  limit: z.coerce.number().int().positive().optional(),
  bookType: z.enum(
    Object.values(transactionCategoryBookTypes) as [string, ...string[]]
  ).optional(),
  categoryId: z.coerce.number().int().optional(),
  dateFrom: z.string().optional(),
  dateTo: z.string().optional(),
  search: z.string().optional(),
  record: z.string().optional(),
  exclude: z.string().optional()
});

export const updateTransactionSchema = z.object({
  categoryId: z.number().int(),
  amount: z.number().positive(),
  description: z.string().max(500).optional(),
  transactionDate: z.union([
    z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    z.string().regex(/^\d+$/)
  ]),
  debitAccountId: z.number().int(),
  creditAccountId: z.number().int(),
  referenceNumber: z.string().max(50).optional(),
  vatType: z.enum(
    Object.values(transactionVatTypes) as [string, ...string[]]
  ).optional()
});

export const bulkRecordTransactionSchema = z.object({
  transactionIds: z.array(z.number().int())
});

export const transactionCategoryQuerySchema = z.object({
  page: z.coerce.number().int().positive().optional(),
  limit: z.coerce.number().int().positive().optional(),
  s: z.string().optional()
});

export const transferToGeneralLedgerSchema = z.object({
  transactionIds: z.array(z.number().int()),
  targetMonth: z.string().regex(/^\d{4}-\d{2}$/),
  glDescription: z.string().min(1).max(255)
});

export const bulkTransferToGeneralLedgerSchema = z.object({
  transfers: z.array(
    z.object({
      transactionIds: z.array(z.number().int()),
      targetMonth: z.string().regex(/^\d{4}-\d{2}$/),
      glDescription: z.string().min(1).max(255)
    })
  )
});

export const generalLedgerViewSchema = z.object({
  accountId: z.coerce.number().int(),
  dateFrom: z.string(),
  dateTo: z.string()
});

export const transferHistorySchema = z.object({
  transferGroupId: z.string().optional(),
  page: z.coerce.number().int().positive().optional(),
  limit: z.coerce.number().int().positive().optional()
});
