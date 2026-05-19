import { ArrowRight } from "lucide-react"

export function TransferedGLBadge() {
	return (
		<span className="text-sm bg-highlight text-highlight-foreground flex items-center gap-x-1 px-2 rounded">
			<ArrowRight className="w-3 h-3" />
			GL
		</span>
	)
}
