import { useState } from 'react'
import { useInfiniteQuery } from '@tanstack/react-query'
import { Loader2, X, ChevronDown } from 'lucide-react'
import { useDebounce } from 'use-debounce'

import {
  CommandInput,
  CommandList,
  CommandEmpty,
  CommandGroup,
  CommandItem,
  Command,
} from '@/components/ui/command'
import { Badge } from '@/components/ui/badge'
import { tuyau } from '@/main'
import type { TransactionCategory } from '@/types/transaction'
import { useInfiniteScroll } from '@/hooks/use-infinite-scroll'
import { cn } from '@/lib/utils'

type SelectTransactionCategoryProps = {
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
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState('')
  const [debouncedSearch] = useDebounce(search, 1000)

  const { data, hasNextPage, fetchNextPage, isFetchingNextPage } =
    useInfiniteQuery(
      tuyau.api['transaction-categories']['$get'].infiniteQueryOptions(
        {
          payload: {
            s: debouncedSearch,
            limit: 20,
          },
        },
        {
          pageParamKey: 'page',
          initialPageParam: 1,
          getNextPageParam: (lastPage) => {
            if (lastPage.meta.currentPage === lastPage.meta.lastPage) {
              return undefined
            }
            return lastPage.meta.currentPage + 1
          },
          getPreviousPageParam: (firstPage) => firstPage.meta.currentPage - 1,
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
      setSearch('')
      return
    }
    onChange?.(selectedValue)
  }

  const handleMultipleChange = (selectedValues: number[]) => {
    onChange?.(selectedValues)
  }

  const handleToggleMultiple = (categoryId: number) => {
    if (!Array.isArray(value)) return

    const newValue = value.includes(categoryId)
      ? value.filter((id) => id !== categoryId)
      : [...value, categoryId]

    handleMultipleChange(newValue)
  }

  const handleRemoveMultiple = (categoryId: number) => {
    if (!Array.isArray(value)) return

    const newValue = value.filter((id) => id !== categoryId)
    handleMultipleChange(newValue)
  }

  // // Keyboard navigation and dropdown management
  // useEffect(() => {
  //   const handleClickOutside = (event: MouseEvent) => {
  //     if (
  //       !event.target ||
  //       !(event.target as Element).closest('.select-category-container')
  //     ) {
  //       setOpen(false)
  //     }
  //   }

  //   const handleEscape = (event: KeyboardEvent) => {
  //     if (event.key === 'Escape') {
  //       setOpen(false)
  //     }
  //   }

  //   const handleKeyDown = (event: KeyboardEvent) => {
  //     if (!open) return

  //     // Arrow keys and Enter for navigation when dropdown is open
  //     if (
  //       event.key === 'ArrowDown' ||
  //       event.key === 'ArrowUp' ||
  //       event.key === 'Enter'
  //     ) {
  //       // Let cmdk handle keyboard navigation
  //       return
  //     }

  //     // Type to search when dropdown is open and not focused on input
  //     if (event.key.length === 1 && !event.ctrlKey && !event.metaKey) {
  //       const input = document.querySelector(
  //         '.select-category-container input[placeholder*="Search"]',
  //       ) as HTMLInputElement
  //       if (input && document.activeElement !== input) {
  //         input.focus()
  //         input.value += event.key
  //         setSearch(input.value)
  //       }
  //     }
  //   }

  //   if (open) {
  //     document.addEventListener('mousedown', handleClickOutside)
  //     document.addEventListener('keydown', handleEscape)
  //     document.addEventListener('keydown', handleKeyDown)
  //   }

  //   return () => {
  //     document.removeEventListener('mousedown', handleClickOutside)
  //     document.removeEventListener('keydown', handleEscape)
  //     document.removeEventListener('keydown', handleKeyDown)
  //   }
  // }, [open, setSearch])

  return (
    <div className="select-category-container relative">
      <div onClick={() => setOpen((prev) => !prev)}>
        {multiple ? (
          <div className="min-h-9 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background cursor-pointer hover:bg-accent/50 transition-colors">
            <div className="flex flex-wrap gap-1">
              {selectedMultiple.map((category) => (
                <Badge
                  key={category.id}
                  variant="secondary"
                  className="flex items-center gap-1"
                >
                  {category.name}
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation()
                      handleRemoveMultiple(category.id)
                    }}
                    className="ml-1 rounded-sm hover:bg-secondary-80"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              ))}
              <div className="text-muted-foreground">
                {selectedMultiple.length === 0
                  ? placeholder
                  : `${selectedMultiple.length} selected`}
              </div>
            </div>
          </div>
        ) : (
          <div className="relative cursor-pointer">
            <div className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 pr-8">
              {selectedSingle?.name || placeholder}
            </div>
            {(selectedSingle || search) && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation()
                  setSearch('')
                  handleSingleChange(null)
                }}
                className="absolute right-6 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                <X className="h-4 w-4" />
              </button>
            )}
            <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
          </div>
        )}
      </div>

      <div
        className={cn('absolute top-full left-0 right-0 z-50 mt-1', {
          hidden: !open,
        })}
      >
        <Command className="rounded-lg border shadow-lg bg-background">
          <CommandInput
            placeholder="Search categories..."
            value={search}
            onValueChange={setSearch}
            autoFocus
          />

          <CommandList>
            <CommandEmpty>
              {search ? 'No category found.' : 'Start typing to search...'}
            </CommandEmpty>

            {categories.length > 0 && (
              <CommandGroup>
                {categories.map((category, index) => {
                  const isLast = index === categories.length - 1
                  return (
                    <CommandItem
                      key={category.id}
                      ref={
                        isLast
                          ? (node) => {
                              if (node) {
                                lastItemRef.current = node
                              }
                            }
                          : undefined
                      }
                      value={category.name}
                      onSelect={() => {
                        if (multiple) {
                          handleToggleMultiple(category.id)
                        } else {
                          handleSingleChange(category.id)
                          setOpen(false)
                        }
                      }}
                    >
                      {category.name}
                      {((multiple &&
                        Array.isArray(value) &&
                        value.includes(category.id)) ||
                        (!multiple && value === category.id)) && (
                        <div className="ml-auto flex h-4 w-4 items-center justify-center">
                          <div className="h-2 w-2 rounded-full bg-current" />
                        </div>
                      )}
                    </CommandItem>
                  )
                })}

                {isFetchingNextPage && (
                  <div className="flex items-center justify-center p-4">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span className="ml-2 text-sm text-muted-foreground">
                      Loading more...
                    </span>
                  </div>
                )}
              </CommandGroup>
            )}
          </CommandList>
        </Command>
      </div>
    </div>
  )
}
