import { Link, useLocation } from "@tanstack/react-router"
import { Button } from "@/components/ui/button"
import { useCorProfile } from "@/hooks/api/cor"

const EXEMPT_PREFIXES = ["/onboarding", "/settings"]

export function TaxProfileNudge() {
	const location = useLocation()
	const { data, isPending, isError } = useCorProfile()

	if (isPending || isError) return null
	if (EXEMPT_PREFIXES.some((p) => location.pathname.startsWith(p))) {
		return null
	}
	const profile = (
		data as unknown as { data?: { profile: unknown } } | undefined
	)?.data?.profile
	if (profile) return null

	return (
		<div className="flex flex-wrap items-center justify-between gap-2 rounded-md border border-amber-500 bg-amber-50 px-4 py-2 text-sm dark:bg-amber-950">
			<span>
				No tax profile yet — tell us about your COR to unlock filing reminders
				and the Q3 worksheet.
			</span>
			<Button size="sm" asChild>
				<Link to="/onboarding/cor">Set up tax profile</Link>
			</Button>
		</div>
	)
}
