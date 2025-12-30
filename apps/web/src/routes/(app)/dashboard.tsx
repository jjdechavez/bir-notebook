import { createFileRoute } from '@tanstack/react-router'
import { useAuth } from '../../lib/auth'

export const Route = createFileRoute('/(app)/dashboard')({
  component: DashboardComponent,
  loader: () => ({
    crumb: 'Dashboard',
  }),
})

function DashboardComponent() {
  const { user } = useAuth()

  return (
    <div className="bg-background p-6">
      <h1 className="text-xl font-bold mb-4">
        Welcome back, {user?.firstName} {user?.lastName}
      </h1>
      <div className="space-y-4">
        <p className="text-gray-500">
          This is a protected route that requires authentication.
        </p>
      </div>
    </div>
  )
}
