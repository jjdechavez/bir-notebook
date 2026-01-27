import { IconBook, IconDashboard, IconSettings, IconUsers } from '@tabler/icons-react'
import type { User } from '@/lib/auth'

export interface NavItem {
  title: string
  url: string
  icon: React.ComponentType<{ className?: string }>
  requireAdmin?: boolean
}

export function getNavigationItems(user: User): NavItem[] {
  const items: NavItem[] = [
    {
      title: 'Dashboard',
      url: '/dashboard',
      icon: IconDashboard,
    },
    {
      title: 'Books',
      url: '/books',
      icon: IconBook,
    },
  ]
  
  // Add admin-only items
  if (user.role === 'Admin') {
    items.push({
      title: 'Users',
      url: '/settings/users',
      icon: IconUsers,
      requireAdmin: true,
    })
  }
  
  items.push({
    title: 'Settings',
    url: '/settings',
    icon: IconSettings,
  })
  
  return items
}