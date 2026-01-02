import { useEffect, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
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
import type { TransactionCategory } from '@/types/transaction'

interface SelectTransactionCategoryProps {
  value?: number | null
  onChange?: (item: TransactionCategory | null) => void
  placeholder?: string
}

export function SelectTransactionCategory({
  value,
  onChange,
  placeholder = 'Select category...',
}: SelectTransactionCategoryProps) {
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

  const { data } = useQuery(
    tuyau.api['transaction-categories']['$get'].queryOptions({
      payload,
    }),
  )

  const categories: TransactionCategory[] = data?.data || []
  const selected = categories.find((category) => category.id === value)

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="justify-between"
        >
          {selected ? selected.name : placeholder}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="p-0" align="start">
        <Command>
          <CommandInput
            placeholder="Search category..."
            value={search}
            onValueChange={setSearch}
          />
          <CommandEmpty>No role found.</CommandEmpty>
          <CommandGroup>
            {categories.map((category) => (
              <CommandItem
                key={category.id}
                value={category.name}
                onSelect={() => {
                  onChange?.(category)
                  setOpen(false)
                }}
              >
                <Check
                  className={cn(
                    'mr-2 h-4 w-4',
                    value === category.id ? 'opacity-100' : 'opacity-0',
                  )}
                />
                {category.name}
              </CommandItem>
            ))}
          </CommandGroup>
        </Command>
      </PopoverContent>
    </Popover>
  )
}
