import { createContext, useContext, useEffect } from 'react'
import type { ReactNode } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { tuyau } from '@/main'
import { useTheme } from '@/providers/theme-provider'

interface UserPreferencesContextType {
  navigationLayout: 'sidebar' | 'navbar'
  setNavigationLayout: (layout: 'sidebar' | 'navbar') => void
  theme: 'light' | 'dark' | 'system'
  setTheme: (theme: 'light' | 'dark' | 'system') => void
  isLoading: boolean
  isUpdating: boolean
}

const UserPreferencesContext = createContext<
  UserPreferencesContextType | undefined
>(undefined)

export function UserPreferencesProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient()
  const { setTheme: setUITheme, theme: currentUITheme } = useTheme()

  const preferencesQuery = useQuery(tuyau.api.preferences.$get.queryOptions())

  const updatePreferencesMutation = useMutation(
    tuyau.api.preferences.$put.mutationOptions({
      onSuccess: () => {
        queryClient.invalidateQueries({
          queryKey: tuyau.api.preferences.$get.queryKey(),
        })
      },
      onError: (error) => {
        console.error('Failed to update preferences:', error)
        // TODO: Add toast notification here if needed
      },
    }),
  )

  const navigationLayout = preferencesQuery.data?.navigationLayout ?? 'sidebar'
  const theme = preferencesQuery.data?.theme ?? 'system'

  useEffect(() => {
    if (
      preferencesQuery.data?.theme &&
      preferencesQuery.data.theme !== currentUITheme
    ) {
      setUITheme(preferencesQuery.data.theme)
    }
  }, [preferencesQuery.data?.theme, currentUITheme, setUITheme])

  const setNavigationLayout = (layout: 'sidebar' | 'navbar') => {
    updatePreferencesMutation.mutate({ payload: { navigationLayout: layout } })
  }

  const setTheme = (newTheme: 'light' | 'dark' | 'system') => {
    setUITheme(newTheme)
    updatePreferencesMutation.mutate({ payload: { theme: newTheme } })
  }

  return (
    <UserPreferencesContext.Provider
      value={{
        navigationLayout,
        setNavigationLayout,
        theme,
        setTheme,
        isLoading: preferencesQuery.isLoading,
        isUpdating: updatePreferencesMutation.isPending,
      }}
    >
      {children}
    </UserPreferencesContext.Provider>
  )
}

export function useUserPreferencesContext() {
  const context = useContext(UserPreferencesContext)
  if (context === undefined) {
    throw new Error(
      'useUserPreferencesContext must be used within a UserPreferencesProvider',
    )
  }
  return context
}
