import type { Selectable } from "kysely";
import type { ChartOfAccountsTable } from "../db/types.js";
import { toIsoString } from "../utils/date.js";

export function serializeAccount(
  account: Selectable<ChartOfAccountsTable>
) {
  return {
    id: account.id,
    code: account.code,
    name: account.name,
    type: account.type,
    createdAt: toIsoString(account.created_at),
    updatedAt: toIsoString(account.updated_at),
    deletedAt: toIsoString(account.deleted_at)
  };
}
