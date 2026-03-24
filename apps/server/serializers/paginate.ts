import { buildPaginationMeta } from "../utils/pagination.js";

export function serializePagination(
  total: number,
  page: number,
  limit: number,
  baseUrl: string
) {
  return buildPaginationMeta(total, limit, page, baseUrl);
}
