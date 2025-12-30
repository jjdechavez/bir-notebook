import { useEffect, useState } from 'react'
import { useInfiniteQuery } from '@tanstack/react-query'
import { Check, ChevronsUpDown } from 'lucide-react'

import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
} from '@/components/ui/command'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { tuyau } from '@/main'

type Role = {
  id: number
  name: string
  createdAt: string
  updatedAt?: string
}

interface SelectRoleProps {
  value?: number | null
  onChange?: (role: Role | null) => void
  placeholder?: string
}

export function SelectRole({
  value,
  onChange,
  placeholder = 'Select role...',
}: SelectRoleProps) {
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search), 300)
    return () => clearTimeout(timer)
  }, [search])

  const payload = {
    s: debouncedSearch,
    limit: 100,
  }

  const { data, fetchNextPage, hasNextPage, isFetchingNextPage } =
    useInfiniteQuery(
      tuyau.api.roles.$get.infiniteQueryOptions(
        {
          payload,
        },
        {
          pageParamKey: 'roles-infinite',
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

  const roles = data?.pages.flatMap((page) => page.data) || []
  const selected = roles.find(role => role.id === value)

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-[200px] justify-between"
        >
          {selected ? selected.name : placeholder}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[200px] p-0">
        <Command>
          <CommandInput
            placeholder="Search role..."
            value={search}
            onValueChange={setSearch}
          />
          <CommandEmpty>No role found.</CommandEmpty>
          <CommandGroup>
            {roles.map((role) => (
              <CommandItem
                key={role.id}
                value={role.name}
                onSelect={() => {
                  onChange?.(role)
                  setOpen(false)
                }}
              >
                <Check
                  className={cn(
                    'mr-2 h-4 w-4',
                    value === role.id ? 'opacity-100' : 'opacity-0',
                  )}
                />
                {role.name}
              </CommandItem>
            ))}
          </CommandGroup>
          {hasNextPage && (
            <CommandItem
              onSelect={() => fetchNextPage()}
              disabled={isFetchingNextPage}
            >
              {isFetchingNextPage ? 'Loading...' : 'Load more'}
            </CommandItem>
          )}
        </Command>
      </PopoverContent>
    </Popover>
  )
}
