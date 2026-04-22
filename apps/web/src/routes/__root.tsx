import { TanStackDevtools } from "@tanstack/react-devtools"
import type { QueryClient } from "@tanstack/react-query"
import { createRootRouteWithContext, Outlet } from "@tanstack/react-router"
import { TanStackRouterDevtoolsPanel } from "@tanstack/react-router-devtools"
import { Toaster } from "@/components/ui/sonner"
import type { SessionClient } from "../lib/auth-client"
import TanStackQueryDevtools from "../lib/tanstack-query/devtools"
import { ThemeProvider } from "../lib/theme"

interface MyRouterContext {
	queryClient: QueryClient
	auth: {
		user: SessionClient["user"]
		isAuthenticated: boolean
		isLoading: boolean
	}
}

export const Route = createRootRouteWithContext<MyRouterContext>()({
	component: () => {
		return (
			<ThemeProvider defaultTheme="system" storageKey="vite-ui-theme">
				<Outlet />
				<TanStackDevtools
					config={{
						position: "bottom-right",
					}}
					plugins={[
						{
							name: "Tanstack Router",
							render: <TanStackRouterDevtoolsPanel />,
						},
						TanStackQueryDevtools,
					]}
				/>
				<Toaster position="bottom-center" />
			</ThemeProvider>
		)
	},
})
