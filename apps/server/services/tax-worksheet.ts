import type { Kysely } from "kysely"
import type { DB } from "../db/types.js"
import { toCents } from "../utils/currency.js"

export type WorksheetItems = {
	i47: number
	i48: number
	i49: number
	i50: number
	i51: number
	i52: number
	i53: number
	i54: number
	i26: number
	i27: number
	i28: number
	i64: number
	i65: number
	i66: number
	i67: number
	i30: number
}

export type WorksheetSources = {
	count: number
	recordedGross: number
	overrideGross: number | null
}

function quarterRange(year: number, quarter: number): { from: Date; to: Date } {
	const startMonth = (quarter - 1) * 3
	return {
		from: new Date(Date.UTC(year, startMonth, 1, 0, 0, 0)),
		to: new Date(Date.UTC(year, startMonth + 3, 0, 23, 59, 59)),
	}
}

/** BIR peso rounding: drop 49c or less, round up 50c or more. Cents in/out. */
export function birRoundPeso(cents: number): number {
	const pesos = Math.floor(cents / 100)
	return (cents % 100 >= 50 ? pesos + 1 : pesos) * 100
}

export async function getQuarterGrossCents(
	db: Kysely<DB>,
	userId: string,
	year: number,
	quarter: number,
): Promise<{ total: number; count: number }> {
	const { from, to } = quarterRange(year, quarter)
	const row = await db
		.selectFrom("transactions")
		.select((eb) => [
			eb.fn.sum<number>("amount").as("sum"),
			eb.fn.count<number>("id").as("count"),
		])
		.where("user_id", "=", userId)
		.where("book_type", "=", "cash_receipt_journal")
		.where("recorded_at", "is not", null)
		.where("transaction_date", ">=", from)
		.where("transaction_date", "<=", to)
		.executeTakeFirst()
	return {
		total: Number(row?.sum ?? 0),
		count: Number(row?.count ?? 0),
	}
}

export async function compute8PctWorksheet(
	db: Kysely<DB>,
	userId: string,
	args: {
		year: number
		quarter: number
		priorCumulative51: number
		priorPaid: number
		withheld2307: number
		nonOperating: number
		grossOverride?: number | undefined
		penaltySurcharge: number
		penaltyInterest: number
		penaltyCompromise: number
	},
): Promise<{ items: WorksheetItems; sources: WorksheetSources }> {
	const gross = await getQuarterGrossCents(db, userId, args.year, args.quarter)
	const overrideGross =
		args.grossOverride !== undefined && args.grossOverride !== null
			? toCents(args.grossOverride)
			: null
	const i47 = overrideGross ?? gross.total
	const i48 = toCents(args.nonOperating)
	const i49 = i47 + i48
	const i50 = toCents(args.priorCumulative51)
	const i51 = i49 + i50
	// The ₱250k reduction applies to the cumulative total EVERY quarter
	// (not consumed once). Double-counting is prevented via Item 56 credits.
	const i52 = Math.min(toCents(250000), i51)
	const i53 = Math.max(0, i51 - i52)
	const i54 = birRoundPeso(Math.round(i53 * 0.08))
	const i26 = i54
	// Credits: prior quarters' tax paid (Item 56) + 2307 withheld (Item 58).
	const i27 = toCents(args.priorPaid) + toCents(args.withheld2307)
	const i28 = Math.max(0, i26 - i27)
	// Penalties are BIR-assessed; each line follows the no-centavos rule.
	const i64 = birRoundPeso(toCents(args.penaltySurcharge))
	const i65 = birRoundPeso(toCents(args.penaltyInterest))
	const i66 = birRoundPeso(toCents(args.penaltyCompromise))
	const i67 = i64 + i65 + i66
	const i30 = i28 + i67
	return {
		items: {
			i47,
			i48,
			i49,
			i50,
			i51,
			i52,
			i53,
			i54,
			i26,
			i27,
			i28,
			i64,
			i65,
			i66,
			i67,
			i30,
		},
		sources: { count: gross.count, recordedGross: gross.total, overrideGross },
	}
}
