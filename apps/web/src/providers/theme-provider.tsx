import { ThemeProvider as NextThemesProvider } from 'next-themes'
import type { ThemeProviderProps } from 'next-themes'
import { useUserPreferencesContext } from '@/contexts/user-preferences-context'

export function ThemeProvider({ children, ...props }: ThemeProviderProps) {
  const { theme } = useUserPreferencesContext()
  
  return (
    <NextThemesProvider 
      {...props} 
      attribute="class" 
      defaultTheme="system" 
      enableSystem
      value={theme}
    >
      {children}
    </NextThemesProvider>
  )
}