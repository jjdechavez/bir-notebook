import { z } from "zod"

export const corInitSchema = z.object({
	filename: z.string().min(1).max(255),
	mime: z.enum(["application/pdf", "image/jpeg", "image/png", "image/webp"]),
	size: z
		.number()
		.int()
		.positive()
		.max(10 * 1024 * 1024),
	taxYear: z.number().int().min(2000).max(2100),
})

export const corExtractRequestSchema = z.object({
	docId: z.number().int(),
	force: z.boolean().optional().default(false),
})

export const corConfirmSchema = z.object({
	docId: z.number().int(),
	tin: z.string().regex(/^\d{3}-\d{3}-\d{3}$/),
	branch_code: z.string().regex(/^\d{5}$/),
	rdo_code: z.string().regex(/^[0-9]{1,3}[A-Z]?$/),
	taxpayer_type: z.enum([
		"single_proprietor",
		"professional",
		"mixed",
		"opc",
		"corp",
		"other",
	]),
	atc: z.string().min(1).max(10).default("II017"),
	registered_name: z.string().min(1),
	trade_name: z.string().max(120).nullable().optional(),
	registered_address: z.string().min(1),
	zip: z.string().max(10).nullable().optional(),
	registration_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
	tin_issuance_date: z
		.string()
		.regex(/^\d{4}-\d{2}-\d{2}$/)
		.nullable()
		.optional(),
	is_8pct: z.boolean(),
	eight_pct_year: z.number().int().nullable().optional(),
	psic: z.string().max(20).nullable().optional(),
	line_of_business: z.string().max(120).nullable().optional(),
	ocn: z.string().max(40).nullable().optional(),
	obligations: z
		.array(
			z.object({
				tax_type: z.string().min(1),
				form_type: z.string().min(1).max(20),
				start_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
				frequency: z.enum(["MONTHLY", "QUARTERLY", "ANNUALLY"]),
			}),
		)
		.min(1),
})

export const worksheetQuerySchema = z.object({
	year: z.coerce.number().int().min(2000).max(2100),
	quarter: z.coerce.number().int().min(1).max(3),
	priorCumulative51: z.coerce.number().nonnegative().default(0),
	priorPaid: z.coerce.number().nonnegative().default(0),
	withheld2307: z.coerce.number().nonnegative().default(0),
	nonOperating: z.coerce.number().nonnegative().default(0),
	grossOverride: z.coerce.number().nonnegative().optional(),
	penaltySurcharge: z.coerce.number().nonnegative().default(0),
	penaltyInterest: z.coerce.number().nonnegative().default(0),
	penaltyCompromise: z.coerce.number().nonnegative().default(0),
})

export const markFiledSchema = z.object({
	paymentRef: z.string().max(120).nullable().optional(),
})
