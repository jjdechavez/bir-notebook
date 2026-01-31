import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { MoreHorizontal } from 'lucide-react'
import type { Transaction } from '@/types/transaction'

interface TransactionActionsProps {
  transaction: Transaction
  onRecord: () => void
  onUndo: () => void
}

export function TransactionActions({
  transaction,
  onRecord,
  onUndo,
}: TransactionActionsProps) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="h-8 w-8 p-0">
          <MoreHorizontal className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {transaction.recorded ? (
          <DropdownMenuItem onClick={onUndo}>Undo Record</DropdownMenuItem>
        ) : (
          <DropdownMenuItem onClick={onRecord}>
            Record Transaction
          </DropdownMenuItem>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
