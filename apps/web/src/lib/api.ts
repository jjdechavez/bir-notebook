import {
  DEFAULT_PAGE_INDEX,
  DEFAULT_PAGE_SIZE,
} from '@/components/data-table'

export type ListQueryParam = Partial<{
  page: number
  limit: number
}>

export type ListMeta = {
  total: number
  perPage: number
  currentPage: number
  lastPage: number
  firstPage: number
  previousPageUrl: string
  nextPageUrl: string
  firstPageUrl: string
  lastPageUrl: string
}

export const DEFAULT_LIST_META: ListMeta = {
  total: 0,
  perPage: 0,
  currentPage: 0,
  lastPage: 0,
  firstPage: 1,
  previousPageUrl: '',
  nextPageUrl: '',
  firstPageUrl: '',
  lastPageUrl: '',
}

export const cleanEmptyParams = <T extends Record<string, unknown>>(
  search: T,
) => {
  const newSearch = { ...search }
  Object.keys(newSearch).forEach((key) => {
    const value = newSearch[key]
    if (
      value === undefined ||
      value === '' ||
      (typeof value === 'number' && isNaN(value))
    )
      delete newSearch[key]
  })

  if (search.pageIndex === DEFAULT_PAGE_INDEX) delete newSearch.pageIndex
  if (search.pageSize === DEFAULT_PAGE_SIZE) delete newSearch.pageSize

  return newSearch
}
