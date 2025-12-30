import { SettingTab } from '@/components/setting-tab'
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
import { useFilters } from '@/hooks/use-filters'
import { tuyau } from '@/main'
import type { Invite } from '@/types/invite'
import { useSuspenseQuery } from '@tanstack/react-query'
import { createFileRoute } from '@tanstack/react-router'
import {
  getCoreRowModel,
  useReactTable,
  type ColumnDef,
  type PaginationState,
} from '@tanstack/react-table'
import { MoreHorizontal } from 'lucide-react'
import { userSettingTabs } from './settings.users'
import { DEFAULT_LIST_META } from '@/lib/api'
import {
  CopyInviteLinkAction,
  CreateInvite,
  EditInvite,
} from '@/components/setting-invite-overlay'
import { useState } from 'react'
import { SettingPendingComponent } from '@/components/pending-component'
import { GenericErrorComponent } from '@/components/error-component'

export const Route = createFileRoute('/(app)/settings/invites')({
  loader: ({ context }) => {
    return {
      crumb: 'Invites',
      ...context.queryClient.ensureQueryData(
        context.tuyau.api.invites.$get.queryOptions(),
      ),
    }
  },
  validateSearch: () => ({}) as Partial<PaginationState>,
  pendingComponent: SettingPendingComponent,
  component: InviteSettings,
  errorComponent: GenericErrorComponent,
})

const columns: ColumnDef<Invite>[] = [
  {
    header: 'Email',
    cell: ({ row, table }) => {
      const data = row.original
      return (
        <Button
          variant="link"
          onClick={() => table.options.meta?.setEdit?.(data)}
        >
          {data.email}
        </Button>
      )
    },
  },
  {
    header: 'Role',
    accessorKey: 'role',
  },
  {
    header: 'Status',
    accessorKey: 'status',
  },
  {
    header: 'Invited By',
    accessorKey: 'invitedBy',
  },
  {
    id: 'actions',
    enableHiding: false,
    cell: ({ row, table }) => {
      const data = row.original
      return (
        <>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant={'ghost'}>
                <span className="sr-only">Open menu</span>
                <MoreHorizontal />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuLabel>Actions</DropdownMenuLabel>
              {data.status !== 'accepted' ? (
                <>
                  <CopyInviteLinkAction inviteId={data.id.toString()} />
                  <DropdownMenuItem
                    onClick={() => table.options.meta?.setEdit?.(data)}
                  >
                    Edit
                  </DropdownMenuItem>
                </>
              ) : (
                <DropdownMenuItem>No Available Actions</DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </>
      )
    },
  },
]

function InviteSettings() {
  const { filters, setFilters } = useFilters(Route.id)
  const [selectedInvite, setSelectedInvite] = useState<Invite | null>(null)
  const query = {
    page: filters.pageIndex || DEFAULT_PAGE_INDEX,
    limit: filters.pageSize || DEFAULT_PAGE_SIZE,
  }

  const { status, data } = useSuspenseQuery(
    tuyau.api.invites.$get.queryOptions({ payload: query }),
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
      setEdit: (invite) => setSelectedInvite(invite),
    },
  })

  return (
    <div className="px-4 lg:px-6 space-y-4">
      <div className="flex items-center justify-between">
        <SettingTab tabs={userSettingTabs} />
        <CreateInvite />
      </div>

      <DataTable
        columns={columns}
        className="mt-8"
        meta={data?.meta || DEFAULT_LIST_META}
        table={table}
        dataStatus={status}
      />

      {!selectedInvite ? null : (
        <EditInvite
          key={selectedInvite.id}
          open={!!selectedInvite}
          invite={selectedInvite}
          onToggleOpen={() => setSelectedInvite(null)}
          onCallback={() => setSelectedInvite(null)}
        />
      )}
    </div>
  )
}
