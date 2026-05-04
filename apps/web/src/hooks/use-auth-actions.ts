import { useNavigate, useRouter } from "@tanstack/react-router"
import { setAuthToken } from "@/lib/auth-token"
import { authClient } from "../lib/auth-client"

export const useAuthActions = () => {
	const router = useRouter()
	const navigate = useNavigate()
	const { refetch } = authClient.useSession()

	const signIn = async (
		{ email, password }: { email: string; password: string },
		opts?: { redirect?: string },
	) => {
		const { error } = await authClient.signIn.email({
			email,
			password,
			callbackURL: opts?.redirect || "/dashboard",
		})

		if (!error) {
			await router.invalidate()
			navigate({ to: "/dashboard" })
		} else {
			console.error("Login failed:", error)
		}
	}

	const signOut = async () => {
		await authClient.signOut()
		setAuthToken(null)
		await router.invalidate({ sync: true })
		await refetch()
		navigate({ to: "/", replace: true })
	}

	return { signIn, signOut }
}
