import { createFileRoute } from "@tanstack/react-router"
import {
	Calculator,
	Calendar,
	CheckCircle2,
	Clock,
	Copy,
	FileSpreadsheet,
	Loader2,
	Percent,
	ShieldAlert,
} from "lucide-react"
import { useState } from "react"
import { toast } from "sonner"
import { EightPctBanner } from "@/components/tax/eight-pct-banner"
import { FilingPacket } from "@/components/tax/filing-packet"
import { FilingReminders } from "@/components/tax/filing-reminders"
import {
	QUARTER_METAS,
	QuarterlyWorksheet,
} from "@/components/tax/quarterly-worksheet"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Field, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useFilings } from "@/hooks/api/cor"
import { api } from "@/lib/api"
import { getServerMessage } from "@/lib/api-error"
import type { FilingItem } from "@/lib/api/cor"

export const Route = createFileRoute("/(app)/taxes")({
	loader: () => ({ crumb: "Taxes" }),
	component: TaxesPage,
})

type Draft = {
	grossOverride: string
	priorCumulative51: string
	priorPaid: string
	withheld: string
	penaltySurcharge: string
	penaltyInterest: string
	penaltyCompromise: string
}

const EMPTY_DRAFT: Draft = {
	grossOverride: "",
	priorCumulative51: "0",
	priorPaid: "0",
	withheld: "0",
	penaltySurcharge: "0",
	penaltyInterest: "0",
	penaltyCompromise: "0",
}

function asRecord(v: unknown): Record<string, number> {
	if (v && typeof v === "object" && !Array.isArray(v)) {
		return v as Record<string, number>
	}
	if (typeof v === "string") {
		try {
			const parsed = JSON.parse(v) as unknown
			if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
				return parsed as Record<string, number>
			}
		} catch {
			// not JSON — ignore
		}
	}
	return {}
}

function num(v: unknown): number {
	return typeof v === "number" && Number.isFinite(v) ? v : 0
}

/** Pesos carried into `quarter` from saved prior-quarter filings, if any. */
function priorsFromFilings(
	filings: FilingItem[] | undefined,
	year: number,
	quarter: number,
): { priorCumulative51: number; priorPaid: number } | null {
	if (quarter === 1 || !filings) {
		return quarter === 1 ? { priorCumulative51: 0, priorPaid: 0 } : null
	}
	const prev = filings.find(
		(f) =>
			f.formType === "1701Q" &&
			f.year === year &&
			f.quarter === quarter - 1 &&
			f.computed,
	)
	if (!prev?.computed) return null
	const c = asRecord(prev.computed)
	const paidQuarters = filings.filter(
		(f) =>
			f.formType === "1701Q" &&
			f.year === year &&
			(f.quarter ?? 0) < quarter &&
			f.computed,
	)
	const priorPaid =
		paidQuarters.reduce((sum, f) => sum + num(asRecord(f.computed)["i28"]), 0) /
		100
	return {
		priorCumulative51: num(c["i51"]) / 100,
		priorPaid,
	}
}

export function TaxesPage() {
	const currentYear = new Date().getFullYear()
	const [year, setYear] = useState(currentYear)
	const [quarter, setQuarter] = useState(3)
	const [drafts, setDrafts] = useState<Record<string, Draft>>({})
	const [initialized, setInitialized] = useState<Record<string, boolean>>({})
	const [items, setItems] = useState<Record<string, number> | null>(null)
	const [sources, setSources] = useState<{
		count: number
		recordedGross: number
		overrideGross: number | null
	}>({ count: 0, recordedGross: 0, overrideGross: null })
	const [showPenalties, setShowPenalties] = useState(false)
	const [loading, setLoading] = useState(false)
	const { data: filingsData, refetch: refetchFilings } = useFilings()
	const filings = (filingsData as unknown as { data?: FilingItem[] })?.data

	const meta = QUARTER_METAS[quarter - 1] ?? QUARTER_METAS[2]!
	const key = `${year}-Q${quarter}`

	if (!initialized[key]) {
		const auto = priorsFromFilings(filings, year, quarter)
		setInitialized((m) => ({ ...m, [key]: true }))
		setDrafts((m) => ({
			...m,
			[key]: {
				...EMPTY_DRAFT,
				...(m[key] ?? {}),
				...(auto
					? {
							priorCumulative51: String(auto.priorCumulative51),
							priorPaid: String(auto.priorPaid),
						}
					: {}),
			},
		}))
	}
	const draft: Draft = drafts[key] ?? EMPTY_DRAFT

	const setDraft = (patch: Partial<Draft>) =>
		setDrafts((m) => ({ ...m, [key]: { ...draft, ...patch } }))

	function autofill() {
		const auto = priorsFromFilings(filings, year, quarter)
		if (!auto) {
			toast.message("No saved prior-quarter filings to copy from")
			return
		}
		setDraft({
			priorCumulative51: String(auto.priorCumulative51),
			priorPaid: String(auto.priorPaid),
		})
		toast.success(
			`Priors copied (Item 51 + paid tax${quarter > 2 ? " Q1–Q2" : ""})`,
		)
	}

	function optNumber(v: string): number | undefined {
		const n = Number(v)
		return v.trim() !== "" && Number.isFinite(n) && n >= 0 ? n : undefined
	}

	function buildQuery() {
		const q: Record<string, unknown> = {
			year,
			quarter,
			priorCumulative51: Number(draft.priorCumulative51) || 0,
			priorPaid: Number(draft.priorPaid) || 0,
			withheld2307: Number(draft.withheld) || 0,
			nonOperating: 0,
		}
		const override = optNumber(draft.grossOverride)
		if (override !== undefined) q["grossOverride"] = override
		if (showPenalties) {
			q["penaltySurcharge"] = Number(draft.penaltySurcharge) || 0
			q["penaltyInterest"] = Number(draft.penaltyInterest) || 0
			q["penaltyCompromise"] = Number(draft.penaltyCompromise) || 0
		}
		return q
	}

	async function compute() {
		setLoading(true)
		try {
			const res = (await api.tax.worksheet(
				buildQuery() as Parameters<typeof api.tax.worksheet>[0],
			)) as unknown as {
				data: {
					items: Record<string, number>
					sources: {
						count: number
						recordedGross: number
						overrideGross: number | null
					}
				}
			}
			setItems(res.data.items)
			setSources(res.data.sources)
		} catch (e) {
			toast.error(getServerMessage(e, "Couldn't compute the worksheet. Try again."))
		} finally {
			setLoading(false)
		}
	}

	async function save() {
		try {
			await api.tax.save(buildQuery() as Parameters<typeof api.tax.save>[0])
			refetchFilings()
			toast.success("Draft saved")
		} catch (e) {
			toast.error(getServerMessage(e, "Couldn't save your draft. Check your connection and try again."))
		}
	}

	async function markFiled() {
		try {
			await api.tax.markFiled(
				buildQuery() as Parameters<typeof api.tax.markFiled>[0],
			)
			refetchFilings()
			toast.success("Marked as filed — keep your eBIRForms email")
		} catch (e) {
			toast.error(getServerMessage(e, "Couldn't update the filing. Try again."))
		}
	}

	const activeFiling = filings?.find(
		(f) => f.formType === "1701Q" && f.year === year && f.quarter === quarter,
	)

	return (
		<div className="space-y-4">
			{/* Compact Top Header Bar */}
			<div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between border-b pb-3">
				<div>
					<div className="flex items-center gap-2">
						<h1 className="text-lg font-bold tracking-tight">
							Quarterly Income Tax
						</h1>
						<Badge
							variant="outline"
							className="font-mono text-[11px] border-primary/30 bg-primary/5 text-primary"
						>
							1701Q
						</Badge>
					</div>
				</div>

				<div className="flex items-center gap-2">
					<Badge variant="secondary" className="gap-1 py-0.5 text-xs">
						<Percent className="h-3 w-3 text-primary" /> 8% Flat Rate
					</Badge>
					{activeFiling?.status === "FILED" ? (
						<Badge className="bg-emerald-600 gap-1 text-xs">
							<CheckCircle2 className="h-3 w-3" /> Filed
						</Badge>
					) : (
						<Badge
							variant="outline"
							className="gap-1 text-xs border-amber-300 bg-amber-50 text-amber-800 dark:bg-amber-950/40 dark:text-amber-300"
						>
							<Clock className="h-3 w-3" /> Pending Return
						</Badge>
					)}
				</div>
			</div>

			{/* System Alerts */}
			<FilingReminders />

			{/* Two Column Grid Layout */}
			<div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
				{/* LEFT COLUMN: Main Form & Calculations (Span 7) */}
				<div className="space-y-4 lg:col-span-7">
					{/* Quarter & Year Controller */}
					<div className="flex items-center justify-between rounded-lg border bg-card p-3 shadow-2xs">
						<div className="flex items-center gap-2">
							<Field orientation="horizontal">
								<FieldLabel>Year</FieldLabel>
								<Input
									type="number"
									value={year}
									className="h-8 w-20 text-xs font-medium"
									onChange={(e) => {
										setYear(Number(e.target.value) || currentYear)
										setItems(null)
									}}
								/>
							</Field>

							<Tabs
								value={String(quarter)}
								onValueChange={(v) => {
									setQuarter(Number(v))
									setItems(null)
								}}
							>
								<TabsList className="h-8 p-0.5">
									{QUARTER_METAS.map((m) => (
										<TabsTrigger
											key={m.quarter}
											value={String(m.quarter)}
											className="h-7 px-2.5 text-xs font-medium"
										>
											{m.label}
										</TabsTrigger>
									))}
								</TabsList>
							</Tabs>
						</div>

						<span className="text-[11px] font-medium text-muted-foreground flex items-center gap-1">
							<Calendar className="h-3 w-3 text-primary" /> Due {meta.dueLabel},{" "}
							{year}
						</span>
					</div>

					{/* Worksheet Inputs Card */}
					<Card>
						<CardHeader className="py-3 border-b bg-muted/10">
							<div className="flex items-center justify-between">
								<CardTitle className="text-sm font-semibold flex items-center gap-1.5">
									<Calculator className="h-4 w-4 text-primary" />
									Inputs — {meta.label} {year}
								</CardTitle>
								{quarter > 1 && (
									<Button
										variant="ghost"
										size="sm"
										onClick={autofill}
										className="h-7 gap-1 text-[11px] text-primary"
									>
										<Copy className="h-3 w-3" /> Autofill Priors
									</Button>
								)}
							</div>
						</CardHeader>

						<CardContent className="p-4 space-y-4">
							{/* Section 1: Revenue */}
							<div className="space-y-2">
								<p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
									1. Gross Revenue
								</p>
								<div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
									<Field>
										<FieldLabel htmlFor="grossOverride" className="text-xs">
											Q{quarter} Gross Override (₱)
										</FieldLabel>
										<Input
											id="grossOverride"
											value={draft.grossOverride}
											placeholder="Auto calculated if empty"
											onChange={(e) =>
												setDraft({ grossOverride: e.target.value })
											}
											inputMode="decimal"
											className="h-8 text-xs"
										/>
									</Field>

									<Field>
										<FieldLabel htmlFor="prior51" className="text-xs">
											Prior Cumulative Item 51 (₱)
										</FieldLabel>
										<Input
											id="prior51"
											value={draft.priorCumulative51}
											disabled={quarter === 1}
											onChange={(e) =>
												setDraft({ priorCumulative51: e.target.value })
											}
											inputMode="decimal"
											className="h-8 text-xs"
										/>
									</Field>
								</div>
							</div>

							{/* Section 2: Credits */}
							<div className="space-y-2 pt-1 border-t">
								<p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
									2. Tax Credits
								</p>
								<div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
									<Field>
										<FieldLabel htmlFor="priorPaid" className="text-xs">
											Prior Tax Paid Item 56 (₱)
										</FieldLabel>
										<Input
											id="priorPaid"
											value={draft.priorPaid}
											disabled={quarter === 1}
											onChange={(e) => setDraft({ priorPaid: e.target.value })}
											inputMode="decimal"
											className="h-8 text-xs"
										/>
									</Field>

									<Field>
										<FieldLabel htmlFor="withheld" className="text-xs">
											Form 2307 Withheld Item 58 (₱)
										</FieldLabel>
										<Input
											id="withheld"
											value={draft.withheld}
											onChange={(e) => setDraft({ withheld: e.target.value })}
											inputMode="decimal"
											className="h-8 text-xs"
										/>
									</Field>
								</div>
							</div>

							{/* Penalties Accordion Toggle */}
							<div className="rounded-md border bg-muted/20 p-2.5">
								<label className="flex cursor-pointer items-center gap-2 text-xs font-medium text-foreground">
									<input
										type="checkbox"
										checked={showPenalties}
										onChange={(e) => setShowPenalties(e.target.checked)}
										className="h-3.5 w-3.5 rounded border-input text-primary"
									/>
									<ShieldAlert className="h-3.5 w-3.5 text-amber-600" />
									Filing Late? (Add BIR Penalties)
								</label>

								{showPenalties && (
									<div className="grid grid-cols-3 gap-2 pt-2 mt-2 border-t">
										<Field>
											<FieldLabel htmlFor="penS" className="text-[11px]">
												Surcharge
											</FieldLabel>
											<Input
												id="penS"
												value={draft.penaltySurcharge}
												onChange={(e) =>
													setDraft({ penaltySurcharge: e.target.value })
												}
												className="h-7 text-xs"
											/>
										</Field>
										<Field>
											<FieldLabel htmlFor="penI" className="text-[11px]">
												Interest
											</FieldLabel>
											<Input
												id="penI"
												value={draft.penaltyInterest}
												onChange={(e) =>
													setDraft({ penaltyInterest: e.target.value })
												}
												className="h-7 text-xs"
											/>
										</Field>
										<Field>
											<FieldLabel htmlFor="penC" className="text-[11px]">
												Compromise
											</FieldLabel>
											<Input
												id="penC"
												value={draft.penaltyCompromise}
												onChange={(e) =>
													setDraft({ penaltyCompromise: e.target.value })
												}
												className="h-7 text-xs"
											/>
										</Field>
									</div>
								)}
							</div>

							<Button
								onClick={compute}
								disabled={loading}
								className="w-full gap-2 h-9 text-xs"
							>
								{loading ? (
									<Loader2 className="h-3.5 w-3.5 animate-spin" />
								) : (
									<Calculator className="h-3.5 w-3.5" />
								)}
								Compute {meta.label} Tax Worksheet
							</Button>
						</CardContent>
					</Card>

					{/* Calculations Output */}
					{items && (
						<QuarterlyWorksheet
							year={year}
							meta={meta}
							items={items}
							sourceCount={sources.count}
							recordedGross={sources.recordedGross}
							overrideGross={sources.overrideGross}
							onSave={save}
							onMarkFiled={markFiled}
						/>
					)}
				</div>

				{/* RIGHT COLUMN: Sub-Tab Modules (Filing Packet & Checklist) (Span 5) */}
				<div className="space-y-4 lg:col-span-5">
					<div className="sticky top-4 space-y-4">
						{/* regime info banner moved to right sidebar */}
						<EightPctBanner />

						<Tabs defaultValue="packet" className="w-full">
							<TabsList className="grid w-full grid-cols-2 h-8 p-0.5">
								<TabsTrigger value="packet" className="text-xs">
									Filing Packet
								</TabsTrigger>
								<TabsTrigger value="checklist" className="text-xs">
									eBIR Checklist
								</TabsTrigger>
							</TabsList>

							<TabsContent value="packet" className="mt-3">
								<FilingPacket
									year={year}
									meta={meta}
									filing={filings?.find(
										(f) =>
											f.formType === "1701Q" &&
											f.year === year &&
											f.quarter === quarter,
									)}
									liveItems={items}
									withheldPesos={
										Number(drafts[`${year}-Q${quarter}`]?.withheld) || 0
									}
									onSaved={() => refetchFilings()}
								/>
							</TabsContent>

							<TabsContent value="checklist" className="mt-3">
								<Card>
									<CardHeader className="py-2.5 border-b bg-muted/10">
										<CardTitle className="text-xs font-semibold flex items-center gap-1.5">
											<FileSpreadsheet className="h-3.5 w-3.5 text-primary" />
											eBIRForms Quick Guide
										</CardTitle>
									</CardHeader>
									<CardContent className="p-3.5 space-y-2.5 text-xs text-muted-foreground">
										<div className="flex gap-2">
											<span className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-primary/10 text-[10px] font-bold text-primary">
												1
											</span>
											<p>
												<strong className="text-foreground">
													Open eBIRForms
												</strong>{" "}
												→ 1701Q, Quarter {meta.ebirQuarter}, {year}, ATC II017.
											</p>
										</div>
										<div className="flex gap-2 border-t pt-2">
											<span className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-primary/10 text-[10px] font-bold text-primary">
												2
											</span>
											<p>
												<strong className="text-foreground">
													Copy Amounts
												</strong>{" "}
												→ Items 47–54, Item 56 (Prior Paid) & Item 58 (2307).
											</p>
										</div>
										<div className="flex gap-2 border-t pt-2">
											<span className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-primary/10 text-[10px] font-bold text-primary">
												3
											</span>
											<p>
												<strong className="text-foreground">
													Validate & Submit
												</strong>{" "}
												online → Save email receipt from BIR.
											</p>
										</div>
										<div className="flex gap-2 border-t pt-2">
											<span className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-primary/10 text-[10px] font-bold text-primary">
												4
											</span>
											<p>
												<strong className="text-foreground">
													Pay & Mark Filed
												</strong>{" "}
												via GCash/Maya if tax &gt; ₱0.
											</p>
										</div>
									</CardContent>
								</Card>
							</TabsContent>
						</Tabs>
					</div>
				</div>
			</div>
		</div>
	)
}
