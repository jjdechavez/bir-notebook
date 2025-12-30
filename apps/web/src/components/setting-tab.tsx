import { cn } from '@/lib/utils'
import { Link } from '@tanstack/react-router'

export interface SettingTabProps extends React.HTMLAttributes<HTMLDivElement> {
  tabs: Array<{ href: string; label: string }>
}

export function SettingTab(props: SettingTabProps) {
  return (
    <div className={cn('flex mb-4', props.className)}>
      {props.tabs.map((tab, index) => (
        <Link key={tab.href} to={tab.href}>
          {({ isActive }) => {
            return (
              <div className="flex items-center">
                {index > 0 ? (
                  <svg
                    fill="currentColor"
                    viewBox="0 0 20 20"
                    aria-hidden="true"
                    className="size-6 shrink-0 text-muted-foreground/40"
                  >
                    <path d="M5.555 17.776l8-16 .894.448-8 16-.894-.448z" />
                  </svg>
                ) : null}

                <h1
                  className={cn(
                    "font-bold text-xl",
                    isActive
                      ? 'text-foreground'
                      : 'text-muted-foreground dark:text-foreground/40 hover:text-muted-foreground/80 dark:hover:text-muted-foreground/60',
                  )}
                >
                  {tab.label}
                </h1>
              </div>
            )
          }}
        </Link>
      ))}
    </div>
  )
}
