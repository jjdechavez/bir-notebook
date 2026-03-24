import {
  getQuery,
  getRouterParams,
  getRequestURL,
  readBody,
  setResponseStatus
} from "h3";
import {
  bulkRecordTransactionSchema,
  bulkTransferToGeneralLedgerSchema,
  createTransactionSchema,
  generalLedgerViewSchema,
  transactionListSchema,
  transferHistorySchema,
  transferToGeneralLedgerSchema,
  updateTransactionSchema
} from "../validators/transaction.js";
import { requireAuth } from "../middleware/auth.js";
import {
  bulkRecordTransactions,
  bulkUndoRecordTransactions,
  createTransaction,
  findTransactionById,
  paginateTransactions,
  recordTransaction,
  summary,
  undoRecordTransaction,
  updateTransaction
} from "../services/transactions.js";
import {
  getGeneralLedgerView,
  listTransferHistoryItems,
  transferToGeneralLedger,
  validateTransferEligibility
} from "../services/general-ledger.js";
import { parseDateInput } from "../utils/date-parse.js";
import { serializeTransaction } from "../serializers/transaction.js";
import { buildPaginationMeta } from "../utils/pagination.js";

function parseTransactionDate(value: string) {
  const parsed = parseDateInput(value);
  if (!parsed) throw new Error("Invalid transactionDate");
  return parsed;
}

async function ensureAccountsExist(event: any, accountIds: number[]) {
  const accounts: Array<{ id: number }> = await event.context.db
    .selectFrom("chart_of_accounts")
    .select(["id"])
    .where("id", "in", accountIds)
    .where("deleted_at", "is", null)
    .execute();

  const found = new Set(accounts.map((account) => account.id));
  return accountIds.every((id) => found.has(id));
}

export const listTransactions = requireAuth(async (event) => {
  const query = transactionListSchema.parse(getQuery(event));

  if (query.dateFrom && !parseDateInput(query.dateFrom)) {
    setResponseStatus(event, 400);
    return { message: "Invalid dateFrom" };
  }

  if (query.dateTo && !parseDateInput(query.dateTo)) {
    setResponseStatus(event, 400);
    return { message: "Invalid dateTo" };
  }

  const filters: {
    bookType?: string;
    categoryId?: number;
    dateFrom?: Date;
    dateTo?: Date;
    search?: string;
    record?: string;
    exclude?: string[];
  } = {};

  if (query.bookType) filters.bookType = query.bookType;
  if (query.categoryId) filters.categoryId = query.categoryId;
  if (query.dateFrom) {
    const parsed = parseDateInput(query.dateFrom);
    if (parsed) filters.dateFrom = parsed;
  }
  if (query.dateTo) {
    const parsed = parseDateInput(query.dateTo);
    if (parsed) filters.dateTo = parsed;
  }
  if (query.search) filters.search = query.search;
  if (query.record) filters.record = query.record;
  if (query.exclude) filters.exclude = query.exclude.split(",");

  const page = query.page ?? 1;
  const limit = query.limit ?? 10;

  const result = await paginateTransactions(event.context.db, {
    page,
    limit,
    userId: event.context.currentUser!.id,
    filters
  });

  const url = getRequestURL(event);
  const baseUrl = `${url.origin}${url.pathname}`;

  return {
    data: result.rows.map((row) =>
      serializeTransaction(
        row.transaction,
        row.category,
        row.debitAccount,
        row.creditAccount
      )
    ),
    meta: buildPaginationMeta(result.total, limit, page, baseUrl)
  };
});

export const createTransactionHandler = requireAuth(async (event) => {
  try {
    const payload = createTransactionSchema.parse(await readBody(event));
    const transactionDate = parseTransactionDate(payload.transactionDate);

    const accountsOk = await ensureAccountsExist(event, [
      payload.debitAccountId,
      payload.creditAccountId
    ]);
    if (!accountsOk) {
      setResponseStatus(event, 400);
      return { message: "Account not found" };
    }

    const createPayload: {
      userId: string;
      categoryId: number;
      amount: number;
      description: string;
      transactionDate: Date;
      debitAccountId: number;
      creditAccountId: number;
      referenceNumber?: string;
      vatType?: string;
    } = {
      userId: event.context.currentUser!.id,
      categoryId: payload.categoryId,
      amount: payload.amount,
      description: payload.description,
      transactionDate,
      debitAccountId: payload.debitAccountId,
      creditAccountId: payload.creditAccountId
    };

    if (payload.referenceNumber !== undefined) {
      createPayload.referenceNumber = payload.referenceNumber;
    }
    if (payload.vatType !== undefined) {
      createPayload.vatType = payload.vatType;
    }

    const result = await createTransaction(event.context.db, createPayload);

    if (result.status === "not_found") {
      setResponseStatus(event, 404);
      return { message: result.message };
    }

    if (result.status === "bad_request") {
      setResponseStatus(event, 400);
      return { message: result.message };
    }

    return {
      data: serializeTransaction(result.data as any),
      message: "Transaction created successfully"
    };
  } catch (error) {
    setResponseStatus(event, 400);
    return {
      message: error instanceof Error ? error.message : "Failed to create transaction"
    };
  }
});

export const showTransaction = requireAuth(async (event) => {
  const params = getRouterParams(event);
  const transaction = await findTransactionById(
    event.context.db,
    Number(params["id"]),
    event.context.currentUser!.id
  );

  if (!transaction) {
    setResponseStatus(event, 404);
    return { message: "Transaction not found" };
  }

  return {
    data: serializeTransaction(
      transaction.transaction,
      transaction.category,
      transaction.debitAccount,
      transaction.creditAccount
    )
  };
});

export const summaryTransactions = requireAuth(async (event) => {
  return summary(event.context.db, event.context.currentUser!.id);
});

export const updateTransactionHandler = requireAuth(async (event) => {
  const params = getRouterParams(event);
  const payload = updateTransactionSchema.parse(await readBody(event));
  const transactionDate = parseTransactionDate(payload.transactionDate);

  const accountsOk = await ensureAccountsExist(event, [
    payload.debitAccountId,
    payload.creditAccountId
  ]);
  if (!accountsOk) {
    setResponseStatus(event, 400);
    return { message: "Account not found" };
  }

  const updatePayload: {
    categoryId: number;
    amount: number;
    transactionDate: Date;
    debitAccountId: number;
    creditAccountId: number;
    description?: string;
    referenceNumber?: string;
    vatType?: string;
  } = {
    categoryId: payload.categoryId,
    amount: payload.amount,
    transactionDate,
    debitAccountId: payload.debitAccountId,
    creditAccountId: payload.creditAccountId
  };

  if (payload.description !== undefined) {
    updatePayload.description = payload.description;
  }
  if (payload.referenceNumber !== undefined) {
    updatePayload.referenceNumber = payload.referenceNumber;
  }
  if (payload.vatType !== undefined) {
    updatePayload.vatType = payload.vatType;
  }

  const result = await updateTransaction(
    event.context.db,
    Number(params["id"]),
    updatePayload
  );

  if (result.status === "not_found") {
    setResponseStatus(event, 404);
    return { message: result.message };
  }

  if (result.status === "bad_request") {
    setResponseStatus(event, 400);
    return { message: result.message };
  }

  return {
    data: serializeTransaction(result.data as any),
    message: "Transaction updated successfully"
  };
});

export const recordTransactionHandler = requireAuth(async (event) => {
  const params = getRouterParams(event);
  const result = await recordTransaction(
    event.context.db,
    Number(params["id"])
  );

  if (result.status === "not_found") {
    setResponseStatus(event, 404);
    return { message: result.message };
  }

  return {
    data: serializeTransaction(result.data as any),
    message: result.message
  };
});

export const undoRecordTransactionHandler = requireAuth(async (event) => {
  const params = getRouterParams(event);
  const result = await undoRecordTransaction(
    event.context.db,
    Number(params["id"])
  );

  if (result.status === "not_found") {
    setResponseStatus(event, 404);
    return { message: result.message };
  }

  return {
    data: serializeTransaction(result.data as any),
    message: result.message
  };
});

export const bulkRecordTransactionHandler = requireAuth(async (event) => {
  const payload = bulkRecordTransactionSchema.parse(await readBody(event));
  const result = await bulkRecordTransactions(
    event.context.db,
    payload.transactionIds
  );

  return {
    status: result.status,
    data: result.summary,
    message: result.message
  };
});

export const bulkUndoRecordTransactionHandler = requireAuth(async (event) => {
  const payload = bulkRecordTransactionSchema.parse(await readBody(event));
  const result = await bulkUndoRecordTransactions(
    event.context.db,
    payload.transactionIds
  );

  return {
    status: result.status,
    data: result.summary,
    message: result.message
  };
});

export const transferToGeneralLedgerHandler = requireAuth(async (event) => {
  const payload = transferToGeneralLedgerSchema.parse(await readBody(event));
  const result = await transferToGeneralLedger(
    event.context.db,
    payload.transactionIds,
    payload.targetMonth,
    payload.glDescription,
    event.context.currentUser!.id
  );

  if (result.status === "error") {
    setResponseStatus(event, 500);
    return {
      status: result.status,
      errors: result.errors,
      message: "Transfer failed"
    };
  }

  return {
    status: result.status,
    data: result.result,
    message: `Successfully transferred ${
      result.result?.totalTransactions
    } transactions to ${result.result?.totalGroups} GL group(s)`
  };
});

export const bulkTransferToGeneralLedgerHandler = requireAuth(async (event) => {
  const payload = bulkTransferToGeneralLedgerSchema.parse(await readBody(event));

  const results = await Promise.allSettled(
    payload.transfers.map((transfer) =>
      transferToGeneralLedger(
        event.context.db,
        transfer.transactionIds,
        transfer.targetMonth,
        transfer.glDescription,
        event.context.currentUser!.id
      )
    )
  );

  const successful = results.filter((r) => r.status === "fulfilled");
  const failed = results.filter((r) => r.status === "rejected");

  return {
    status: failed.length === 0 ? "success" : "partial",
    message: `Processed ${payload.transfers.length} transfer groups. ${
      successful.length
    } successful, ${failed.length} failed.`,
    summary: {
      totalGroups: payload.transfers.length,
      successful: successful.length,
      failed: failed.length,
      results: successful.map(
        (r) => (r as PromiseFulfilledResult<any>).value.result
      )
    }
  };
});

export const validateTransferEligibilityHandler = requireAuth(async (event) => {
  const { transactionIds } = bulkRecordTransactionSchema.parse(await readBody(event));
  const result = await validateTransferEligibility(
    event.context.db,
    transactionIds,
    event.context.currentUser!.id
  );

  return {
    isValid: result.isValid,
    eligibleTransactions: result.eligibleTransactions,
    ineligibleTransactions: result.ineligibleTransactions,
    errors: result.errors,
    warnings: result.warnings
  };
});

export const transferHistoryHandler = requireAuth(async (event) => {
  const payload = transferHistorySchema.parse(getQuery(event));
  const history = await listTransferHistoryItems(
    event.context.db,
    event.context.currentUser!.id,
    payload.transferGroupId
  );

  return {
    data: history.map((item) => ({
      id: item.id,
      transferGroupId: String(item.transfer_group_id ?? ""),
      transferredToGlAt: item.transferred_to_gl_at
        ? item.transferred_to_gl_at.toISOString()
        : "",
      transactionDate: item.transaction_date
        ? item.transaction_date.toISOString()
        : "",
      description: item.description ?? "",
      amount: item.amount,
      debitAccount: {
        id: item.debit_id,
        code: item.debit_code ?? "",
        name: item.debit_name ?? ""
      },
      creditAccount: {
        id: item.credit_id,
        code: item.credit_code ?? "",
        name: item.credit_name ?? ""
      },
      category: {
        name: item.category_name ?? ""
      }
    }))
  };
});

export const generalLedgerViewHandler = requireAuth(async (event) => {
  const payload = generalLedgerViewSchema.parse(getQuery(event));
  const dateFrom = parseDateInput(payload.dateFrom);
  const dateTo = parseDateInput(payload.dateTo);

  if (!dateFrom || !dateTo) {
    setResponseStatus(event, 400);
    return { message: "Invalid date range" };
  }

  try {
    const ledgerView = await getGeneralLedgerView(
      event.context.db,
      payload.accountId,
      dateFrom,
      dateTo,
      event.context.currentUser!.id
    );

    return { data: ledgerView };
  } catch (error) {
    setResponseStatus(event, 404);
    return {
      message: error instanceof Error ? error.message : "Account not found"
    };
  }
});

export const updateGlDescriptionHandler = requireAuth(async (event) => {
  try {
  const params = getRouterParams(event);
    const body = await readBody(event);
    const description = typeof body?.description === "string" ? body.description : "";

    if (!description || description.trim().length === 0) {
      setResponseStatus(event, 400);
      return { message: "Description is required" };
    }

    if (description.length > 255) {
      setResponseStatus(event, 400);
      return { message: "Description must be less than 255 characters" };
    }

    const glTransaction = await event.context.db
      .selectFrom("transactions")
      .selectAll()
      .where("id", "=", Number(params["id"]))
      .where("user_id", "=", event.context.currentUser!.id)
      .where("book_type", "=", "general_ledger")
      .where("gl_id", "is", null)
      .executeTakeFirst();

    if (!glTransaction) {
      setResponseStatus(event, 404);
      return { message: "GL transaction not found" };
    }

    await event.context.db
      .updateTable("transactions")
      .set({ description: description.trim() })
      .where("id", "=", glTransaction.id)
      .execute();

    return {
      message: "GL transaction description updated successfully",
      data: {
        id: glTransaction.id,
        description: description.trim()
      }
    };
  } catch {
    setResponseStatus(event, 400);
    return { message: "Failed to update GL transaction description" };
  }
});
