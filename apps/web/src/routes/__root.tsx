import { Outlet, createRootRouteWithContext } from '@tanstack/react-router'
import { TanStackRouterDevtoolsPanel } from '@tanstack/react-router-devtools'
import { TanStackDevtools } from '@tanstack/react-devtools'

import TanStackQueryDevtools from '../lib/tanstack-query/devtools'
import { useAuth } from '../lib/auth'

import type { QueryClient } from '@tanstack/react-query'
import { Toaster } from '@/components/ui/sonner'
import type { tuyau } from '@/main'

interface MyRouterContext {
  queryClient: QueryClient
  auth: {
    user: ReturnType<typeof useAuth>['user'] | null
    isAuthenticated: boolean
    isLoading: boolean
  }
  tuyau: typeof tuyau
}

export const Route = createRootRouteWithContext<MyRouterContext>()({
  component: () => {
    return (
      <>
        <Outlet />
        <TanStackDevtools
          config={{
            position: 'bottom-right',
          }}
          plugins={[
            {
              name: 'Tanstack Router',
              render: <TanStackRouterDevtoolsPanel />,
            },
            TanStackQueryDevtools,
          ]}
        />
        <Toaster position="bottom-center" />
      </>
    )
  },
})
