export function toCents(price = 0) {
	return Math.round(price * 100)
}

export function fromCentsToPrice(cents = 0) {
	return cents / 100
}
