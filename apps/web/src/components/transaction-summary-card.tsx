import { cva, type VariantProps } from 'class-variance-authority'
import { Card, CardContent } from './ui/card'
import { cn } from '@/lib/utils'
import type { LucideIcon } from 'lucide-react'

const transactionCardVariants = cva('', {
  variants: {
    variant: {
      income: 'text-green-600 dark:text-green-500',
      expense: 'text-red-600 dark:text-red-500',
      passiveNetIncome: 'text-green-600 dark:text-green-500',
      negativeNetIncome: 'text-red-600 dark:text-red-500',
      categories: 'text-purple-600 dark:text-purple-500',
    },
  },
  defaultVariants: {
    variant: 'income',
  },
})

export function TransactionCard({
  title,
  description,
  variant,
  icon: IconComponent,
}: {
  title: string
  description: string
  icon: LucideIcon
} & VariantProps<typeof transactionCardVariants>) {
  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-foreground">{title}</p>
            <p
              className={cn(
                'text-2xl font-bold',
                transactionCardVariants({ variant }),
              )}
            >
              {description}
            </p>
          </div>
          <IconComponent
            className={cn('h-8 w-8', transactionCardVariants({ variant }))}
          />
        </div>
      </CardContent>
    </Card>
  )
}
