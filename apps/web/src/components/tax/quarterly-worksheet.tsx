import { formatCentsToCurrency } from "@bir-notebook/shared/helpers/currency"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table"
import { useCopyToClipboard } from "@/hooks/use-copy-to-clipboard"

export type WorksheetItems = Record<string, number>

export type QuarterMeta = {
	quarter: number
	label: string
	rangeLabel: string
	dueLabel: string
	ebirQuarter: string
	priorLabel: string
}

export const QUARTER_METAS: QuarterMeta[] = [
	{
		quarter: 1,
		label: "Q1",
		rangeLabel: "Jan 1 – Mar 31",
		dueLabel: "May 15",
		ebirQuarter: "1st",
		priorLabel: "No prior quarters (first filing of the year)",
	},
	{
		quarter: 2,
		label: "Q2",
		rangeLabel: "Apr 1 – Jun 30",
		dueLabel: "Aug 15",
		ebirQuarter: "2nd",
		priorLabel: "Prior quarter cumulative (Q1 Item 51)",
	},
	{
		quarter: 3,
		label: "Q3",
		rangeLabel: "Jul 1 – Sep 30",
		dueLabel: "Nov 15",
		ebirQuarter: "3rd",
		priorLabel: "Prior quarters cumulative (Q1+Q2 Item 51)",
	},
]

function peso(cents: number | undefined): string {
	return formatCentsToCurrency(cents ?? 0)
}

const ROWS: Array<{ item: string; label: string; key: string }> = [
	{ item: "47", label: "Sales / Receipts this quarter (net)", key: "i47" },
	{ item: "48", label: "Non-operating income", key: "i48" },
	{ item: "49", label: "Total income this quarter (47+48)", key: "i49" },
	{ item: "50", label: "Prior quarters cumulative (Item 51)", key: "i50" },
	{ item: "51", label: "Cumulative taxable as of this quarter", key: "i51" },
	{ item: "52", label: "Less: ₱250k allowance remaining", key: "i52" },
	{ item: "53", label: "Taxable to date (51−52)", key: "i53" },
	{ item: "54 → 26", label: "Tax due (53 × 8%, BIR rounded)", key: "i54" },
	{
		item: "27",
		label: "Less: credits — prior paid (56) + 2307 (58)",
		key: "i27",
	},
	{ item: "28", label: "Tax payable (26−27)", key: "i28" },
	{ item: "64", label: "Add: surcharge", key: "i64" },
	{ item: "65", label: "Add: interest", key: "i65" },
	{ item: "66", label: "Add: compromise", key: "i66" },
	{ item: "67", label: "Total penalties (64+65+66)", key: "i67" },
	{ item: "30", label: "Total amount payable (28+67)", key: "i30" },
]

export function QuarterlyWorksheet({
	year,
	meta,
	items,
	sourceCount,
	recordedGross,
	overrideGross,
	onSave,
	onMarkFiled,
	isSaving,
}: {
	year: number
	meta: QuarterMeta
	items: WorksheetItems
	sourceCount: number
	recordedGross: number
	overrideGross: number | null
	onSave: () => void
	onMarkFiled: () => void
	isSaving?: boolean
}) {
	const { copyToClipboard } = useCopyToClipboard()
	const ebirText = [
		`1701Q ${year} ${meta.ebirQuarter} quarter`,
		...ROWS.map((r) => `Item ${r.item}: ${peso(items[r.key])}`),
	].join("\n")

	return (
		<Card>
			<CardHeader className="flex flex-row items-center justify-between">
				<CardTitle className="text-base">
					1701Q Schedule II (8%) — {meta.label} {year}
					<span className="ml-2 text-xs font-normal text-muted-foreground">
						{overrideGross !== null ? (
							<>
								books sum {peso(recordedGross)} · using manual total{" "}
								{peso(overrideGross)}
							</>
						) : (
							<>
								{peso(recordedGross)} from {sourceCount} recorded rows ·{" "}
								{meta.rangeLabel}
							</>
						)}
					</span>
				</CardTitle>
				<div className="flex gap-2">
					<Button
						variant="outline"
						size="sm"
						onClick={() => copyToClipboard(ebirText)}
					>
						Copy for eBIRForms
					</Button>
					<Button size="sm" onClick={onSave} disabled={isSaving}>
						Save draft
					</Button>
					<Button size="sm" variant="secondary" onClick={onMarkFiled}>
						Mark filed
					</Button>
				</div>
			</CardHeader>
			<CardContent>
				<Table>
					<TableHeader>
						<TableRow>
							<TableHead>Item</TableHead>
							<TableHead>Description</TableHead>
							<TableHead className="text-right">Amount</TableHead>
						</TableRow>
					</TableHeader>
					<TableBody>
						{ROWS.map((r) => (
							<TableRow key={r.key}>
								<TableCell>
									<Badge variant="outline">{r.item}</Badge>
								</TableCell>
								<TableCell>{r.label}</TableCell>
								<TableCell className="text-right font-mono">
									{peso(items[r.key])}
								</TableCell>
							</TableRow>
						))}
					</TableBody>
				</Table>
				<p className="mt-3 text-xs text-muted-foreground">
					BIR rounding: 49 centavos or less drop down, 50+ round up. ATC II017
					(Profession, 8%). If payable is ₱0, filing the return is enough — keep
					the eBIRForms email confirmation.
				</p>
			</CardContent>
		</Card>
	)
}
