import { useFilters } from '@/hooks/use-filters'
import { DEFAULT_LIST_META } from '@/lib/api'
import { createFileRoute } from '@tanstack/react-router'
import {
  getCoreRowModel,
  useReactTable,
  type ColumnDef,
  type PaginationState,
} from '@tanstack/react-table'
import { tuyau } from '@/main'
import {
  DataTable,
  DEFAULT_PAGE_INDEX,
  DEFAULT_PAGE_SIZE,
} from '@/components/data-table'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { MoreHorizontal } from 'lucide-react'
import type { User } from '@/types/user'
import { useSuspenseQuery } from '@tanstack/react-query'
import { SettingTab } from '@/components/setting-tab'
import { useState } from 'react'
import { EditUser } from '@/components/setting-user-overlay'
import { SettingPendingComponent } from '@/components/pending-component'
import { GenericErrorComponent } from '@/components/error-component'

export const Route = createFileRoute('/(app)/settings/users')({
  loader: ({ context }) => {
    return {
      crumb: 'Users',
      ...context.queryClient.ensureQueryData(
        context.tuyau.api.users.$get.queryOptions(),
      ),
    }
  },
  validateSearch: () => ({}) as Partial<PaginationState>,
  component: UserSettings,
  pendingComponent: SettingPendingComponent,
  errorComponent: GenericErrorComponent,
})

const columns: ColumnDef<User>[] = [
  {
    header: 'Name',
    cell: ({ row, table }) => {
      const data = row.original
      return (
        <Button
          variant="link"
          onClick={() => table.options.meta?.setEdit?.(data)}
        >
          {data.firstName} {data.lastName}
        </Button>
      )
    },
  },
  {
    header: 'Email',
    accessorKey: 'email',
  },
  {
    header: 'Role',
    accessorKey: 'role',
  },
  {
    id: 'actions',
    enableHiding: false,
    cell: ({ row, table }) => {
      const data = row.original
      return (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant={'ghost'}>
              <span className="sr-only">Open menu</span>
              <MoreHorizontal />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuLabel>Actions</DropdownMenuLabel>
            <DropdownMenuItem
              onClick={() => table.options.meta?.setEdit?.(data)}
            >
              Edit
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      )
    },
  },
]

export const userSettingTabs = [
  {
    href: '/settings/users',
    label: 'Users',
  },
  {
    href: '/settings/invites',
    label: 'Invites',
  },
]

function UserSettings() {
  const { filters, setFilters } = useFilters(Route.id)
  const [selectedUser, setSelectedUser] = useState<User | null>(null)

  const query = {
    page: filters.pageIndex || DEFAULT_PAGE_INDEX,
    limit: filters.pageSize || DEFAULT_PAGE_SIZE,
  }

  const { status, data } = useSuspenseQuery(
    tuyau.api.users.$get.queryOptions({ payload: query }),
  )

  const table = useReactTable({
    data: data?.data || [],
    columns,
    getCoreRowModel: getCoreRowModel(),
    manualPagination: true,
    rowCount: Number(data?.meta?.total || 0),
    state: {
      pagination: {
        pageIndex: query.page,
        pageSize: query.limit,
      },
    },
    onPaginationChange: (pagination) => {
      setFilters(
        typeof pagination === 'function'
          ? pagination({
              pageIndex: query.page,
              pageSize: query.limit,
            })
          : pagination,
      )
    },
    enableColumnFilters: false,
    filterFns: {
      fuzzy: () => true,
    },
    meta: {
      setEdit: (user) => setSelectedUser(user),
    },
  })

  return (
    <div className="px-4 lg:px-6 space-y-4">
      <SettingTab tabs={userSettingTabs} />

      <DataTable
        columns={columns}
        className="mt-8"
        meta={data?.meta || DEFAULT_LIST_META}
        table={table}
        dataStatus={status}
      />

      {!selectedUser ? null : (
        <EditUser
          key={selectedUser.id}
          open={!!selectedUser}
          user={selectedUser}
          onToggleOpen={() => setSelectedUser(null)}
          onCallback={() => setSelectedUser(null)}
        />
      )}
    </div>
  )
}
