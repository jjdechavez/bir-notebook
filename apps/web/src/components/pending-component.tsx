import { Skeleton } from '@/components/ui/skeleton'

export function SettingPendingComponent() {
  return (
    <div className="space-y-4 px-4 lg:px-6">
      {/* Skeleton for setting tabs */}
      <div className="flex space-x-4">
        <Skeleton className="h-10 w-20" />
        <Skeleton className="h-10 w-20" />
      </div>
      {/* Skeleton for data table */}
      <div className="space-y-2">
        <Skeleton className="h-8 w-full" />
        <Skeleton className="h-8 w-full" />
        <Skeleton className="h-8 w-full" />
        <Skeleton className="h-8 w-full" />
        <Skeleton className="h-8 w-full" />
      </div>
    </div>
  )
}
