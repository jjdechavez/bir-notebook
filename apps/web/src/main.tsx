import { StrictMode } from 'react'
import ReactDOM from 'react-dom/client'
import { RouterProvider, createRouter } from '@tanstack/react-router'
import { createTuyauReactQueryClient } from '@tuyau/react-query'

import * as TanStackQueryProvider from './lib/tanstack-query/root-provider.tsx'
import { AuthProvider, useAuth } from './lib/auth'

// Import the generated route tree
import { routeTree } from './routeTree.gen'

import './styles.css'
import reportWebVitals from './reportWebVitals.ts'
import { tuyauClient } from './lib/tuyau.ts'

// Create a new router instance

const TanStackQueryProviderContext = TanStackQueryProvider.getContext()

export const tuyau = createTuyauReactQueryClient({
  client: tuyauClient,
  queryClient: TanStackQueryProviderContext.queryClient,
})

const router = createRouter({
  routeTree,
  context: {
    ...TanStackQueryProviderContext,
    auth: undefined!, // This will be set by the AuthProvider wrapper
    tuyau,
  },
  defaultPreload: 'intent',
  scrollRestoration: true,
  defaultStructuralSharing: true,
  defaultPreloadStaleTime: 0,
})

// Register the router instance for type safety
declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router
  }
}

function RouterWithAuth() {
  const auth = useAuth()

  return (
    <RouterProvider
      router={router}
      context={{
        ...TanStackQueryProviderContext,
        auth: {
          user: auth.user,
          isAuthenticated: auth.isAuthenticated,
          isLoading: auth.isLoading,
        },
      }}
    />
  )
}

// Render the app
const rootElement = document.getElementById('app')
if (rootElement && !rootElement.innerHTML) {
  const root = ReactDOM.createRoot(rootElement)
  root.render(
    <StrictMode>
      <TanStackQueryProvider.Provider {...TanStackQueryProviderContext}>
        <AuthProvider>
          <RouterWithAuth />
        </AuthProvider>
      </TanStackQueryProvider.Provider>
    </StrictMode>,
  )
}

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals()
