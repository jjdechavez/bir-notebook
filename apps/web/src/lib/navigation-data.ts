import { IconDashboard, IconSettings, IconUsers } from "@tabler/icons-react"
import { BookOpen, FileBadge, ReceiptText } from "lucide-react"
import type { SessionClient } from "@/lib/auth-client"

export interface NavItem {
	title: string
	url: string
	icon: React.ComponentType<{ className?: string }>
	requireAdmin?: boolean
}

export function getNavigationItems(
	user: SessionClient["user"] | undefined | null,
): NavItem[] {
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
		{
			title: "Taxes",
			url: "/taxes",
			icon: ReceiptText,
		},
		{
			title: "Onboarding",
			url: "/onboarding/cor",
			icon: FileBadge,
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
