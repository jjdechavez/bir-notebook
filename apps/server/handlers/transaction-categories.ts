import {
  defineEventHandler,
  getQuery,
  getRequestURL,
  getRouterParams,
  setResponseStatus,
} from "h3";
import { transactionCategoryQuerySchema } from "../validators/transaction.js";
import { serializeTransactionCategory } from "../serializers/transaction-category.js";
import { requireAuth } from "../middleware/auth.js";
import { buildPaginationMeta } from "../utils/pagination.js";
import type { Selectable } from "kysely";
import type { ChartOfAccounts, TransactionCategories } from "../db/types.js";

export const listTransactionCategories = defineEventHandler({
  onRequest: [requireAuth()],
  handler: async (event) => {
    const query = transactionCategoryQuerySchema.parse(getQuery(event));
    const page = query.page ?? 1;
    const limit = query.limit ?? 10;
    const offset = (page - 1) * limit;
    const search = query.s ?? "";

    let base = event.context.db
      .selectFrom("transaction_categories")
      .where("deleted_at", "is", null);

    if (search.length > 0) {
      base = base.where("name", "ilike", `%${search}%`);
    }

    const totalResult = await base
      .select((eb) => eb.fn.count<number>("id").as("total"))
      .executeTakeFirst();
    const total = Number(totalResult?.total ?? 0);

    let categoriesQuery = event.context.db
      .selectFrom("transaction_categories")
      .selectAll()
      .where("deleted_at", "is", null);

    if (search.length > 0) {
      categoriesQuery = categoriesQuery.where("name", "ilike", `%${search}%`);
    }

    const categories: Array<Selectable<TransactionCategories>> =
      await categoriesQuery
        .orderBy("name")
        .limit(limit)
        .offset(offset)
        .execute();

    const accountIds = [
      ...categories
        .map((category) => category.default_debit_account_id)
        .filter(Boolean),
      ...categories
        .map((category) => category.default_credit_account_id)
        .filter(Boolean),
    ] as number[];

    const accounts: Array<Selectable<ChartOfAccounts>> = accountIds.length
      ? await event.context.db
          .selectFrom("chart_of_accounts")
          .selectAll()
          .where("id", "in", accountIds)
          .execute()
      : [];

    const accountMap = new Map(
      accounts.map((account) => [account.id, account]),
    );

    const url = getRequestURL(event);
    const baseUrl = `${url.origin}${url.pathname}`;

    return {
      data: categories.map((category) =>
        serializeTransactionCategory(
          category as any,
          category.default_debit_account_id
            ? ((accountMap.get(category.default_debit_account_id) as any) ??
                null)
            : null,
          category.default_credit_account_id
            ? ((accountMap.get(category.default_credit_account_id) as any) ??
                null)
            : null,
        ),
      ),
      meta: buildPaginationMeta(total, limit, page, baseUrl),
    };
  },
});

export const getTransactionCategoryDefaults = defineEventHandler({
  onRequest: [requireAuth()],
  handler: async (event) => {
    const params = getRouterParams(event);
    const category = await event.context.db
      .selectFrom("transaction_categories")
      .selectAll()
      .where("id", "=", Number(params["id"]))
      .executeTakeFirst();

    if (!category) {
      setResponseStatus(event, 404);
      return { message: "Transaction category not found" };
    }

    const accounts = await event.context.db
      .selectFrom("chart_of_accounts")
      .selectAll()
      .where(
        "id",
        "in",
        [
          category.default_debit_account_id,
          category.default_credit_account_id,
        ].filter(Boolean) as number[],
      )
      .execute();
    const accountMap = new Map(
      accounts.map((account) => [account.id, account]),
    );

    return serializeTransactionCategory(
      category as any,
      category.default_debit_account_id
        ? ((accountMap.get(category.default_debit_account_id) as any) ?? null)
        : null,
      category.default_credit_account_id
        ? ((accountMap.get(category.default_credit_account_id) as any) ?? null)
        : null,
    );
  },
});
