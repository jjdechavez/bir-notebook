export function parseDateInput(value: string) {
	if (/^\d+$/.test(value)) {
		const ts = Number(value)
		if (!Number.isFinite(ts)) return null
		const date = new Date(ts)
		return Number.isNaN(date.getTime()) ? null : date
	}

	const date = new Date(value)
	return Number.isNaN(date.getTime()) ? null : date
}
