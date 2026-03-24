import { UserPreferencesProvider } from '@/lib/user-preferences'
import { NavigationLayout } from '@/components/navigation-layout'
import { Spinner } from '@/components/ui/spinner'
import { createFileRoute, Outlet, redirect } from '@tanstack/react-router'

export const Route = createFileRoute('/(app)')({
  beforeLoad: async ({ context, location }) => {
    if (context.auth.isLoading) {
      return
    }

    if (!context.auth.isAuthenticated) {
      throw redirect({
        to: '/login',
        search: {
          redirect: location.pathname,
        },
      })
    }
  },
  pendingComponent: () => (
    <div className="flex min-h-svh w-full items-center justify-center">
      <Spinner />
    </div>
  ),
  component: AuthenticatedLayout,
})

function AuthenticatedLayout() {
  return (
    <UserPreferencesProvider>
      <NavigationLayout>
        <Outlet />
      </NavigationLayout>
    </UserPreferencesProvider>
  )
}
