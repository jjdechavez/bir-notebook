import { createFileRoute } from '@tanstack/react-router'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Label } from '@/components/ui/label'
import { Loader2, LayoutIcon, Sun } from 'lucide-react'
import { useUserPreferencesContext } from '@/contexts/user-preferences-context'

export const Route = createFileRoute('/(app)/settings/preferences')({
  component: PreferencesComponent,
  loader: () => ({
    crumb: 'Preferences',
  }),
})

function PreferencesComponent() {
  const {
    navigationLayout,
    setNavigationLayout,
    theme,
    setTheme,
    isLoading,
    isUpdating,
  } = useUserPreferencesContext()

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  return (
    <div className="px-4 lg:px-6 space-y-6">
      <div>
        <h1 className="font-bold text-2xl">Preferences</h1>
        <p className="text-muted-foreground">
          Customize your navigation and appearance
        </p>
      </div>

      {/* Navigation Layout Preferences */}
      <Card>
        <CardHeader>
          <div className="flex items-center space-x-2">
            <LayoutIcon className="h-5 w-5" />
            <CardTitle>Navigation Layout</CardTitle>
          </div>
          <CardDescription>
            Choose your preferred navigation style
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <RadioGroup
            value={navigationLayout}
            onValueChange={(value: 'sidebar' | 'navbar') =>
              setNavigationLayout(value)
            }
            disabled={isUpdating}
          >
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="sidebar" id="sidebar" />
              <Label htmlFor="sidebar">Sidebar Layout</Label>
            </div>
            <p className="text-sm text-muted-foreground ml-6">
              Traditional sidebar navigation on the left side of the screen
            </p>

            <div className="flex items-center space-x-2 mt-3">
              <RadioGroupItem value="navbar" id="navbar" />
              <Label htmlFor="navbar">Navigation Bar Layout</Label>
            </div>
            <p className="text-sm text-muted-foreground ml-6">
              Horizontal navigation bar at the top of the screen
            </p>
          </RadioGroup>

          {isUpdating && (
            <div className="flex items-center space-x-2 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span>Updating preferences...</span>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Theme Preferences */}
      <Card>
        <CardHeader>
          <div className="flex items-center space-x-2">
            <Sun className="h-5 w-5" />
            <CardTitle>Theme</CardTitle>
          </div>
          <CardDescription>Choose your preferred color theme</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <RadioGroup
            value={theme}
            onValueChange={(value: 'light' | 'dark' | 'system') =>
              setTheme(value)
            }
            disabled={isUpdating}
          >
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="light" id="light" />
              <Label htmlFor="light">Light Theme</Label>
            </div>
            <p className="text-sm text-muted-foreground ml-6">
              Bright theme with light background and dark text
            </p>

            <div className="flex items-center space-x-2 mt-3">
              <RadioGroupItem value="dark" id="dark" />
              <Label htmlFor="dark">Dark Theme</Label>
            </div>
            <p className="text-sm text-muted-foreground ml-6">
              Dark theme with dark background and light text
            </p>

            <div className="flex items-center space-x-2 mt-3">
              <RadioGroupItem value="system" id="system" />
              <Label htmlFor="system">System Theme</Label>
            </div>
            <p className="text-sm text-muted-foreground ml-6">
              Automatically switches between light and dark based on your system
              settings
            </p>
          </RadioGroup>
        </CardContent>
      </Card>
    </div>
  )
}
