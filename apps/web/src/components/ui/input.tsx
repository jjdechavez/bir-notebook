import * as React from 'react'

import { cn } from '@/lib/utils'

function Input({ className, type, ...props }: React.ComponentProps<'input'>) {
  return (
    <input
      type={type}
      data-slot="input"
      className={cn(
        'file:text-foreground placeholder:text-muted-foreground selection:bg-primary selection:text-primary-foreground dark:bg-input/30 border-input h-9 w-full min-w-0 rounded-md border bg-transparent px-3 py-1 text-base shadow-xs transition-[color,box-shadow] outline-none file:inline-flex file:h-7 file:border-0 file:bg-transparent file:text-sm file:font-medium disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 md:text-sm',
        'focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]',
        'aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive',
        className,
      )}
      {...props}
    />
  )
}

function DebounceInput({
  value: initialValue,
  className,
  debounce = 1000,
  onChange,
  ...props
}: Omit<React.ComponentProps<'input'>, 'onChange'> & {
  debounce?: number
  onChange: (value: string | number) => void
}) {
  const [value, setValue] = React.useState(initialValue)
  const debounced = useDebouncedCallback((value) => onChange(value), debounce)

  React.useEffect(() => {
    setValue(initialValue)
  }, [initialValue])

  return (
    <Input
      className={cn(className)}
      value={value}
      onChange={(e) => {
        if (e.target.value === '') {
          setValue('')
          return debounced('')
        }
        if (props.type === 'number') {
          setValue(e.target.valueAsNumber)
          debounced(e.target.valueAsNumber)
        } else {
          setValue(e.target.value)
          debounced(e.target.value)
        }
      }}
      {...props}
    />
  )
}

export { Input, DebounceInput }
