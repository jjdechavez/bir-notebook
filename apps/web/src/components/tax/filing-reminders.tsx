import { Link } from "@tanstack/react-router"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useFilings } from "@/hooks/api/cor"

function daysLeft(due: string | null): string {
	if (!due) return ""
	const ms = new Date(`${due}T00:00:00Z`).getTime() - Date.now()
	const d = Math.ceil(ms / 86400000)
	if (d < 0) return `${Math.abs(d)}d overdue`
	if (d === 0) return "due today"
	return `${d}d left`
}

export function FilingReminders() {
	const { data, isPending } = useFilings()
	const filings =
		(data as unknown as { data: Array<Record<string, unknown>> })?.data ?? []

	if (isPending) return null
	const upcoming = filings.filter(
		(f) => f.status !== "filed" && f.status !== "paid",
	)
	if (upcoming.length === 0) return null
	const urgent = upcoming.find((f) => f.overdue) ?? upcoming[0]
	const due = urgent.dueDate as string | null

	return (
		<Card className={urgent.overdue ? "border-red-500" : "border-amber-500"}>
			<CardHeader className="pb-2">
				<CardTitle className="flex items-center gap-2 text-sm">
					Filing reminder
					{urgent.overdue ? (
						<Badge variant="destructive">Overdue</Badge>
					) : (
						<Badge variant="secondary">{daysLeft(due)}</Badge>
					)}
				</CardTitle>
			</CardHeader>
			<CardContent className="text-sm">
				{String(urgent.formType)} {String(urgent.year)}
				{urgent.quarter ? ` Q${String(urgent.quarter)}` : ""} — due{" "}
				{due ?? "TBD"}
				<Link to="/taxes" className="ml-2 underline underline-offset-4">
					Open worksheet
				</Link>
			</CardContent>
		</Card>
	)
}
