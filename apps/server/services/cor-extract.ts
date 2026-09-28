import { GoogleGenAI } from "@google/genai"

const SYSTEM_PROMPT = `You are a BIR Form 2303 (Certificate of Registration) parser.
Extract only visible text from the image. Return JSON only.
Normalize TIN to XXX-XXX-XXX, branch_code to 5 digits, dates to YYYY-MM-DD, uppercase names.
Map "PROFESSIONAL - IN GENERAL" to taxpayer_type professional.
Map "AVAILED OF 8% INCOME TAX RATE OPTION? [X] Yes" to is_8pct true.
Tax table: one entry per row as {tax_type, form_type, start_date, frequency}.
If a field is unreadable set it to null and lower its confidence, do not guess.`

const RESPONSE_SCHEMA = {
	type: "object",
	properties: {
		tin: { type: "string" },
		branch_code: { type: "string" },
		rdo_code: { type: "string" },
		taxpayer_name: { type: "string" },
		taxpayer_type: { type: "string" },
		registered_address: { type: "string" },
		registration_date: { type: "string" },
		tin_issuance_date: { type: "string" },
		ocn: { type: "string" },
		ocn_date: { type: "string" },
		is_8pct: { type: "boolean" },
		eight_pct_year: { type: "number" },
		trade_name: { type: "string" },
		psic: { type: "string" },
		line_of_business: { type: "string" },
		obligations: {
			type: "array",
			items: {
				type: "object",
				properties: {
					tax_type: { type: "string" },
					form_type: { type: "string" },
					start_date: { type: "string" },
					frequency: { type: "string" },
				},
			},
		},
		confidence: { type: "object" },
	},
} as unknown as Record<string, unknown>

export type CorExtractResult = {
	raw: Record<string, unknown>
	usage?: { inputTokens: number | undefined; outputTokens: number | undefined }
	attempts: number
}

const KNOWN_FORM_TYPES = new Set([
	"1701Q",
	"1701",
	"1701A",
	"1701MS",
	"2551Q",
	"2550Q",
	"1601C",
	"0619E",
	"1601EQ",
	"1604C",
	"1604E",
	"0605",
])

function cleanStr(v: unknown): string {
	return typeof v === "string" ? v.trim() : ""
}

function normTin(v: unknown): string {
	const d = cleanStr(v).replace(/\D/g, "")
	if (d.length === 9) return `${d.slice(0, 3)}-${d.slice(3, 6)}-${d.slice(6)}`
	return cleanStr(v)
}

function normBranch(v: unknown): string {
	const d = cleanStr(v).replace(/\D/g, "")
	if (d.length > 0 && d.length <= 5) return d.padStart(5, "0")
	return cleanStr(v)
}

function normRdo(v: unknown): string {
	const m = cleanStr(v)
		.toUpperCase()
		.replace(/[\s-]+/g, "")
		.match(/(\d{1,3}[A-Z]?)/)
	return m?.[1] ?? cleanStr(v)
}

function normDate(v: unknown): string | null {
	const s = cleanStr(v)
	if (s === "") return null
	if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return s
	const mdy = s.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/)
	if (mdy) {
		const m = mdy[1] ?? "01"
		const d = mdy[2] ?? "01"
		const y = mdy[3] ?? "2000"
		return `${y}-${m.padStart(2, "0")}-${d.padStart(2, "0")}`
	}
	const parsed = new Date(s)
	if (!Number.isNaN(parsed.getTime()) && /[a-zA-Z]/.test(s)) {
		return parsed.toISOString().slice(0, 10)
	}
	return s
}

function normTaxpayerType(v: unknown): string {
	const s = cleanStr(v).toLowerCase()
	if (s.includes("professional")) return "professional"
	if (s.includes("mixed")) return "mixed"
	if (s.includes("single") || s.includes("proprietor"))
		return "single_proprietor"
	if (s.includes("one person") || s === "opc") return "opc"
	if (s.includes("corp")) return "corp"
	return cleanStr(v)
}

function normFrequency(v: unknown): string {
	const s = cleanStr(v).toUpperCase()
	if (s.startsWith("MONTH")) return "MONTHLY"
	if (s.startsWith("ANNUAL") || s.startsWith("YEAR")) return "ANNUALLY"
	if (s.startsWith("QUART")) return "QUARTERLY"
	return cleanStr(v)
}

function normBool(v: unknown): unknown {
	if (typeof v === "boolean") return v
	const s = cleanStr(v).toLowerCase()
	if (["yes", "true", "1", "x", "checked"].includes(s)) return true
	if (["no", "false", "0"].includes(s)) return false
	return v
}

function normInt(v: unknown): number | null {
	if (typeof v === "number" && Number.isInteger(v)) return v
	const n = Number(cleanStr(v))
	return Number.isInteger(n) ? n : null
}

function nullIfEmpty(v: unknown): string | null {
	const s = cleanStr(v)
	return s === "" ? null : s
}

/**
 * COR cells are messy ("1701/1701A/1701MS" in one cell,
 * "PROFESSIONAL - IN GENERAL", omitted nulls). Normalize Gemini's raw
 * output before schema validation so good reads aren't marked failed.
 */
export function normalizeCorRaw(raw: Record<string, unknown>): {
	normalized: Record<string, unknown>
	notes: Array<string>
} {
	const notes: Array<string> = []
	const obligations: Array<Record<string, unknown>> = []
	const rawObs = Array.isArray(raw["obligations"]) ? raw["obligations"] : []
	for (const item of rawObs) {
		if (typeof item !== "object" || item === null) continue
		const o = item as Record<string, unknown>
		const forms = cleanStr(o["form_type"])
			.toUpperCase()
			.split("/")
			.map((f) => f.trim())
			.filter((f) => f !== "")
		const kept = forms.filter((f) => KNOWN_FORM_TYPES.has(f))
		if (kept.length !== forms.length) {
			notes.push(`dropped unknown form types: ${forms.join(",")}`)
		}
		for (const f of kept.length > 0 ? kept : []) {
			obligations.push({
				tax_type: cleanStr(o["tax_type"]),
				form_type: f,
				start_date: normDate(o["start_date"]),
				frequency: normFrequency(o["frequency"]),
			})
		}
	}
	if (rawObs.length > 0 && obligations.length === 0) {
		notes.push("no usable obligation rows after normalization")
	}

	const normalized: Record<string, unknown> = {
		tin: normTin(raw["tin"]),
		branch_code: normBranch(raw["branch_code"]),
		rdo_code: normRdo(raw["rdo_code"]),
		taxpayer_name: cleanStr(raw["taxpayer_name"]),
		taxpayer_type: normTaxpayerType(raw["taxpayer_type"]),
		registered_address: cleanStr(raw["registered_address"]),
		registration_date: normDate(raw["registration_date"]),
		tin_issuance_date: normDate(raw["tin_issuance_date"]),
		ocn: nullIfEmpty(raw["ocn"]),
		ocn_date: normDate(raw["ocn_date"]),
		is_8pct: normBool(raw["is_8pct"]),
		eight_pct_year: normInt(raw["eight_pct_year"]),
		trade_name: nullIfEmpty(raw["trade_name"]),
		psic: nullIfEmpty(raw["psic"]),
		line_of_business: nullIfEmpty(raw["line_of_business"]),
		obligations,
	}
	return { normalized, notes }
}

export class CorExtractError extends Error {
	readonly code: "NO_KEY" | "MODEL" | "PARSE"
	constructor(code: CorExtractError["code"], message: string) {
		super(message)
		this.code = code
	}
}

async function callGemini(
	apiKey: string,
	base64: string,
	mimeType: string,
): Promise<{ text: string; usage?: CorExtractResult["usage"] }> {
	const ai = new GoogleGenAI({ apiKey })
	let res: Awaited<ReturnType<typeof ai.models.generateContent>>
	try {
		res = await ai.models.generateContent({
			model: "gemini-3.1-flash-lite",
			contents: [
				{
					role: "user",
					parts: [
						{ text: `${SYSTEM_PROMPT}\nReturn JSON matching the schema.` },
						{ inlineData: { mimeType, data: base64 } },
					],
				},
			],
			config: {
				responseMimeType: "application/json",
				responseJsonSchema: RESPONSE_SCHEMA,
				temperature: 0,
				maxOutputTokens: 2048,
			},
		})
	} catch (e) {
		const msg = e instanceof Error ? e.message : String(e)
		throw new CorExtractError(
			"MODEL",
			`Gemini 3.5 Flash-Lite call failed: ${msg}`,
		)
	}
	const usage = (
		res as unknown as {
			usageMetadata?: {
				promptTokenCount?: number
				candidatesTokenCount?: number
			}
		}
	).usageMetadata
	const result: { text: string; usage?: CorExtractResult["usage"] } = {
		text: res.text ?? "{}",
	}
	if (usage) {
		result.usage = {
			inputTokens: usage.promptTokenCount,
			outputTokens: usage.candidatesTokenCount,
		}
	}
	return result
}

export async function extractCorWithGemini(
	displayBase64: string,
	mimeType: string,
): Promise<CorExtractResult> {
	const apiKey = process.env["GEMINI_API_KEY"] ?? ""
	if (!apiKey) {
		throw new CorExtractError("NO_KEY", "GEMINI_API_KEY is not configured")
	}
	// One automatic retry: truncation occasionally yields invalid JSON.
	let lastText = "{}"
	let lastUsage: CorExtractResult["usage"]
	let attempts = 0
	for (let i = 0; i < 2; i++) {
		attempts = i + 1
		const out = await callGemini(apiKey, displayBase64, mimeType)
		lastText = out.text
		lastUsage = out.usage
		try {
			const raw = JSON.parse(lastText) as Record<string, unknown>
			const result: CorExtractResult = { raw, attempts }
			if (lastUsage) result.usage = lastUsage
			return result
		} catch {
			if (i === 1) {
				throw new CorExtractError(
					"PARSE",
					`Gemini returned invalid JSON twice: ${lastText.slice(0, 300)}`,
				)
			}
		}
	}
	throw new CorExtractError("PARSE", "Gemini returned invalid JSON")
}
