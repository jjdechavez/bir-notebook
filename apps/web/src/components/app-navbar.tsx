import { Link } from "@tanstack/react-router"
import { BookOpen } from "lucide-react"
import { useState } from "react"
import { NavUserNavbar } from "@/components/nav-user-navbar"
import { Button } from "@/components/ui/button"
import type { getNavigationItems } from "@/lib/navigation-data"

interface AppNavbarProps {
	navigationItems: ReturnType<typeof getNavigationItems>
}

export function AppNavbar({ navigationItems }: AppNavbarProps) {
	const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

	return (
		<header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-backdrop-filter:bg-background/60">
			<div className="container flex items-center justify-between px-6 md:px-0 mx-auto py-4">
				{/* Logo */}
				<div className="mr-4 flex">
					<a className="mr-6 flex items-center" href="/">
						<BookOpen className="h-8 w-8 text-primary" />
					</a>
					<div>
						<h1 className="text-xl font-semibold">BIR Notebook</h1>
						<p className="text-sm text-gray-500 hidden md:block">
							Philippine Bookkeeping for Freelancers
						</p>
					</div>
				</div>

				{/* Desktop Navigation */}
				<div className="flex space-x-4">
					<nav className="hidden md:flex flex-1 items-center space-x-4 text-sm font-medium">
						{navigationItems.map((item) => {
							const Icon = item.icon

							return (
								<Link key={item.url} to={item.url}>
									{({ isActive }) => (
										<Button
											variant={isActive ? "default" : "secondary"}
											className="inline-flex items-center gap-2 transition-colors"
										>
											<Icon className="h-4 w-4" />
											<span>{item.title}</span>
										</Button>
									)}
								</Link>
							)
						})}
					</nav>

					{/* Account Menu */}
					<div className="">
						<NavUserNavbar />
					</div>
				</div>

				{/* Mobile Menu Button */}
				<Button
					variant="ghost"
					className="md:hidden"
					size="icon"
					onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
				>
					<svg
						className="h-5 w-5"
						fill="none"
						stroke="currentColor"
						viewBox="0 0 24 24"
						xmlns="http://www.w3.org/2000/svg"
					>
						<title>menu button</title>
						{mobileMenuOpen ? (
							<path
								strokeLinecap="round"
								strokeLinejoin="round"
								strokeWidth={2}
								d="M6 18L18 6M6 6l12 12"
							/>
						) : (
							<path
								strokeLinecap="round"
								strokeLinejoin="round"
								strokeWidth={2}
								d="M4 6h16M4 12h16M4 18h16"
							/>
						)}
					</svg>
				</Button>
			</div>

			{/* Mobile Menu */}
			{mobileMenuOpen && (
				<div className="md:hidden border-t">
					<nav className="px-2 pt-2 pb-4 space-y-1">
						{navigationItems.map((item) => (
							<Link
								key={item.url}
								to={item.url}
								className="block px-3 py-2 rounded-md text-base font-medium hover:bg-accent hover:text-accent-foreground"
								onClick={() => setMobileMenuOpen(false)}
							>
								{item.title}
							</Link>
						))}
					</nav>
				</div>
			)}
		</header>
	)
}
