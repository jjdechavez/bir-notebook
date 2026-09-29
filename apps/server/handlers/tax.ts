import {
	createError,
	defineEventHandler,
	getValidatedQuery,
	readValidatedBody,
} from "h3"
import { requireAuth } from "../middleware/auth.js"
import { compute8PctWorksheet } from "../services/tax-worksheet.js"
import { toDbError } from "../utils/db-errors.js"
import { toValidationError } from "../utils/validation.js"
import {
	markFiledSchema,
	savePacketSchema,
	worksheetQuerySchema,
} from "../validators/cor.js"

export const getWorksheet = defineEventHandler({
	onRequest: [requireAuth()],
	handler: async (event) => {
		const query = await getValidatedQuery(event, (data) =>
			worksheetQuerySchema.safeParse(data),
		)
		if (!query.success) throw toValidationError(query.error)
		const userId: string = event.context.currentUser?.id as string
		const q = query.data
		const result = await compute8PctWorksheet(event.context.db, userId, {
			year: q.year,
			quarter: q.quarter,
			priorCumulative51: q.priorCumulative51,
			priorPaid: q.priorPaid,
			withheld2307: q.withheld2307,
			nonOperating: q.nonOperating,
			grossOverride: q.grossOverride,
			penaltySurcharge: q.penaltySurcharge,
			penaltyInterest: q.penaltyInterest,
			penaltyCompromise: q.penaltyCompromise,
		})

		const filing = await event.context.db
			.selectFrom("tax_filings")
			.selectAll()
			.where("user_id", "=", userId)
			.where("form_type", "=", "1701Q")
			.where("year", "=", q.year)
			.where("quarter", "=", q.quarter)
			.executeTakeFirst()

		return {
			status: "success",
			data: { ...result, filing: filing ?? null, inputs: q },
		}
	},
})

export const saveWorksheet = defineEventHandler({
	onRequest: [requireAuth()],
	handler: async (event) => {
		const query = await getValidatedQuery(event, (data) =>
			worksheetQuerySchema.safeParse(data),
		)
		if (!query.success) throw toValidationError(query.error)
		const userId: string = event.context.currentUser?.id as string
		const q = query.data
		try {
			const result = await compute8PctWorksheet(event.context.db, userId, {
				year: q.year,
				quarter: q.quarter,
				priorCumulative51: q.priorCumulative51,
				priorPaid: q.priorPaid,
				withheld2307: q.withheld2307,
				nonOperating: q.nonOperating,
				grossOverride: q.grossOverride,
				penaltySurcharge: q.penaltySurcharge,
				penaltyInterest: q.penaltyInterest,
				penaltyCompromise: q.penaltyCompromise,
			})
			await event.context.db
				.insertInto("tax_filings")
				.values({
					user_id: userId,
					form_type: "1701Q",
					year: q.year,
					quarter: q.quarter,
					status: "draft",
					inputs: JSON.stringify(q),
					computed: JSON.stringify(result.items),
				})
				.onConflict((oc) =>
					oc.columns(["user_id", "form_type", "year", "quarter"]).doUpdateSet({
						status: "draft",
						inputs: JSON.stringify(q),
						computed: JSON.stringify(result.items),
						updated_at: new Date(),
					}),
				)
				.execute()
			return { status: "success", data: result }
		} catch (e) {
			console.error(e)
			throw toDbError(e, event.context.requestId)
		}
	},
})

export const markFiled = defineEventHandler({
	onRequest: [requireAuth()],
	handler: async (event) => {
		const body = await readValidatedBody(event, (data) =>
			markFiledSchema.safeParse(data ?? {}),
		)
		if (!body.success) throw toValidationError(body.error)
		const userId: string = event.context.currentUser?.id as string
		const query = await getValidatedQuery(event, (data) =>
			worksheetQuerySchema.safeParse(data),
		)
		if (!query.success) throw toValidationError(query.error)
		const q = query.data
		try {
			const result = await compute8PctWorksheet(event.context.db, userId, {
				year: q.year,
				quarter: q.quarter,
				priorCumulative51: q.priorCumulative51,
				priorPaid: q.priorPaid,
				withheld2307: q.withheld2307,
				nonOperating: q.nonOperating,
				grossOverride: q.grossOverride,
				penaltySurcharge: q.penaltySurcharge,
				penaltyInterest: q.penaltyInterest,
				penaltyCompromise: q.penaltyCompromise,
			})
			const updated = await event.context.db
				.updateTable("tax_filings")
				.set({
					status: "filed",
					filed_at: new Date(),
					payment_ref: body.data.paymentRef ?? null,
					ecr_ref: body.data.ecrRef ?? null,
					paid_at: body.data.paidAt ? new Date(body.data.paidAt) : null,
					paid_amount:
						body.data.paidAmount != null
							? Math.round(body.data.paidAmount * 100)
							: null,
					inputs: JSON.stringify(q),
					computed: JSON.stringify(result.items),
					updated_at: new Date(),
				})
				.where("user_id", "=", userId)
				.where("form_type", "=", "1701Q")
				.where("year", "=", q.year)
				.where("quarter", "=", q.quarter)
				.executeTakeFirst()
			if (updated.numUpdatedRows === 0n) {
				await event.context.db
					.insertInto("tax_filings")
					.values({
						user_id: userId,
						form_type: "1701Q",
						year: q.year,
						quarter: q.quarter,
						status: "filed",
						filed_at: new Date(),
						payment_ref: body.data.paymentRef ?? null,
						ecr_ref: body.data.ecrRef ?? null,
						paid_at: body.data.paidAt ? new Date(body.data.paidAt) : null,
						paid_amount:
							body.data.paidAmount != null
								? Math.round(body.data.paidAmount * 100)
								: null,
						inputs: JSON.stringify(q),
						computed: JSON.stringify(result.items),
					})
					.onConflict((oc) =>
						oc
							.columns(["user_id", "form_type", "year", "quarter"])
							.doUpdateSet({
								status: "filed",
								filed_at: new Date(),
								payment_ref: body.data.paymentRef ?? null,
								ecr_ref: body.data.ecrRef ?? null,
								paid_at: body.data.paidAt ? new Date(body.data.paidAt) : null,
								paid_amount:
									body.data.paidAmount != null
										? Math.round(body.data.paidAmount * 100)
										: null,
								inputs: JSON.stringify(q),
								computed: JSON.stringify(result.items),
								updated_at: new Date(),
							}),
					)
					.execute()
			}
			return { status: "success", data: { filed: true } }
		} catch (e) {
			throw toDbError(e, event.context.requestId)
		}
	},
})

export const savePacket = defineEventHandler({
	onRequest: [requireAuth()],
	handler: async (event) => {
		const body = await readValidatedBody(event, (data) =>
			savePacketSchema.safeParse(data ?? {}),
		)
		if (!body.success) throw toValidationError(body.error)
		const userId: string = event.context.currentUser?.id as string
		try {
			const updated = await event.context.db
				.updateTable("tax_filings")
				.set({
					ecr_ref: body.data.ecrRef ?? null,
					payment_ref: body.data.paymentRef ?? null,
					paid_at: body.data.paidAt ? new Date(body.data.paidAt) : null,
					paid_amount:
						body.data.paidAmount != null
							? Math.round(body.data.paidAmount * 100)
							: null,
					updated_at: new Date(),
				})
				.where("user_id", "=", userId)
				.where("form_type", "=", "1701Q")
				.where("year", "=", body.data.year)
				.where("quarter", "=", body.data.quarter)
				.executeTakeFirst()
			if (updated.numUpdatedRows === 0n) {
				throw createError({
					statusCode: 404,
					message:
						"No filing found for that quarter — compute and mark it filed first",
				})
			}
			return { status: "success", data: { saved: true } }
		} catch (e) {
			throw toDbError(e, event.context.requestId)
		}
	},
})

function dueDateFor(
	formType: string,
	year: number,
	quarter: number | null,
): string | null {
	if (formType === "1701Q" && quarter === 1) return `${year}-05-15`
	if (formType === "1701Q" && quarter === 2) return `${year}-08-15`
	if (formType === "1701Q" && quarter === 3) return `${year}-11-15`
	if ((formType === "1701A" || formType === "1701") && quarter === null)
		return `${year + 1}-04-15`
	if (formType === "2551Q" && quarter !== null) {
		const month = quarter * 3
		const d = new Date(Date.UTC(year, month, 25))
		return d.toISOString().slice(0, 10)
	}
	return null
}

export const listFilings = defineEventHandler({
	onRequest: [requireAuth()],
	handler: async (event) => {
		const userId: string = event.context.currentUser?.id as string
		const rows = await event.context.db
			.selectFrom("tax_filings")
			.selectAll()
			.where("user_id", "=", userId)
			.orderBy("year", "asc")
			.orderBy("quarter", "asc")
			.execute()
		const today = new Date().toISOString().slice(0, 10)
		return {
			status: "success",
			data: rows.map((r) => {
				const due = dueDateFor(r.form_type, r.year, r.quarter)
				const overdue =
					!!due && due < today && r.status !== "filed" && r.status !== "paid"
				return { ...r, due_date: due, overdue }
			}),
		}
	},
})
