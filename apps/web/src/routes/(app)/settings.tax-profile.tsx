import { createFileRoute, Link, useNavigate } from "@tanstack/react-router"
import { Download, ExternalLink, FileText } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card"
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table"
import { useCorProfile } from "@/hooks/api/cor"

export const Route = createFileRoute("/(app)/settings/tax-profile")({
	loader: () => ({ crumb: "Tax Profile" }),
	validateSearch: (
		search: Record<string, unknown>,
	): {
		previewDoc?: boolean | undefined
	} => ({
		previewDoc:
			search.previewDoc === true || search.previewDoc === "true"
				? true
				: undefined,
	}),
	component: TaxProfileSettings,
})

type Profile = Record<string, unknown>
type Obligation = Record<string, unknown>

function str(v: unknown): string {
	return typeof v === "string" ? v : ""
}

function formatDate(v: unknown): string {
	const raw = str(v)
	if (!raw) return "—"
	const date = new Date(raw)
	return Number.isNaN(date.getTime())
		? raw
		: date.toLocaleDateString("en-US", {
				month: "short",
				day: "2-digit",
				year: "numeric",
			})
}

function TaxProfileSettings() {
	const { data, isPending } = useCorProfile()
	const { previewDoc } = Route.useSearch()
	const navigate = useNavigate({ from: Route.fullPath })

	const payload = (
		data as unknown as
			| {
					data?: {
						profile: Profile | null
						obligations: Obligation[]
						documentUrl?: string
						documentMime?: string
						documentName?: string
					}
			  }
			| undefined
	)?.data

	const profile = payload?.profile ?? null
	const obligations = payload?.obligations ?? []
	const documentUrl = payload?.documentUrl
	const documentMime = payload?.documentMime ?? ""
	const isImage = documentMime.startsWith("image/")

	const toggleDocPreview = (open: boolean) => {
		navigate({
			search: (old) => ({ ...old, previewDoc: open || undefined }),
		})
	}

	if (isPending) {
		return <p className="text-sm text-muted-foreground">Loading…</p>
	}

	if (!profile) {
		return (
			<Card>
				<CardHeader>
					<CardTitle className="text-base">Tax Profile</CardTitle>
				</CardHeader>
				<CardContent className="space-y-3 text-sm">
					<p className="text-muted-foreground">
						No tax profile yet. Upload your COR so deadlines, reminders, and
						worksheets know your regime.
					</p>
					<Button asChild>
						<Link to="/onboarding/cor">Set up tax profile</Link>
					</Button>
				</CardContent>
			</Card>
		)
	}

	return (
		<div className="space-y-6">
			{/* Top Header */}
			<div className="flex items-center justify-between">
				<div>
					<h1 className="text-xl font-bold tracking-tight">Tax Profile</h1>
					<p className="text-xs text-muted-foreground">
						Verified tax information based on BIR Form 2303
					</p>
				</div>
				<div className="flex items-center gap-2">
					<Button variant="outline" size="sm" asChild>
						<Link to="/onboarding/cor">Update via onboarding</Link>
					</Button>
				</div>
			</div>

			{/* Main Layout Grid */}
			<div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
				{/* Left Area: Details & Obligations (Span 8) */}
				<div className="space-y-6 lg:col-span-8">
					{/* Status Highlights */}
					<div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
						<Card>
							<CardContent className="p-4">
								<p className="text-xs font-medium text-muted-foreground">
									Taxpayer Type
								</p>
								<p className="mt-1 text-sm font-semibold capitalize">
									{str(profile.taxpayerType) || "—"}
								</p>
							</CardContent>
						</Card>
						<Card>
							<CardContent className="p-4">
								<p className="text-xs font-medium text-muted-foreground">
									RDO Code
								</p>
								<p className="mt-1 text-sm font-mono font-semibold">
									{str(profile["rdoCode"]) || "—"}
								</p>
							</CardContent>
						</Card>
						<Card>
							<CardContent className="p-4">
								<p className="text-xs font-medium text-muted-foreground">
									8% Tax Rate
								</p>
								<div className="mt-1">
									{profile["is8PctCurrentYear"] ? (
										<Badge variant="default">Active</Badge>
									) : (
										<Badge variant="secondary">Graduated</Badge>
									)}
								</div>
							</CardContent>
						</Card>
						<Card>
							<CardContent className="p-4">
								<p className="text-xs font-medium text-muted-foreground">
									VAT Registered
								</p>
								<div className="mt-1">
									{profile["isVat"] ? (
										<Badge variant="default">VAT</Badge>
									) : (
										<Badge variant="outline">Non-VAT</Badge>
									)}
								</div>
							</CardContent>
						</Card>
					</div>

					{/* Registration Details */}
					<Card>
						<CardHeader>
							<CardTitle className="text-base">Registration details</CardTitle>
						</CardHeader>
						<CardContent>
							<Table>
								<TableBody>
									<TableRow>
										<TableCell className="w-44 text-muted-foreground font-medium">
											TIN
										</TableCell>
										<TableCell className="font-mono font-medium">
											{`${str(profile.tin)}-${str(profile.branchCode)}`}
										</TableCell>
									</TableRow>
									<TableRow>
										<TableCell className="text-muted-foreground font-medium">
											Registered name
										</TableCell>
										<TableCell>{str(profile.registeredName)}</TableCell>
									</TableRow>
									<TableRow>
										<TableCell className="text-muted-foreground font-medium">
											Trade name
										</TableCell>
										<TableCell>{str(profile.tradeName) || "—"}</TableCell>
									</TableRow>
									<TableRow>
										<TableCell className="text-muted-foreground font-medium">
											Registered address
										</TableCell>
										<TableCell className="leading-relaxed">
											{str(profile.registeredAddress)}
										</TableCell>
									</TableRow>
									<TableRow>
										<TableCell className="text-muted-foreground font-medium">
											ATC
										</TableCell>
										<TableCell className="font-mono">
											{str(profile.atc)}
										</TableCell>
									</TableRow>
									<TableRow>
										<TableCell className="text-muted-foreground font-medium">
											Registration date
										</TableCell>
										<TableCell>
											{formatDate(profile.registrationDate)}
										</TableCell>
									</TableRow>
									<TableRow>
										<TableCell className="text-muted-foreground font-medium">
											TIN issuance date
										</TableCell>
										<TableCell>{formatDate(profile.tinIssuanceDate)}</TableCell>
									</TableRow>
								</TableBody>
							</Table>
						</CardContent>
					</Card>

					{/* Tax Obligations */}
					<Card>
						<CardHeader>
							<CardTitle className="text-base">Tax obligations</CardTitle>
						</CardHeader>
						<CardContent>
							{obligations.length === 0 ? (
								<p className="p-6 text-sm text-muted-foreground">
									No obligations recorded.
								</p>
							) : (
								<Table>
									<TableHeader>
										<TableRow>
											<TableHead>Tax type</TableHead>
											<TableHead>Form</TableHead>
											<TableHead>Frequency</TableHead>
											<TableHead>Start date</TableHead>
										</TableRow>
									</TableHeader>
									<TableBody>
										{obligations.map((o) => (
											<TableRow
												key={`${str(o["taxType"])}-${str(o["formType"])}-${str(o["startDate"])}`}
											>
												<TableCell className="font-medium">
													{str(o["taxType"])}
												</TableCell>
												<TableCell>
													<Badge variant="outline" className="font-mono">
														{str(o["formType"])}
													</Badge>
												</TableCell>
												<TableCell className="text-xs uppercase text-muted-foreground">
													{str(o["frequency"])}
												</TableCell>
												<TableCell>{formatDate(o["startDate"])}</TableCell>
											</TableRow>
										))}
									</TableBody>
								</Table>
							)}
						</CardContent>
					</Card>
				</div>

				{/* Right Area: Document Preview Card (Span 4) */}
				<div className="space-y-6 lg:col-span-4">
					<Card>
						<CardHeader className="pb-3">
							<div className="flex items-center justify-between">
								<CardTitle className="text-base">Source Document</CardTitle>
								<Badge variant="secondary" className="text-[10px]">
									COR 2303
								</Badge>
							</div>
							<CardDescription className="text-xs">
								Certificate of Registration uploaded during onboarding
							</CardDescription>
						</CardHeader>
						<CardContent className="space-y-4">
							{/* Document Card Area */}
							<button
								type="button"
								onClick={() => toggleDocPreview(true)}
								className="group relative flex aspect-[3/4] w-full cursor-pointer flex-col items-center justify-center rounded-lg border border-dashed border-border bg-muted/40 p-4 transition hover:bg-muted/70"
							>
								<FileText className="h-10 w-10 text-muted-foreground/60 transition group-hover:scale-105 group-hover:text-foreground" />
								<p className="mt-2 text-xs font-medium text-muted-foreground">
									Click to view BIR Form 2303
								</p>

								{/* Hover Action Overlay */}
								<div className="absolute inset-0 flex items-center justify-center rounded-lg bg-background/80 opacity-0 transition-opacity group-hover:opacity-100">
									<span className="inline-flex items-center gap-1.5 rounded-md bg-secondary px-3 py-1.5 text-sm font-medium text-secondary-foreground">
										<ExternalLink className="h-3.5 w-3.5" />
										Preview Document
									</span>
								</div>
							</button>

							<div className="flex flex-col gap-2">
								<Button
									variant="outline"
									size="sm"
									className="w-full justify-start gap-2"
									onClick={() => toggleDocPreview(true)}
								>
									<ExternalLink className="h-3.5 w-3.5" />
									Expand Preview
								</Button>
								{documentUrl && (
									<Button
										variant="ghost"
										size="sm"
										className="w-full justify-start gap-2"
										asChild
									>
										<a
											href={documentUrl}
											target="_blank"
											rel="noopener noreferrer"
											download
										>
											<Download className="h-3.5 w-3.5" />
											Download File
										</a>
									</Button>
								)}
							</div>
						</CardContent>
					</Card>
				</div>
			</div>

			{/* Simple Modal Preview */}
			{previewDoc && (
				<div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
					<Card className="flex h-[85vh] w-full max-w-4xl flex-col overflow-hidden">
						<CardHeader className="flex shrink-0 flex-row items-center justify-between border-b p-4">
							<CardTitle className="text-base">
								BIR Form 2303 - Certificate of Registration
							</CardTitle>
							<Button
								variant="ghost"
								size="sm"
								onClick={() => toggleDocPreview(false)}
							>
								✕
							</Button>
						</CardHeader>
						<CardContent className="min-h-0 flex-1 overflow-hidden bg-muted/30 p-4">
							{documentUrl ? (
								isImage ? (
									<img
										src={documentUrl}
										alt="BIR Form 2303"
										className="mx-auto h-full max-h-full w-auto max-w-full rounded border bg-background object-contain"
									/>
								) : (
									<iframe
										src={documentUrl}
										className="h-full w-full rounded border bg-background"
										title="BIR Form 2303"
									/>
								)
							) : (
								<div className="flex h-full items-center justify-center text-sm text-muted-foreground">
									No PDF source URL available for preview.
								</div>
							)}
						</CardContent>
					</Card>
				</div>
			)}
		</div>
	)
}
