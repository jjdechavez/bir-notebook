import {
	createError,
	defineEventHandler,
	getRouterParams,
	readMultipartFormData,
	readValidatedBody,
} from "h3"
import {
	corCoreSchema,
	corExtractedSchema,
} from "@bir-notebook/shared/models/cor"
import { requireAuth } from "../middleware/auth.js"
import {
	extractCorWithGemini,
	normalizeCorRaw,
} from "../services/cor-extract.js"
import {
	buildCorKeys,
	isR2Configured,
	presignGet,
	presignPut,
	r2Delete,
	r2GetBuffer,
	r2PutBuffer,
	r2PutJson,
} from "../utils/r2.js"
import { toValidationError } from "../utils/validation.js"
import {
	corConfirmSchema,
	corExtractRequestSchema,
	corInitSchema,
} from "../validators/cor.js"

function docId(): string {
	return `doc_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`
}

function extFromMime(mime: string): string {
	if (mime === "application/pdf") return "pdf"
	if (mime === "image/png") return "png"
	if (mime === "image/webp") return "webp"
	return "jpg"
}

export const initCorUpload = defineEventHandler({
	onRequest: [requireAuth()],
	handler: async (event) => {
		const body = await readValidatedBody(event, (data) =>
			corInitSchema.safeParse(data),
		)
		if (!body.success) throw toValidationError(body.error)

		if (!isR2Configured()) {
			throw createError({ statusCode: 500, message: "R2 is not configured" })
		}

		const userId: string = event.context.currentUser?.id as string
		const id = docId()
		const ext = extFromMime(body.data.mime)
		const keys = buildCorKeys(userId, body.data.taxYear, id, ext)

		const uploadUrl = await presignPut(keys.original, body.data.mime)
		console.log({ uploadUrl })

		const inserted = await event.context.db
			.insertInto("cor_documents")
			.values({
				user_id: userId,
				r2_key_original: keys.original,
				r2_key_display: keys.display,
				r2_key_json: keys.json,
				mime: body.data.mime,
				size_bytes: body.data.size,
				tax_year: body.data.taxYear,
				status: "uploaded",
				original_filename: body.data.filename,
			})
			.returningAll()
			.executeTakeFirstOrThrow()

		return {
			status: "success",
			data: { docId: inserted.id, uploadUrl, r2Key: keys.original },
		}
	},
})

export const extractCor = defineEventHandler({
	onRequest: [requireAuth()],
	handler: async (event) => {
		const body = await readValidatedBody(event, (data) =>
			corExtractRequestSchema.safeParse(data),
		)
		if (!body.success) throw toValidationError(body.error)
		const userId: string = event.context.currentUser?.id as string
		const doc = await event.context.db
			.selectFrom("cor_documents")
			.selectAll()
			.where("id", "=", body.data.docId)
			.where("user_id", "=", userId)
			.executeTakeFirst()
		if (!doc)
			throw createError({ statusCode: 404, message: "Document not found" })

		const previewUrl = await presignGet(doc.r2_key_original)

		// Cache-first: a previous successful read is reused without calling
		// Gemini. `force: true` (Re-read button) or a file replace bypasses it.
		if (!body.data.force && doc.status === "extracted") {
			try {
				const sidecar = JSON.parse(
					(await r2GetBuffer(doc.r2_key_json as string)).toString("utf-8"),
				) as {
					raw?: Record<string, unknown>
					normalized?: Record<string, unknown>
					corrected?: Record<string, unknown> | null
					issues?: Array<{ field: string; message: string }>
					extractedAt?: string
				}
				const cached = sidecar.corrected ?? sidecar.normalized ?? sidecar.raw
				if (cached && typeof cached === "object") {
					const recheck = corCoreSchema.safeParse(cached)
					if (recheck.success) {
						return {
							status: "success",
							data: {
								extracted: cached,
								issues: sidecar.issues ?? [],
								valid: corExtractedSchema.safeParse(cached).success,
								usage: undefined,
								previewUrl,
								docId: doc.id,
								cached: true,
								extractedAt: sidecar.extractedAt ?? null,
							},
						}
					}
				}
			} catch {
				// Corrupt/missing sidecar: fall through to a live read.
			}
		}

		const buffer = await r2GetBuffer(doc.r2_key_original)

		let result: Awaited<ReturnType<typeof extractCorWithGemini>>
		try {
			result = await extractCorWithGemini(buffer.toString("base64"), doc.mime)
		} catch (e) {
			const message = e instanceof Error ? e.message : String(e)
			await r2PutJson(doc.r2_key_json as string, {
				error: message,
				promptVersion: "v2",
				extractedAt: new Date().toISOString(),
			})
			await event.context.db
				.updateTable("cor_documents")
				.set({ status: "extract_failed" })
				.where("id", "=", doc.id)
				.execute()
			console.error(message)
			throw createError({
				statusCode: 502,
				message: `AI extraction failed: ${message}. Retry on the same file or fill the form manually.`,
			})
		}

		// Normalize messy COR cells before validation so good reads are not
		// marked failed. Status depends on core fields only; anything else
		// becomes per-field issues for manual correction.
		const { normalized, notes } = normalizeCorRaw(result.raw)
		const parsed = corExtractedSchema.safeParse(normalized)
		const coreOk = corCoreSchema.safeParse(normalized).success
		const issues = [
			...notes.map((message) => ({ field: "obligations", message })),
			...(parsed.success
				? []
				: parsed.error.issues.map((i) => ({
						field: i.path.map(String).join(".") || "root",
						message: i.message,
					}))),
		]
		const extractedAt = new Date().toISOString()
		await r2PutJson(doc.r2_key_json as string, {
			raw: result.raw,
			normalized,
			corrected: null,
			usage: result.usage,
			attempts: result.attempts,
			issues,
			promptVersion: "v3-normalize",
			extractedAt,
		})
		await event.context.db
			.updateTable("cor_documents")
			.set({ status: coreOk ? "extracted" : "extract_failed" })
			.where("id", "=", doc.id)
			.execute()
		return {
			status: "success",
			data: {
				extracted: normalized,
				issues,
				valid: parsed.success,
				usage: result.usage,
				previewUrl,
				docId: doc.id,
				cached: false,
				extractedAt,
			},
		}
	},
})

export const confirmCor = defineEventHandler({
	onRequest: [requireAuth()],
	handler: async (event) => {
		const body = await readValidatedBody(event, (data) =>
			corConfirmSchema.safeParse(data),
		)
		if (!body.success) throw toValidationError(body.error)
		const userId: string = event.context.currentUser?.id as string
		const v = body.data

		await event.context.db
			.insertInto("tax_profiles")
			.values({
				user_id: userId,
				tin: v.tin,
				branch_code: v.branch_code,
				rdo_code: v.rdo_code,
				taxpayer_type: v.taxpayer_type,
				atc: v.atc,
				registered_name: v.registered_name,
				trade_name: v.trade_name ?? null,
				registered_address: v.registered_address,
				zip: v.zip ?? null,
				registration_date: v.registration_date,
				tin_issuance_date: v.tin_issuance_date ?? null,
				is_vat: false,
				is_8pct_current_year: v.is_8pct,
				eight_pct_year: v.eight_pct_year ?? null,
				has_employees: false,
				psic: v.psic ?? null,
				line_of_business: v.line_of_business ?? null,
			})
			.onConflict((oc) =>
				oc.column("user_id").doUpdateSet((eb) => ({
					tin: eb.ref("excluded.tin"),
					branch_code: eb.ref("excluded.branch_code"),
					rdo_code: eb.ref("excluded.rdo_code"),
					taxpayer_type: eb.ref("excluded.taxpayer_type"),
					atc: eb.ref("excluded.atc"),
					registered_name: eb.ref("excluded.registered_name"),
					trade_name: eb.ref("excluded.trade_name"),
					registered_address: eb.ref("excluded.registered_address"),
					zip: eb.ref("excluded.zip"),
					registration_date: eb.ref("excluded.registration_date"),
					tin_issuance_date: eb.ref("excluded.tin_issuance_date"),
					is_8pct_current_year: eb.ref("excluded.is_8pct_current_year"),
					eight_pct_year: eb.ref("excluded.eight_pct_year"),
					updated_at: new Date(),
				})),
			)
			.execute()

		await event.context.db
			.deleteFrom("tax_obligations")
			.where("user_id", "=", userId)
			.execute()
		for (const o of v.obligations) {
			await event.context.db
				.insertInto("tax_obligations")
				.values({
					user_id: userId,
					tax_type: o.tax_type,
					form_type: o.form_type,
					frequency: o.frequency,
					start_date: o.start_date,
					is_active: true,
				})
				.execute()
		}

		const year = v.eight_pct_year ?? new Date().getFullYear()
		for (const q of [1, 2, 3]) {
			await event.context.db
				.insertInto("tax_filings")
				.values({
					user_id: userId,
					form_type: "1701Q",
					year,
					quarter: q,
					status: "upcoming",
				})
				.onConflict((oc) =>
					oc.columns(["user_id", "form_type", "year", "quarter"]).doNothing(),
				)
				.execute()
		}

		await event.context.db
			.updateTable("cor_documents")
			.set({ status: "confirmed", ocn: v.ocn ?? null })
			.where("id", "=", v.docId)
			.where("user_id", "=", userId)
			.execute()

		// Write the user's corrected values back to the sidecar so future
		// reads reuse human truth (kept alongside the raw AI output).
		try {
			const doc = await event.context.db
				.selectFrom("cor_documents")
				.selectAll()
				.where("id", "=", v.docId)
				.where("user_id", "=", userId)
				.executeTakeFirst()
			if (doc?.r2_key_json) {
				let sidecar: Record<string, unknown> = {}
				try {
					sidecar = JSON.parse(
						(await r2GetBuffer(doc.r2_key_json)).toString("utf-8"),
					) as Record<string, unknown>
				} catch {
					// start fresh if the sidecar is missing/corrupt
				}
				await r2PutJson(doc.r2_key_json, {
					...sidecar,
					corrected: {
						tin: v.tin,
						branch_code: v.branch_code,
						rdo_code: v.rdo_code,
						taxpayer_name: v.registered_name,
						taxpayer_type: v.taxpayer_type,
						registered_address: v.registered_address,
						registration_date: v.registration_date,
						tin_issuance_date: v.tin_issuance_date ?? null,
						ocn: v.ocn ?? null,
						ocn_date: null,
						is_8pct: v.is_8pct,
						eight_pct_year: v.eight_pct_year ?? null,
						trade_name: v.trade_name ?? null,
						psic: v.psic ?? null,
						line_of_business: v.line_of_business ?? null,
						obligations: v.obligations,
					},
					correctedAt: new Date().toISOString(),
				})
			}
		} catch {
			// write-back is best-effort; the profile row is already saved
		}

		return { status: "success", data: { confirmed: true } }
	},
})

export const getTaxProfile = defineEventHandler({
	onRequest: [requireAuth()],
	handler: async (event) => {
		const userId: string = event.context.currentUser?.id as string
		const profile = await event.context.db
			.selectFrom("tax_profiles")
			.selectAll()
			.where("user_id", "=", userId)
			.executeTakeFirst()
		const obligations = await event.context.db
			.selectFrom("tax_obligations")
			.selectAll()
			.where("user_id", "=", userId)
			.where("is_active", "=", true)
			.execute()
		const doc =
			(await event.context.db
				.selectFrom("cor_documents")
				.selectAll()
				.where("user_id", "=", userId)
				.where("status", "=", "confirmed")
				.orderBy("created_at", "desc")
				.executeTakeFirst()) ??
			(await event.context.db
				.selectFrom("cor_documents")
				.selectAll()
				.where("user_id", "=", userId)
				.orderBy("created_at", "desc")
				.executeTakeFirst())
		return {
			status: "success",
			data: {
				profile: profile ?? null,
				obligations,
				document_url: doc ? await presignGet(doc.r2_key_original) : null,
				document_mime: doc?.mime ?? null,
				document_name: doc?.original_filename ?? null,
			},
		}
	},
})

const PROXY_MIMES = new Set([
	"application/pdf",
	"image/jpeg",
	"image/png",
	"image/webp",
])

export const uploadCorProxy = defineEventHandler({
	onRequest: [requireAuth()],
	handler: async (event) => {
		const userId: string = event.context.currentUser?.id as string
		const parts = await readMultipartFormData(event)
		if (!parts) throw createError({ statusCode: 400, message: "No file sent" })
		const docPart = parts.find((p) => p.name === "docId")
		const filePart = parts.find((p) => p.name === "file")
		const docIdNum = Number(docPart?.data?.toString())
		if (!Number.isInteger(docIdNum)) {
			throw createError({ statusCode: 400, message: "Invalid docId" })
		}
		if (!filePart?.data || !filePart.type || !PROXY_MIMES.has(filePart.type)) {
			throw createError({ statusCode: 415, message: "Unsupported file type" })
		}
		if (filePart.data.length > 10 * 1024 * 1024) {
			throw createError({
				statusCode: 413,
				message: "File too large (max 10MB)",
			})
		}
		const doc = await event.context.db
			.selectFrom("cor_documents")
			.selectAll()
			.where("id", "=", docIdNum)
			.where("user_id", "=", userId)
			.executeTakeFirst()
		if (!doc)
			throw createError({ statusCode: 404, message: "Document not found" })
		await r2PutBuffer(
			doc.r2_key_original,
			Buffer.from(filePart.data),
			filePart.type,
		)
		// New bytes invalidate any previous read: drop the sidecar so the
		// next extract goes live instead of serving stale cached data.
		if (doc.r2_key_json) {
			try {
				await r2Delete(doc.r2_key_json)
			} catch {
				// ignore missing objects
			}
		}
		await event.context.db
			.updateTable("cor_documents")
			.set({ status: "uploaded" })
			.where("id", "=", doc.id)
			.execute()
		return { status: "success", data: { docId: doc.id } }
	},
})

export const listCorDocs = defineEventHandler({
	onRequest: [requireAuth()],
	handler: async (event) => {
		const userId: string = event.context.currentUser?.id as string
		const rows = await event.context.db
			.selectFrom("cor_documents")
			.select([
				"id",
				"mime",
				"size_bytes",
				"ocn",
				"tax_year",
				"status",
				"original_filename",
				"created_at",
			])
			.where("user_id", "=", userId)
			.orderBy("created_at", "desc")
			.execute()
		return { data: rows }
	},
})

export const deleteCorDoc = defineEventHandler({
	onRequest: [requireAuth()],
	handler: async (event) => {
		const userId: string = event.context.currentUser?.id as string
		const id = Number(getRouterParams(event)["id"])
		if (!Number.isInteger(id)) {
			throw createError({ statusCode: 400, message: "Invalid document id" })
		}
		const doc = await event.context.db
			.selectFrom("cor_documents")
			.selectAll()
			.where("id", "=", id)
			.where("user_id", "=", userId)
			.executeTakeFirst()
		if (!doc)
			throw createError({ statusCode: 404, message: "Document not found" })
		// Best-effort R2 cleanup; DB row is the source of truth.
		for (const key of [
			doc.r2_key_original,
			doc.r2_key_display,
			doc.r2_key_json,
		]) {
			if (!key) continue
			try {
				await r2Delete(key)
			} catch {
				// ignore missing objects
			}
		}
		await event.context.db
			.deleteFrom("cor_documents")
			.where("id", "=", id)
			.execute()
		return { status: "success", data: { deleted: true } }
	},
})

export const previewCorDoc = defineEventHandler({
	onRequest: [requireAuth()],
	handler: async (event) => {
		const userId: string = event.context.currentUser?.id as string
		const id = Number(getRouterParams(event)["id"])
		if (!Number.isInteger(id)) {
			throw createError({ statusCode: 400, message: "Invalid document id" })
		}
		const doc = await event.context.db
			.selectFrom("cor_documents")
			.selectAll()
			.where("id", "=", id)
			.where("user_id", "=", userId)
			.executeTakeFirst()
		if (!doc)
			throw createError({ statusCode: 404, message: "Document not found" })
		const previewUrl = await presignGet(doc.r2_key_original)
		return { status: "success", data: { previewUrl, docId: doc.id } }
	},
})
