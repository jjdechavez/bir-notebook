import type { Selectable } from "kysely";
import type { UserPreferenceTable } from "../db/types.js";
import { toIsoString } from "../utils/date.js";

export function serializeUserPreference(
  preference: Selectable<UserPreferenceTable>
) {
  return {
    id: preference.id,
    userId: preference.user_id,
    navigationLayout: preference.navigation_layout,
    theme: preference.theme,
    createdAt: toIsoString(preference.created_at),
    updatedAt: toIsoString(preference.updated_at)
  };
}
