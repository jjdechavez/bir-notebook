import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { NavUserNavbar } from '@/components/nav-user-navbar'
import { getNavigationItems } from '@/lib/navigation-data'
import { Link } from '@tanstack/react-router'

interface AppNavbarProps {
  navigationItems: ReturnType<typeof getNavigationItems>
}

export function AppNavbar({ navigationItems }: AppNavbarProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container h-14 flex items-center px-4 md:px-0 mx-auto">
        {/* Logo */}
        <div className="mr-4 flex">
          <a className="mr-6 flex items-center space-x-2" href="/">
            <div className="h-6 w-6 bg-primary rounded"></div>
            <span className="font-bold">BIR Notebook</span>
          </a>
        </div>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex flex-1 items-center space-x-6 text-sm font-medium">
          {navigationItems.map((item) => (
            <Link
              key={item.url}
              to={item.url}
              className="transition-colors hover:text-foreground/80 text-foreground/60"
            >
              {item.title}
            </Link>
          ))}
        </nav>

        {/* Account Menu */}
        <div className="flex flex-1 items-center justify-end space-x-2">
          <NavUserNavbar />
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
              <a
                key={item.url}
                href={item.url}
                className="block px-3 py-2 rounded-md text-base font-medium hover:bg-accent hover:text-accent-foreground"
                onClick={() => setMobileMenuOpen(false)}
              >
                {item.title}
              </a>
            ))}
          </nav>
        </div>
      )}
    </header>
  )
}
