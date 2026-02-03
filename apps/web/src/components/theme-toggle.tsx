import { Button } from '@/components/ui/button'
import { IconMoon, IconSun, IconDeviceDesktop } from '@tabler/icons-react'
import { useUserPreferencesContext } from '@/lib/user-preferences'

const icons = {
  light: <IconSun className="h-4 w-4 text-muted-foreground" />,
  dark: <IconMoon className="h-4 w-4 text-muted-foreground" />,
  system: <IconDeviceDesktop className="h-4 w-4 text-muted-foreground" />,
}

const themes = Object.keys(icons)

export function ThemeToggle() {
  const { setTheme, isUpdating, theme } = useUserPreferencesContext()

  const handleToggleTheme = () => {
    const currentThemeIndex = themes.findIndex(
      (itemTheme) => itemTheme === theme,
    )
    const nextThemeIndex = (currentThemeIndex + 1) % themes.length
    const nextTheme = themes[nextThemeIndex]
    setTheme(nextTheme as 'light' | 'dark' | 'system')
  }

  return (
    <Button
      variant="ghost"
      size="icon"
      disabled={isUpdating}
      onClick={handleToggleTheme}
      className="w-full flex justify-start p-2"
    >
      {icons[theme]}
      <span className="text-sm text-accent-foreground">Theme</span>
      <span className="sr-only">Toggle theme</span>
    </Button>
  )
}
