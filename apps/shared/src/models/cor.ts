import { z } from "zod"

export const corFormTypes = [
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
] as const

export const taxPayerTypes = {
	singleProprietor: "single_proprietor",
	professional: "professional",
	mixed: "mixed",
	opc: "opc",
	corp: "corp",
	other: "other",
} as const

export type TaxPayerType = (typeof taxPayerTypes)[keyof typeof taxPayerTypes]

export const taxPayerOptions = [
	{ label: "Single Proprietor", value: taxPayerTypes.singleProprietor },
	{ label: "Professional", value: taxPayerTypes.professional },
	{ label: "Mixed", value: taxPayerTypes.mixed },
	{ label: "OPC", value: taxPayerTypes.opc },
	{ label: "Corp", value: taxPayerTypes.corp },
	{ label: "Other", value: taxPayerTypes.other },
] as const

export type CorFormType = (typeof corFormTypes)[number]

export const corObligationSchema = z.object({
	tax_type: z.string().min(1),
	form_type: z.enum(corFormTypes),
	start_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
	frequency: z.enum(["MONTHLY", "QUARTERLY", "ANNUALLY"]),
})

export type CorObligation = z.infer<typeof corObligationSchema>

export const corExtractedSchema = z.object({
	tin: z.string().regex(/^\d{3}-\d{3}-\d{3}$/),
	branch_code: z.string().regex(/^\d{5}$/),
	rdo_code: z.string().regex(/^[0-9]{1,3}[A-Z]?$/),
	taxpayer_name: z.string().min(1),
	taxpayer_type: z.enum(taxPayerOptions.map((option) => option.value)),
	registered_address: z.string().min(1),
	registration_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
	tin_issuance_date: z
		.string()
		.regex(/^\d{4}-\d{2}-\d{2}$/)
		.nullable(),
	ocn: z.string().nullable(),
	ocn_date: z
		.string()
		.regex(/^\d{4}-\d{2}-\d{2}$/)
		.nullable(),
	is_8pct: z.boolean(),
	eight_pct_year: z.number().int().nullable(),
	trade_name: z.string().nullable(),
	psic: z.string().nullable(),
	line_of_business: z.string().nullable(),
	obligations: z.array(corObligationSchema).min(1),
})

export type CorExtracted = z.infer<typeof corExtractedSchema>

/** Minimum viable read: enough to fill the form and be useful. */
export const corCoreSchema = corExtractedSchema.pick({
	tin: true,
	rdo_code: true,
	taxpayer_name: true,
	registered_address: true,
	registration_date: true,
})

export type CorCore = z.infer<typeof corCoreSchema>

export const corConfidenceSchema = z.record(
	z.string(),
	z.number().min(0).max(1),
)

export type CorConfidence = z.infer<typeof corConfidenceSchema>

export const corConfirmSchema = corExtractedSchema.extend({
	docId: z.number().int(),
})

export type CorConfirmInput = z.infer<typeof corConfirmSchema>

export const q3WorksheetInputSchema = z.object({
	year: z.number().int(),
	quarter: z.number().int().min(1).max(3),
	priorCumulative51: z.number().nonnegative(),
	priorPaid: z.number().nonnegative(),
	withheld2307: z.number().nonnegative().default(0),
	nonOperating: z.number().nonnegative().default(0),
	grossOverride: z.number().nonnegative().optional(),
	penaltySurcharge: z.number().nonnegative().default(0),
	penaltyInterest: z.number().nonnegative().default(0),
	penaltyCompromise: z.number().nonnegative().default(0),
})

export type Q3WorksheetInput = z.infer<typeof q3WorksheetInputSchema>

export function classifyCor(obligations: CorObligation[]): {
	regime:
		| "8pct-professional"
		| "8pct-sole-prop"
		| "graduated"
		| "vat"
		| "unknown"
	requiredForms: CorFormType[]
	atc: string
} {
	const forms = new Set(obligations.map((o) => o.form_type))
	if (forms.has("2550Q")) {
		return {
			regime: "vat",
			requiredForms: ["1701Q", "1701A", "2550Q"],
			atc: "II012",
		}
	}
	if (forms.has("2551Q")) {
		return {
			regime: "graduated",
			requiredForms: ["1701Q", "1701A", "2551Q"],
			atc: "II012",
		}
	}
	if (forms.has("1701Q")) {
		return {
			regime: "8pct-professional",
			requiredForms: ["1701Q", "1701A"],
			atc: "II017",
		}
	}
	return { regime: "unknown", requiredForms: [], atc: "II017" }
}

/** BIR peso rounding: drop 49c or less, round up 50c or more. Input/output in centavos. */
export function birRoundPeso(cents: number): number {
	const pesos = Math.floor(cents / 100)
	const remainder = cents % 100
	return (remainder >= 50 ? pesos + 1 : pesos) * 100
}
