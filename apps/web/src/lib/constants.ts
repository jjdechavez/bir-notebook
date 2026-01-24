// Re-export constants from data-table.ts to maintain consistency
export { DEFAULT_PAGE_INDEX, DEFAULT_PAGE_SIZE } from '@/components/data-table'

// Default meta for tables without pagination
export const DEFAULT_LIST_META = {
  total: 0,
  perPage: 10,
  currentPage: 1,
  lastPage: 1,
  firstPage: 1,
  firstPageUrl: '',
  lastPageUrl: '',
  nextPageUrl: '',
  previousPageUrl: '',
}

// Re-export ListMeta type for consistency
export type { ListMeta } from '@/components/data-table'