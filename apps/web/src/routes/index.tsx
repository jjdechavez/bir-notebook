import { createFileRoute, redirect } from "@tanstack/react-router"
import { authClient } from "@/lib/auth-client"

export const Route = createFileRoute("/")({
	beforeLoad: ({ context }) => {
		const { auth } = context

		if (auth.isAuthenticated) {
			throw redirect({ to: "/dashboard" })
		} else if (!auth.isAuthenticated) {
			throw redirect({ to: "/login" })
		}
	},
	component: HomeComponent,
})

function HomeComponent() {
	const { data } = authClient.useSession()

	if (data) {
		return null // Will redirect via beforeLoad
	}

	return (
		<div className="min-h-screen flex items-center justify-center bg-gray-50">
			<div className="text-center">
				<h1 className="text-4xl font-bold text-gray-900 mb-4">Welcome</h1>
				<p className="text-gray-600">Redirecting to login...</p>
			</div>
		</div>
	)
}
