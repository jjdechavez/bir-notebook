import { useUserPreferencesContext } from '@/contexts/user-preferences-context'
import { useAuth } from '@/lib/auth'
import { getNavigationItems } from '@/lib/navigation-data'
import { AppSidebar } from '@/components/app-sidebar'
import { SidebarProvider, SidebarInset } from '@/components/ui/sidebar'
import { SiteHeader } from '@/components/site-header'
import { AppNavbar } from '@/components/app-navbar'

interface NavigationLayoutProps {
  children: React.ReactNode
}

export function NavigationLayout({ children }: NavigationLayoutProps) {
  const { navigationLayout } = useUserPreferencesContext()
  const { user } = useAuth()

  if (!user) {
    return null // or loading state
  }

  const navigationItems = getNavigationItems(user)

  if (navigationLayout === 'navbar') {
    return (
      <div className="min-h-screen">
        <AppNavbar navigationItems={navigationItems} />
        <main className="container mx-auto pt-6">{children}</main>
      </div>
    )
  }

  return (
    <SidebarProvider
      style={
        {
          '--sidebar-width': 'calc(var(--spacing) * 72)',
          '--header-height': 'calc(var(--spacing) * 12)',
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
