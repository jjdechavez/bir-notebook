import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export function EightPctBanner() {
	return (
		<Card className="border-green-600/40 bg-green-50 dark:bg-green-950">
			<CardHeader className="pb-2">
				<CardTitle className="flex items-center gap-2 text-sm">
					8% Income Tax Regime
					<Badge variant="secondary">II017</Badge>
				</CardTitle>
			</CardHeader>
			<CardContent className="text-sm text-muted-foreground">
				Your COR shows no Percentage Tax row and 8% elected. Do{" "}
				<strong>not</strong> file BIR Form 2551Q. File only 1701Q quarterly +
				1701A annually. Re-elect 8% every January or you revert to graduated
				rates automatically.
			</CardContent>
		</Card>
	)
}
