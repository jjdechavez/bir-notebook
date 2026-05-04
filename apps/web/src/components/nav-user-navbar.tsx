import { IconLogout, IconUserCircle } from "@tabler/icons-react"
import { useNavigate } from "@tanstack/react-router"
import { ThemeToggle } from "@/components/theme-toggle"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuGroup,
	DropdownMenuItem,
	DropdownMenuLabel,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useAuthActions } from "@/hooks/use-auth-actions"
import { authClient } from "@/lib/auth-client"
import { Button } from "./ui/button"

export function NavUserNavbar() {
	const navigate = useNavigate()
	const { data } = authClient.useSession()
	const { signOut } = useAuthActions()

	const user = {
		name: data?.user.name,
		email: data?.user.email,
	}

	return (
		<DropdownMenu>
			<DropdownMenuTrigger asChild>
				<Button variant="ghost" className="relative h-8 w-8 rounded-full">
					<Avatar className="h-8 w-8 rounded-lg grayscale">
						<AvatarImage alt={user.name} />
						<AvatarFallback className="rounded-lg">CN</AvatarFallback>
					</Avatar>
				</Button>
			</DropdownMenuTrigger>
			<DropdownMenuContent
				className="min-w-56 rounded-lg"
				align="end"
				sideOffset={4}
			>
				<DropdownMenuLabel className="p-0 font-normal">
					<div className="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
						<Avatar className="h-8 w-8 rounded-lg">
							<AvatarImage alt={user.name} />
							<AvatarFallback className="rounded-lg">CN</AvatarFallback>
						</Avatar>
						<div className="grid flex-1 text-left text-sm leading-tight">
							<span className="truncate font-medium">{user.name}</span>
							<span className="text-muted-foreground truncate text-xs">
								{user.email}
							</span>
						</div>
					</div>
				</DropdownMenuLabel>
				<DropdownMenuSeparator />
				<DropdownMenuGroup>
					<DropdownMenuItem asChild>
						<ThemeToggle />
					</DropdownMenuItem>
					<DropdownMenuItem
						onClick={() => navigate({ to: "/settings/accounts" })}
					>
						<IconUserCircle />
						Account
					</DropdownMenuItem>
				</DropdownMenuGroup>
				<DropdownMenuSeparator />
				<DropdownMenuItem onClick={() => signOut()}>
					<IconLogout />
					Log out
				</DropdownMenuItem>
			</DropdownMenuContent>
		</DropdownMenu>
	)
}
