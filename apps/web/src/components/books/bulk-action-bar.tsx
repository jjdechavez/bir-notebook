import { Button } from '@/components/ui/button'
import { Check, X } from 'lucide-react'

interface BulkActionBarProps {
  selectedCount: number
  onRecordSelected?: () => void
  onUndoSelected?: () => void
  onClearSelection?: () => void
}

export function BulkActionBar({ 
  selectedCount, 
  onRecordSelected, 
  onUndoSelected, 
  onClearSelection 
}: BulkActionBarProps) {
  if (selectedCount === 0) return null

  return (
    <div className="fixed bottom-6 left-1/2 transform -translate-x-1/2 bg-white border rounded-lg shadow-lg p-4 flex items-center gap-4 z-50">
      <span className="text-sm font-medium">
        {selectedCount} {selectedCount === 1 ? 'transaction' : 'transactions'} selected
      </span>
      
      <div className="flex gap-2">
        <Button
          variant="outline"
          size="sm"
          className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
          onClick={onRecordSelected}
        >
          <Check className="h-4 w-4 mr-2" />
          Record Selected
        </Button>
        
        <Button
          variant="outline"
          size="sm"
          className="text-orange-600 hover:text-orange-700 hover:bg-orange-50"
          onClick={onUndoSelected}
        >
          <X className="h-4 w-4 mr-2" />
          Undo Selected
        </Button>
        
        <Button
          variant="ghost"
          size="sm"
          onClick={onClearSelection}
        >
          Clear
        </Button>
      </div>
    </div>
  )
}