import type { CorInitInput, ListCorDocuments } from "@/types/cor"
import { requestApi } from "../request"

const BASE = "/onboarding/cor" as const
const TAX_BASE = "/tax" as const

export const cor = {
	init: async (input: CorInitInput) =>
		requestApi<{ docId: number; uploadUrl: string; r2Key: string }>(
			`${BASE}/init`,
			{
				method: "POST",
				body: input,
			},
		),
	uploadToR2: async (uploadUrl: string, file: File) => {
		const res = await fetch(uploadUrl, {
			method: "PUT",
			headers: { "Content-Type": file.type },
			body: file,
		})
		if (!res.ok) throw new Error(`R2 upload failed: ${res.status}`)
	},
	uploadViaServer: async (docId: number, file: File) => {
		const { getAuthToken } = await import("../auth-token")
		const form = new FormData()
		form.append("docId", String(docId))
		form.append("file", file, file.name)
		const base = import.meta.env.VITE_API_URL
			? `${import.meta.env.VITE_API_URL}/api`
			: "/api"
		const token = getAuthToken()
		const res = await fetch(`${base}/onboarding/cor/upload`, {
			method: "POST",
			credentials: "include",
			headers: token ? { Authorization: `Bearer ${token}` } : {},
			body: form,
		})
		if (!res.ok) throw new Error(`Server upload failed: ${res.status}`)
	},
	extract: async (docId: number, force = false) =>
		requestApi<{
			extracted: unknown
			issues: Array<{ field: string; message: string }>
			valid: boolean
			usage: unknown
			previewUrl: string
			docId: number
			cached: boolean
			extractedAt: string | null
		}>(`${BASE}/extract`, {
			method: "POST",
			body: { docId, force },
			// Gemini extraction takes 10-60s; the shared default is 3s.
			timeout: 120000,
		}),
	docs: async () =>
		requestApi<ListCorDocuments>("/cor-documents", { method: "GET" }),
	removeDoc: async (id: number) =>
		requestApi<{ deleted: boolean }>(`/cor-documents/${id}`, {
			method: "DELETE",
		}),
	preview: async (id: number) =>
		requestApi<{ previewUrl: string; docId: number }>(
			`/cor-documents/${id}/preview`,
			{ method: "GET" },
		),
	confirm: async (payload: Record<string, unknown>) =>
		requestApi<{ confirmed: boolean }>(`${BASE}/confirm`, {
			method: "POST",
			body: payload,
		}),
	profile: async () =>
		requestApi<{
			profile: unknown
			obligations: unknown[]
			documentUrl?: string | null
			documentMime?: string | null
			documentName?: string | null
		}>("/tax-profile", {
			method: "GET",
		}),
}

export type WorksheetQuery = {
	year: number
	quarter: number
	priorCumulative51?: number
	priorPaid?: number
	grossOverride?: number
	penaltySurcharge?: number
	penaltyInterest?: number
	penaltyCompromise?: number
	withheld2307?: number
	nonOperating?: number
}

export type FilingItem = {
	id: number
	formType: string
	year: number
	quarter: number | null
	status: string
	dueDate: string | null
	overdue: boolean
	filedAt: string | null
	computed?: Record<string, number> | null
	inputs?: Record<string, number> | null
	ecrRef?: string | null
	paymentRef?: string | null
	paidAt?: string | null
	paidAmount?: number | null
}

export type PacketInput = {
	year: number
	quarter: number
	ecrRef?: string
	paymentRef?: string
	paidAt?: string
	paidAmount?: number
}

export const tax = {
	worksheet: async (q: WorksheetQuery) =>
		requestApi<{
			items: Record<string, number>
			sources: {
				count: number
				recordedGross: number
				overrideGross: number | null
			}
			filing: unknown
			inputs: unknown
		}>(`${TAX_BASE}/worksheet`, {
			method: "GET",
			query: q as Record<string, unknown>,
		}),
	save: async (q: WorksheetQuery) =>
		requestApi(`${TAX_BASE}/worksheet/save`, {
			method: "POST",
			query: q as Record<string, unknown>,
		}),
	markFiled: async (q: WorksheetQuery, paymentRef?: string) =>
		requestApi(`${TAX_BASE}/worksheet/mark-filed`, {
			method: "POST",
			query: q as Record<string, unknown>,
			body: { paymentRef: paymentRef ?? null },
		}),
	savePacket: async (p: PacketInput) =>
		requestApi(`${TAX_BASE}/filings/packet`, {
			method: "POST",
			body: {
				year: p.year,
				quarter: p.quarter,
				ecrRef: p.ecrRef?.trim() ? p.ecrRef.trim() : null,
				paymentRef: p.paymentRef?.trim() ? p.paymentRef.trim() : null,
				paidAt: p.paidAt?.trim() ? p.paidAt.trim() : null,
				paidAmount:
					p.paidAmount !== undefined && Number.isFinite(p.paidAmount)
						? p.paidAmount
						: null,
			},
		}),
	filings: async () =>
		requestApi<FilingItem[]>(`${TAX_BASE}/filings`, { method: "GET" }),
}
