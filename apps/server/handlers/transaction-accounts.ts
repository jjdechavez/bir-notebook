import { requireAuth } from "../middleware/auth.js";
import type { Selectable } from "kysely";
import type { ChartOfAccounts } from "../db/types.js";
import { getUsedChartOfAccounts } from "../services/transactions.js";
import { serializeAccount } from "../serializers/account.js";
import { defineEventHandler } from "h3";

export const listTransactionAccounts = defineEventHandler({
  onRequest: [requireAuth()],
  handler: async (event) => {
    const accounts: Array<Selectable<ChartOfAccounts>> = await event.context.db
      .selectFrom("chart_of_accounts")
      .selectAll()
      .where("deleted_at", "is", null)
      .orderBy("type")
      .orderBy("name")
      .execute();

    return {
      data: accounts.map((account) => serializeAccount(account as any)),
    };
  },
});

export const currentChartOfAccounts = defineEventHandler({
  onRequest: [requireAuth()],
  handler: async (event) => {
    const accounts = await getUsedChartOfAccounts(
      event.context.db,
      event.context.currentUser!.id,
    );

    return {
      data: accounts.map((account) => serializeAccount(account as any)),
    };
  },
});
