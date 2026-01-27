import { useState } from 'react'
import { useInfiniteQuery } from '@tanstack/react-query'
import { Loader2 } from 'lucide-react'
import { useDebounce } from 'use-debounce'

import {
  Combobox,
  ComboboxChip,
  ComboboxChips,
  ComboboxChipsInput,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxInput,
  ComboboxItem,
  ComboboxList,
} from '@/components/ui/combobox'
import { tuyau } from '@/main'
import type { TransactionCategory } from '@/types/transaction'
import { useInfiniteScroll } from '@/hooks/use-infinite-scroll'

interface SelectTransactionCategoryProps {
  multiple?: boolean
  value?: number | null | number[]
  onChange?: (value: number | number[] | null) => void
  placeholder?: string
}

export function SelectTransactionCategory({
  multiple = false,
  value,
  onChange,
  placeholder = 'Select category...',
}: SelectTransactionCategoryProps) {
  const [search, setSearch] = useState('')
  const [debouncedSearch] = useDebounce(search, 1000)

  const { data, hasNextPage, fetchNextPage, isFetchingNextPage } =
    useInfiniteQuery(
      tuyau.api['transaction-categories']['$get'].infiniteQueryOptions(
        {
          payload: {
            s: debouncedSearch,
            limit: 50,
          },
        },
        {
          initialPageParam: 1,
          getNextPageParam: (lastPage) => {
            if (lastPage.meta.currentPage === lastPage.meta.lastPage) {
              return null
            }
            return lastPage.meta.currentPage + 1
          },
          getPreviousPageParam: (firstPage) => firstPage.meta.currentPage - 1,
          pageParamKey:
            tuyau.api['transaction-categories'].$get.infiniteQueryKey(),
        },
      ),
    )

  const categories: TransactionCategory[] =
    data?.pages.flatMap((page) => page.data) || []

  const selectedSingle = !multiple
    ? categories.find((category) => category.id === value)
    : null

  const selectedMultiple = multiple
    ? categories.filter(
        (category) => Array.isArray(value) && value.includes(category.id),
      )
    : []

  const lastItemRef = useInfiniteScroll(
    hasNextPage,
    fetchNextPage,
    isFetchingNextPage,
  )

  const handleSingleChange = (selectedValue: number | null) => {
    if (selectedValue == null) {
      onChange?.(null)
      return
    }

    onChange?.(selectedValue)
  }

  const handleMultipleChange = (selectedValues: number[]) => {
    onChange?.(selectedValues)
  }

  return (
    <Combobox<TransactionCategory, boolean>
      multiple={multiple}
      value={multiple ? selectedMultiple : selectedSingle}
      onValueChange={(newValue) => {
        if (multiple) {
          const valueMultiple = (newValue ?? []) as unknown as number[]
          handleMultipleChange(valueMultiple)
        } else {
          const value = (newValue ?? null) as unknown as number | null
          if (value === null) {
            onChange?.(null)
          } else {
            handleSingleChange(value)
          }
        }
      }}
      items={categories}
    >
      {multiple ? (
        <ComboboxChips>
          {selectedMultiple.map((category) => (
            <ComboboxChip key={category.id}>{category.name}</ComboboxChip>
          ))}
          <ComboboxChipsInput
            placeholder={placeholder}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </ComboboxChips>
      ) : (
        <ComboboxInput
          placeholder={placeholder}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          showTrigger
          showClear={!!selectedSingle}
        />
      )}
      <ComboboxContent>
        <ComboboxEmpty>No category found.</ComboboxEmpty>
        <ComboboxList className="max-h-[400px]">
          {categories.map((category, index) => (
            <ComboboxItem
              key={category.id}
              value={category.id}
              ref={index === categories.length - 1 ? lastItemRef : undefined}
            >
              {category.name}
            </ComboboxItem>
          ))}
          {isFetchingNextPage && (
            <div className="flex items-center justify-center p-2">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span className="ml-2 text-sm text-muted-foreground">
                Loading more...
              </span>
            </div>
          )}
        </ComboboxList>
      </ComboboxContent>
    </Combobox>
  )
}
