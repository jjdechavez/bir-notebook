import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { MoreHorizontal, Check, X } from 'lucide-react'
import type { Transaction } from '@/types/transaction'

interface TransactionActionsProps {
  transaction: Transaction
  onRecord: () => void
  onUndo: () => void
}

export function TransactionActions({ transaction, onRecord, onUndo }: TransactionActionsProps) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="h-8 w-8 p-0">
          <MoreHorizontal className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {transaction.recorded ? (
          <DropdownMenuItem onClick={onUndo} className="text-orange-600">
            <X className="mr-2 h-4 w-4" />
            Undo Record
          </DropdownMenuItem>
        ) : (
          <DropdownMenuItem onClick={onRecord} className="text-blue-600">
            <Check className="mr-2 h-4 w-4" />
            Record Transaction
          </DropdownMenuItem>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}