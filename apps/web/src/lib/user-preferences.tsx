import { createContext, useContext, useEffect } from 'react'
import type { ReactNode } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { tuyau } from '@/main'
import { useTheme } from './theme'
import { toast } from 'sonner'

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
    toast.promise(
      async () =>
        await updatePreferencesMutation.mutateAsync({
          payload: { navigationLayout: layout },
        }),
      {
        loading: 'Updating navigation layout...',
        success: () => `Navigation layout has been updated successfully`,
        error: () => 'Failed to update navigation layout',
      },
    )
  }

  const setTheme = (newTheme: 'light' | 'dark' | 'system') => {
    setUITheme(newTheme)
    toast.promise(
      async () =>
        updatePreferencesMutation.mutateAsync({ payload: { theme: newTheme } }),
      {
        loading: 'Updating theme...',
        success: () => `Theme has been updated successfully`,
        error: () => 'Failed to update theme',
      },
    )
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
