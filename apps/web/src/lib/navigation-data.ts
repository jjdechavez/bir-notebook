import { IconDashboard, IconSettings, IconUsers } from "@tabler/icons-react"
import { BookOpen } from "lucide-react"
import type { SessionClient } from "@/lib/auth-client"

export interface NavItem {
	title: string
	url: string
	icon: React.ComponentType<{ className?: string }>
	requireAdmin?: boolean
}

export function getNavigationItems(user: SessionClient["user"]): NavItem[] {
	const items: NavItem[] = [
		{
			title: "Dashboard",
			url: "/dashboard",
			icon: IconDashboard,
		},
		{
			title: "Books",
			url: "/books",
			icon: BookOpen,
		},
	]

	// Add admin-only items
	if (user?.role === "admin") {
		items.push({
			title: "Users",
			url: "/settings/users",
			icon: IconUsers,
			requireAdmin: true,
		})
	}

	items.push({
		title: "Settings",
		url: "/settings",
		icon: IconSettings,
	})

	return items
}
