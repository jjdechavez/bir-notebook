import { AppNavbar } from "@/components/app-navbar"
import { AppSidebar } from "@/components/app-sidebar"
import { SiteHeader } from "@/components/site-header"
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar"
import { authClient } from "@/lib/auth-client"
import { getNavigationItems } from "@/lib/navigation-data"
import { useUserPreferencesContext } from "@/lib/user-preferences"
import { Spinner } from "./ui/spinner"

interface NavigationLayoutProps {
	children: React.ReactNode
}

export function NavigationLayout({ children }: NavigationLayoutProps) {
	const { navigationLayout, isLoading } = useUserPreferencesContext()
	const { data, isPending, isRefetching } = authClient.useSession()

	const fetchingSession = isPending || isRefetching

	if (fetchingSession && !data?.user && isLoading) {
		return (
			<div className="flex min-h-svh w-full items-center justify-center">
				<Spinner />
			</div>
		)
	}

	const navigationItems = getNavigationItems(data?.user)

	if (navigationLayout === "navbar") {
		return (
			<div className="min-h-screen">
				<AppNavbar navigationItems={navigationItems} />
				<main className="container mx-auto py-6">{children}</main>
			</div>
		)
	}

	return (
		<SidebarProvider
			style={
				{
					"--sidebar-width": "calc(var(--spacing) * 72)",
					"--header-height": "calc(var(--spacing) * 12)",
				} as React.CSSProperties
			}
		>
			<AppSidebar variant="inset" />
			<SidebarInset>
				<SiteHeader />
				<div className="flex flex-1 flex-col">
					<div className="@container/main flex flex-1 flex-col gap-2">
						<div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
							<div className="px-4">{children}</div>
						</div>
					</div>
				</div>
			</SidebarInset>
		</SidebarProvider>
	)
}
