import { Check, X } from "lucide-react"
import { Button } from "@/components/ui/button"

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
	onClearSelection,
}: BulkActionBarProps) {
	if (selectedCount === 0) return null

	return (
		<div className="fixed inset-x-4 bottom-4 z-50 mx-auto flex max-w-fit items-center gap-4 rounded-lg border border-border bg-background/95 p-3 text-foreground shadow-xl shadow-black/10 backdrop-blur supports-[backdrop-filter]:bg-background/85 dark:shadow-black/30 sm:inset-x-auto sm:bottom-6 sm:p-4">
			<span className="text-sm font-medium text-foreground">
				{selectedCount} {selectedCount === 1 ? "transaction" : "transactions"}{" "}
				selected
			</span>

			<div className="flex gap-2">
				<Button
					variant="outline"
					size="sm"
					onClick={onRecordSelected}
					className="bg-background hover:bg-accent"
				>
					<Check className="h-4 w-4 mr-2" />
					Record Selected
				</Button>

				<Button
					variant="outline"
					size="sm"
					onClick={onUndoSelected}
					className="bg-background hover:bg-accent"
				>
					<X className="h-4 w-4 mr-2" />
					Undo Selected
				</Button>

				<Button variant="ghost" size="sm" onClick={onClearSelection}>
					Clear
				</Button>
			</div>
		</div>
	)
}
