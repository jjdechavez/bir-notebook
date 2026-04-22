const TOKEN_STORAGE_KEY = "auth_token"

export function getAuthToken(): string | null {
	if (typeof window === "undefined") return null
	return localStorage.getItem(TOKEN_STORAGE_KEY)
}

export function setAuthToken(token: string | null) {
	if (typeof window === "undefined") return null
	if (token) {
		localStorage.setItem(TOKEN_STORAGE_KEY, token)
	} else {
		localStorage.removeItem(TOKEN_STORAGE_KEY)
	}
}
