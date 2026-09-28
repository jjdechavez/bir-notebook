import type { Updater } from "@tanstack/react-form"
import { createFileRoute } from "@tanstack/react-router"
import {
	AlertTriangle,
	Calendar,
	CheckCircle2,
	FileText,
	Loader2,
	Receipt,
	RefreshCw,
	ShieldCheck,
	Upload,
} from "lucide-react"
import { useState } from "react"
import { toast } from "sonner"
import {
	applyExtractedToForm,
	CorDetailsForm,
	type CorDetailsFormData,
	corDetailsFormOpts,
	toConfirmPayload,
	useCorDetailsAppForm,
} from "@/components/cor-details-form"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card"
import { Field, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { Item, ItemActions } from "@/components/ui/item"
import {
	useConfirmCor,
	useCorDocs,
	useCorProfile,
	useDeleteCorDoc,
	useExtractCor,
	useInitCorUpload,
} from "@/hooks/api/cor"
import { api } from "@/lib/api"
import { fromSnakeCaseToCamelCase } from "@/lib/utils"
import type { CorInitInput } from "@/types/cor"

export const Route = createFileRoute("/(app)/onboarding/cor")({
	loader: () => ({ crumb: "COR Onboarding" }),
	component: OnboardingCorPage,
})

type Extracted = Record<string, unknown>

function formatReadDate(iso: string | null): string {
	if (!iso) return "saved read"
	const d = new Date(iso)
	return Number.isNaN(d.getTime())
		? "saved read"
		: `saved ${d.toLocaleDateString()} ${d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`
}

type DocRow = {
	id: number
	mime: string
	status: string
	originalFilename: string | null
	createdAt: string
}

function UploadList({
	docsData,
	selectedId,
	onSelect,
	onDelete,
}: {
	docsData: unknown
	selectedId: number | null
	onSelect: (id: number) => Promise<void>
	onDelete: (id: number) => Promise<void>
}) {
	const docs = (docsData as unknown as { data?: DocRow[] } | undefined)?.data
	if (!docs || docs.length === 0) return null

	return (
		<div className="space-y-2">
			{docs.map((d) => (
				<Item
					key={d.id}
					variant="outline"
					className={`p-2 transition-colors ${selectedId === d.id ? "border-primary/50 bg-primary/5" : ""}`}
				>
					<div className="flex min-w-0 flex-1 items-center gap-2">
						<FileText className="h-4 w-4 shrink-0 text-muted-foreground" />
						<span className="truncate text-xs font-medium">
							{d.originalFilename ?? `Document ${d.id}`}
						</span>
					</div>
					<ItemActions>
						<Button
							size="sm"
							variant={selectedId === d.id ? "default" : "outline"}
							className="h-7 px-2 text-[11px]"
							onClick={() => onSelect(d.id)}
						>
							View
						</Button>
						<Button
							size="sm"
							variant="ghost"
							className="h-7 px-2 text-[11px] text-destructive hover:bg-destructive/10"
							onClick={() => onDelete(d.id)}
						>
							Delete
						</Button>
					</ItemActions>
				</Item>
			))}
		</div>
	)
}

export function OnboardingCorPage() {
	const { data: profileData } = useCorProfile()
	const [docId, setDocId] = useState<number | null>(null)
	const [previewUrl, setPreviewUrl] = useState<string>("")
	const [previewMime, setPreviewMime] = useState<string>("")
	const [uploadStatus, setUploadStatus] = useState<
		"idle" | "uploading" | "uploaded" | "reading" | "failed"
	>("idle")
	const [obligations, setObligations] = useState<Extracted[] | undefined>(
		undefined,
	)
	const [file, setFile] = useState<File | null>(null)
	const [extractError, setExtractError] = useState<string>("")
	const [readSource, setReadSource] = useState<string>("")
	const [fieldIssues, setFieldIssues] = useState<
		Array<{ field: string; message: string }>
	>([])
	const [isSubmitted, setIsSubmitted] = useState<boolean>(false)

	const initMut = useInitCorUpload()
	const extractMut = useExtractCor()
	const confirmMut = useConfirmCor()
	const { data: docsData, refetch: refetchDocs } = useCorDocs()
	const deleteMut = useDeleteCorDoc()

	const form = useCorDetailsAppForm({
		...corDetailsFormOpts,
		onSubmit: async () => {
			await handleConfirm()
		},
	})

	async function fetchPreview(id: number) {
		try {
			const res = (await api.cor.preview(id)) as unknown as {
				data: { previewUrl: string }
			}
			setPreviewUrl(res.data.previewUrl)
		} catch {
			// preview is best-effort
		}
	}

	async function uploadFile(target: File, id: number, uploadUrl?: string) {
		setUploadStatus("uploading")
		setPreviewMime(target.type)
		if (uploadUrl) {
			try {
				await api.cor.uploadToR2(uploadUrl, target)
			} catch {
				toast.message("Direct upload blocked, retrying via server…")
				await api.cor.uploadViaServer(id, target)
			}
		} else {
			await api.cor.uploadViaServer(id, target)
		}
		setUploadStatus("uploaded")
		refetchDocs()
		fetchPreview(id)
	}

	async function handleUpload() {
		if (!file) {
			toast.error("Choose your COR scan first")
			return
		}
		setExtractError("")
		try {
			const init = await initMut.mutateAsync({
				filename: file.name,
				mime: file.type as unknown as CorInitInput["mime"],
				size: file.size,
				taxYear: 2025,
			})
			const payload = (
				init as unknown as {
					data: { docId: number; uploadUrl: string }
				}
			).data
			setDocId(payload.docId)
			await uploadFile(file, payload.docId, payload.uploadUrl)
			await runExtract(payload.docId)
		} catch (e) {
			setUploadStatus("failed")
			toast.error(e instanceof Error ? e.message : "Upload failed")
		}
	}

	async function handleReplace(next: File | null) {
		if (!next || !docId) return
		setExtractError("")
		try {
			await uploadFile(next, docId)
			setFile(next)
			await runExtract(docId)
		} catch (e) {
			setUploadStatus("failed")
			toast.error(e instanceof Error ? e.message : "Replace failed")
		}
	}

	async function runExtract(id: number, force = false) {
		setExtractError("")
		setFieldIssues([])
		setUploadStatus("reading")
		try {
			const ex = await extractMut.mutateAsync({ docId: id, force })
			const exData = ex as unknown as {
				data: {
					extracted: Extracted
					issues: Array<{ field: string; message: string }>
					valid: boolean
					previewUrl: string
					docId: number
					cached: boolean
					extractedAt: string | null
				}
			}
			const fromCache = exData.data.cached === true
			setReadSource(
				fromCache
					? `Saved read · ${formatReadDate(exData.data.extractedAt)}`
					: "Fresh AI read",
			)

			const filled = applyExtractedToForm(
				(name: keyof CorDetailsFormData, value: Updater<string | boolean>) =>
					form.setFieldValue(name, value),
				exData.data.extracted,
			)

			const rawObligations = exData.data.extracted.obligations as
				| Extracted[]
				| undefined
			setObligations(Array.isArray(rawObligations) ? rawObligations : undefined)

			if (exData.data.previewUrl) setPreviewUrl(exData.data.previewUrl)

			setFieldIssues(exData.data.issues ?? [])
			setUploadStatus("uploaded")

			if (filled === 0) {
				toast.warning(
					"AI couldn't read fields — enter them manually using the photo",
				)
			} else if (fromCache) {
				toast.success(`Loaded saved read (${filled} fields)`)
			} else if (exData.data.valid) {
				toast.success(`COR read — ${filled} fields filled`)
			} else {
				toast.warning("AI read parts of your COR — check highlighted fields")
			}
		} catch (e) {
			const msg = e instanceof Error ? e.message : "Extraction failed"
			setUploadStatus("failed")
			setExtractError(`${msg}. You can still enter the fields manually.`)
		}
	}

	async function handleConfirm() {
		if (!docId) {
			toast.error("Please upload your BIR Form 2303 first")
			return
		}
		try {
			await confirmMut.mutateAsync(
				toConfirmPayload(docId, form.state.values, obligations),
			)
			toast.success("Tax profile saved successfully")
			setIsSubmitted(true)
		} catch (e) {
			toast.error(e instanceof Error ? e.message : "Confirm failed")
		}
	}

	const profile = (
		profileData as unknown as { data?: { profile: unknown } } | undefined
	)?.data?.profile

	const busy = initMut.isPending || extractMut.isPending || confirmMut.isPending

	if (isSubmitted) {
		return (
			<Card className="mx-auto my-12 max-w-md text-center">
				<CardHeader>
					<CheckCircle2 className="mx-auto h-12 w-12 text-emerald-600" />
					<CardTitle className="text-lg">Tax Profile Saved</CardTitle>
					<CardDescription className="text-xs">
						Your BIR Form 2303 profile and tax filing options have been
						configured.
					</CardDescription>
				</CardHeader>
				<CardContent className="pt-2">
					<Button className="w-full" asChild>
						<a href="/settings/tax-profile">View Tax Profile</a>
					</Button>
				</CardContent>
			</Card>
		)
	}

	return (
		<div className="space-y-6">
			{/* Page Header */}
			<div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
				<div>
					<h1 className="text-xl font-bold tracking-tight">COR Onboarding</h1>
					<p className="text-xs text-muted-foreground">
						Set up your tax profile by uploading your BIR Form 2303
						{profile ? " (Existing profile found)" : ""}
					</p>
				</div>
			</div>

			<div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
				{/* LEFT COLUMN: Form Details & Tax Obligations (Span 7) */}
				<div className="order-2 space-y-6 lg:order-1 lg:col-span-7">
					{/* COR Form Details */}
					<Card>
						<CardHeader>
							<CardTitle className="text-base">COR Details</CardTitle>
							<CardDescription className="text-xs">
								Verify and complete the information parsed from your document
							</CardDescription>
						</CardHeader>
						<CardContent className="space-y-6">
							<CorDetailsForm form={form} />

							{fieldIssues.length > 0 && (
								<div className="rounded-lg border border-amber-200 bg-amber-50/50 p-3.5 text-xs text-amber-900 dark:border-amber-900/50 dark:bg-amber-950/20 dark:text-amber-300">
									<div className="flex items-center gap-1.5 font-semibold">
										<AlertTriangle className="h-4 w-4 text-amber-600 dark:text-amber-400" />
										Fields needing attention:
									</div>
									<ul className="mt-2 list-disc space-y-1 pl-5">
										{fieldIssues.map((i) => (
											<li key={i.field}>
												<span className="font-medium">
													{fromSnakeCaseToCamelCase(i.field)}:
												</span>{" "}
												{i.message}
											</li>
										))}
									</ul>
								</div>
							)}
						</CardContent>
					</Card>

					{/* Tax Regime & Detected Obligations Card */}
					<Card>
						<CardHeader>
							<div className="flex items-center gap-2">
								<Receipt className="h-4 w-4 text-primary" />
								<CardTitle className="text-base">
									Tax Obligations & Regime
								</CardTitle>
							</div>
							<CardDescription className="text-xs">
								Configured filings based on your registration details
							</CardDescription>
						</CardHeader>
						<CardContent className="space-y-4">
							<div className="rounded-lg bg-muted/40 p-3.5 text-xs text-muted-foreground">
								Your profile will be set up with filings for 1701Q (Quarterly
								Income Tax) and 1701A (Annual Income Tax) under the 8% Flat Tax
								Rate Option.
							</div>

							{obligations && obligations.length > 0 && (
								<div className="space-y-2 border-t pt-3">
									<div className="flex items-center justify-between">
										<span className="text-xs font-semibold text-foreground">
											Detected BIR Tax Obligations
										</span>
										<Badge variant="secondary" className="text-[10px]">
											{obligations.length} Detected
										</Badge>
									</div>

									<div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
										{obligations.map((ob, idx) => (
											<div
												key={idx}
												className="flex flex-col gap-1.5 rounded-lg border bg-card p-3 text-xs shadow-sm transition-all"
											>
												<div className="flex items-center justify-between gap-2">
													<Badge
														variant="outline"
														className="font-mono text-[11px] font-bold text-foreground"
													>
														BIR Form {ob.formType}
													</Badge>
													<Badge
														variant={
															ob.frequency === "QUARTERLY"
																? "default"
																: "secondary"
														}
														className="text-[10px] uppercase"
													>
														{ob.frequency}
													</Badge>
												</div>

												<div className="flex items-start gap-1.5 pt-1">
													<ShieldCheck className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-600" />
													<span className="font-medium text-foreground">
														{ob.taxType}
													</span>
												</div>

												{ob.startDate && (
													<div className="flex items-center gap-1.5 text-[11px] text-muted-foreground pt-1 border-t border-border/50">
														<Calendar className="h-3 w-3" />
														<span>Start Date: {ob.startDate}</span>
													</div>
												)}
											</div>
										))}
									</div>
								</div>
							)}
							<div className="flex justify-end border-t pt-4">
								<Button
									onClick={() => form.handleSubmit()}
									disabled={busy}
									className="gap-2"
								>
									{confirmMut.isPending ? (
										<Loader2 className="h-4 w-4 animate-spin" />
									) : (
										<CheckCircle2 className="h-4 w-4" />
									)}
									Save & Complete Tax Profile
								</Button>
							</div>
						</CardContent>
					</Card>
				</div>

				{/* RIGHT COLUMN: Document Upload & Sticky Live Preview (Span 5) */}
				<div className="order-1 lg:order-2 lg:col-span-5">
					<div className="sticky top-6 space-y-4">
						<Card>
							<CardHeader className="pb-3">
								<div className="flex items-center justify-between">
									<CardTitle className="text-base">Uploaded Document</CardTitle>
									{uploadStatus === "reading" && (
										<Badge variant="secondary" className="gap-1 animate-pulse">
											<Loader2 className="h-3 w-3 animate-spin" />
											Reading AI
										</Badge>
									)}
									{uploadStatus === "uploaded" && (
										<Badge
											variant="outline"
											className="gap-1 border-emerald-200 bg-emerald-50 text-emerald-700"
										>
											<CheckCircle2 className="h-3 w-3 text-emerald-600" />
											Ready
										</Badge>
									)}
								</div>
							</CardHeader>
							<CardContent className="space-y-4">
								<UploadList
									docsData={docsData}
									selectedId={docId}
									onSelect={async (id: number) => {
										setDocId(id)
										setUploadStatus("uploaded")
										await fetchPreview(id)
										await runExtract(id)
									}}
									onDelete={async (id: number) => {
										await deleteMut.mutateAsync(id)
										if (docId === id) {
											setDocId(null)
											setPreviewUrl("")
											setUploadStatus("idle")
										}
										refetchDocs()
									}}
								/>

								{(!docsData ||
									(docsData as unknown as { data?: unknown[] })?.data
										?.length === 0) && (
									<div className="space-y-3">
										<div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-border p-6 text-center">
											<Upload className="mb-2 h-8 w-8 text-muted-foreground/60" />
											<p className="text-xs font-medium">
												Upload BIR Form 2303
											</p>
											<p className="mt-1 text-[11px] text-muted-foreground">
												PDF, JPG, or PNG up to 10MB
											</p>
											<Input
												type="file"
												accept="application/pdf,image/jpeg,image/png,image/webp"
												className="mt-3 text-xs"
												onChange={(e) => setFile(e.target.files?.[0] ?? null)}
											/>
										</div>
										<Button
											onClick={handleUpload}
											disabled={busy || !file}
											className="w-full gap-2"
											size="sm"
										>
											{busy ? (
												<Loader2 className="h-4 w-4 animate-spin" />
											) : (
												<Upload className="h-4 w-4" />
											)}
											Upload & Process
										</Button>
									</div>
								)}

								{docId && (
									<div className="flex flex-wrap items-center justify-between gap-2 border-t pt-3">
										<Button
											variant="outline"
											size="sm"
											onClick={() => runExtract(docId, true)}
											disabled={busy}
											className="gap-1.5 text-xs"
										>
											<RefreshCw className="h-3.5 w-3.5" />
											Re-read AI
										</Button>

										{readSource && (
											<span className="text-[11px] text-muted-foreground">
												{readSource}
											</span>
										)}
									</div>
								)}

								{extractError && (
									<p className="text-xs text-destructive">{extractError}</p>
								)}

								{/* Document Image/PDF Viewer Frame */}
								{previewUrl && (
									<div className="overflow-hidden rounded-lg border bg-muted/20">
										{previewMime !== "application/pdf" ? (
											<img
												src={previewUrl}
												alt="Uploaded COR"
												className="max-h-[400px] w-full object-contain p-2"
											/>
										) : (
											<div className="p-4 text-center">
												<FileText className="mx-auto h-8 w-8 text-muted-foreground" />
												<p className="mt-1 text-xs text-muted-foreground">
													PDF Document Attached
												</p>
												<a
													href={previewUrl}
													target="_blank"
													rel="noreferrer"
													className="mt-2 inline-block text-xs font-medium text-primary hover:underline"
												>
													Open PDF Preview →
												</a>
											</div>
										)}
									</div>
								)}

								{docId && previewUrl && (
									<Field className="border-t pt-3">
										<FieldLabel htmlFor="cor-replace" className="text-xs">
											Replace Document
										</FieldLabel>
										<Input
											id="cor-replace"
											type="file"
											accept="application/pdf,image/jpeg,image/png,image/webp"
											className="mt-1 text-xs"
											onChange={(e) =>
												handleReplace(e.target.files?.[0] ?? null)
											}
										/>
									</Field>
								)}
							</CardContent>
						</Card>
					</div>
				</div>
			</div>
		</div>
	)
}
