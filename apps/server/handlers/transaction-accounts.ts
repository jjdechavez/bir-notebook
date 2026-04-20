import { defineEventHandler, getQuery } from "h3";

import { requireAuth } from "../middleware/auth.js";
import { getUsedChartOfAccounts } from "../services/transactions.js";
import { serializeAccount } from "../serializers/account.js";

export const listChartOfAccounts = defineEventHandler({
  onRequest: [requireAuth()],
  handler: async (event) => {
    const query = getQuery(event);
    const search = typeof query["s"] === "string" ? query["s"] : "";
    const page = Number(query["page"] ?? 1);
    const limit = Number(query["limit"] ?? 10);
    const offset = (page - 1) * limit;

    let accounts = event.context.db
      .selectFrom("chart_of_accounts")
      .selectAll()
      .where("deleted_at", "is", null)

    if (search) {
      accounts = accounts.where("name", "ilike", `%${search}%`)
    }

    const result = await accounts
      .orderBy("name asc")
      .limit(limit)
      .offset(offset)
      .execute()

    return {
      data: result.map((account) => serializeAccount(account)),
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
      data: accounts.map((account) => serializeAccount(account)),
    };
  },
});
