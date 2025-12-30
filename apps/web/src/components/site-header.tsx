import { Separator } from '@/components/ui/separator'
import { SidebarTrigger } from '@/components/ui/sidebar'
import { isMatch, Link, useLocation, useMatches } from '@tanstack/react-router'
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from './ui/breadcrumb'
import React from 'react'

export function SiteHeader() {
  const matches = useMatches()
  const location = useLocation()

  if (matches.some((match) => match.status === 'pending')) return null

  const matchesWithCrumbs = matches.filter((match) =>
    isMatch(match, 'loaderData.crumb'),
  )

  return (
    <header className="flex h-(--header-height) shrink-0 items-center gap-2 border-b transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-(--header-height)">
      <div className="flex w-full items-center gap-1 px-4 lg:gap-2 lg:px-6">
        <SidebarTrigger className="-ml-1" />
        <Separator
          orientation="vertical"
          className="mx-2 data-[orientation=vertical]:h-4"
        />
        <Breadcrumb>
          <BreadcrumbList>
            {matchesWithCrumbs.map((crumb, index, arr) => {
              const isLast = index === arr.length - 1
              const isActive = location.pathname === crumb.fullPath
              const crumbName = crumb.loaderData!.crumb
              return (
                <React.Fragment key={crumbName + index}>
                  <BreadcrumbItem>
                    {isLast || isActive ? (
                      <BreadcrumbPage>{crumbName}</BreadcrumbPage>
                    ) : (
                      <BreadcrumbLink asChild>
                        <Link from={crumb.fullPath}>{crumbName}</Link>
                      </BreadcrumbLink>
                    )}
                  </BreadcrumbItem>
                  {index + 1 < matchesWithCrumbs.length ? (
                    <BreadcrumbSeparator className="hidden md:block" />
                  ) : null}
                </React.Fragment>
              )
            })}
          </BreadcrumbList>
        </Breadcrumb>
      </div>
    </header>
  )
}
