export function toIsoString(value: Date | null | undefined) {
	return value ? value.toISOString() : null
}
