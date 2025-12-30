import {
  Item,
  ItemContent,
  ItemDescription,
  ItemMedia,
  ItemTitle,
} from '@/components/ui/item'
import { Separator } from '@/components/ui/separator'
import { useAuth } from '@/lib/auth'
import { createFileRoute, Link } from '@tanstack/react-router'
import { SettingsIcon, UsersIcon } from 'lucide-react'

export const Route = createFileRoute('/(app)/settings/')({
  component: SettingComponent,
})

function SettingComponent() {
  const { user } = useAuth()
  const isAdmin = user!.role === 'Admin'

  return (
    <div className="px-4 lg:px-6 space-y-4">
      <h1 className="font-bold text-xl text-foreground">Settings</h1>

      <Separator />

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {isAdmin ? (
          <Item variant="outline" asChild>
            <Link to="/settings/users">
              <ItemMedia variant="image">
                <UsersIcon className="size-6" />
              </ItemMedia>
              <ItemContent>
                <ItemTitle>User</ItemTitle>
                <ItemDescription>Manage users and invites</ItemDescription>
              </ItemContent>
            </Link>
          </Item>
        ) : null}
        <Item variant="outline" asChild>
          <Link to="/settings/accounts">
            <ItemMedia variant="image">
              <SettingsIcon className="size-6" />
            </ItemMedia>
            <ItemContent>
              <ItemTitle>Account</ItemTitle>
              <ItemDescription>Manage account information</ItemDescription>
            </ItemContent>
          </Link>
        </Item>
      </div>
    </div>
  )
}
