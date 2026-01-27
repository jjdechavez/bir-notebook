import { UserPreferencesProvider } from '@/contexts/user-preferences-context'
import { NavigationLayout } from '@/components/navigation-layout'
import { Spinner } from '@/components/ui/spinner'
import { createFileRoute, Outlet, redirect } from '@tanstack/react-router'

export const Route = createFileRoute('/(app)')({
  beforeLoad: ({ context, location }) => {
    const { auth } = context

    if (!auth.isAuthenticated && !auth.isLoading && !auth.user) {
      throw redirect({
        to: '/login',
        search: {
          redirect: location.href,
        },
      })
    }
  },
  pendingComponent: () => (
    <div className="flex items-center gap-4">
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
