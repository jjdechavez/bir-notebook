import { createHmac, timingSafeEqual } from "crypto"

function hmacSignature(value: string, secret: string) {
	return createHmac("sha256", secret).update(value).digest("hex")
}

export function signUrl(
	baseUrl: string,
	path: string,
	secret: string,
	expiresInSeconds: number,
) {
	const expires = Math.floor(Date.now() / 1000) + expiresInSeconds
	const normalizedPath = path.startsWith("/") ? path : `/${path}`
	const payload = `${normalizedPath}:${expires}`
	const signature = hmacSignature(payload, secret)
	const url = new URL(normalizedPath, baseUrl)
	url.searchParams.set("expires", String(expires))
	url.searchParams.set("signature", signature)
	return url.toString()
}

export function verifySignedUrl(
	path: string,
	secret: string,
	expires: string | null,
	signature: string | null,
) {
	if (!expires || !signature) return false
	const expiresInt = Number(expires)
	if (!Number.isFinite(expiresInt)) return false
	if (expiresInt < Math.floor(Date.now() / 1000)) return false

	const normalizedPath = path.startsWith("/") ? path : `/${path}`
	const payload = `${normalizedPath}:${expiresInt}`
	const expected = hmacSignature(payload, secret)

	try {
		return timingSafeEqual(
			Buffer.from(expected, "hex"),
			Buffer.from(signature, "hex"),
		)
	} catch {
		return false
	}
}
