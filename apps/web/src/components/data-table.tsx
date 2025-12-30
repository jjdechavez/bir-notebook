import {
  Pagination,
  PaginationNext,
  PaginationPrevious,
  DOTS,
  getPaginationRange,
  PaginationContent,
  PaginationItem,
  PaginationEllipsis,
  PaginationLink,
} from '@/components/ui/pagination'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { cn } from '@/lib/utils'
import {
  type Column,
  type ColumnDef,
  flexRender,
  type Table as TanstackTable,
} from '@tanstack/react-table'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useMemo } from 'react'
import { Input } from './ui/input'
import { Field, FieldLabel } from './ui/field'

type ListMeta = {
  total: number
  perPage: number
  currentPage: number
  lastPage: number
  firstPage: number
  firstPageUrl: string
  lastPageUrl: string
  nextPageUrl: string
  previousPageUrl: string
}

function Filter({ column }: { column: Column<any, unknown> }) {
  const columnFilterValue = column.getFilterValue()

  return (
    <Input
      value={(columnFilterValue as string) ?? ''}
      onChange={(e) => column.setFilterValue(e.target.value)}
      onClick={(e) => e.stopPropagation()} // Prevent sorting click if header is sortable
    />
  )
}

export const DEFAULT_PAGE_INDEX = 0
export const DEFAULT_PAGE_SIZE = 10

interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[]
  meta: ListMeta
  table: TanstackTable<TData>
  dataStatus?: 'idle' | 'pending' | 'error' | 'success'
}

export function DataTable<TData, TValue>({
  columns,
  className,
  meta,
  table,
  dataStatus,
  ...props
}: DataTableProps<TData, TValue> & React.ComponentPropsWithoutRef<'div'>) {
  const paginationRange = useMemo(
    () => getPaginationRange(meta.currentPage, meta.lastPage),
    [meta.currentPage, meta.lastPage],
  )

  let rowContent = null
  if (dataStatus === 'pending') {
    rowContent = (
      <>
        {Array.from({ length: 3 }).map((_, index) => (
          <TableRow key={`skeleton-${index}`} className="animate-pulse">
            {columns.map((_, cIndex) => (
              <TableCell key={`skeleton-column-${cIndex}`}>
                <div>
                  <div className="h-4 rounded bg-gray-200 dark:bg-zinc-800" />
                </div>
              </TableCell>
            ))}
          </TableRow>
        ))}
      </>
    )
  } else if (table.getRowModel().rows.length > 0) {
    rowContent = (
      <>
        {table.getRowModel().rows.map((row) => (
          <TableRow key={row.id} data-state={row.getIsSelected() && 'selected'}>
            {row.getVisibleCells().map((cell) => {
              const actionColumn = cell.column.id === 'actions'
              return (
                <TableCell
                  key={cell.id}
                  className={cn(actionColumn && 'text-right')}
                >
                  {flexRender(cell.column.columnDef.cell, cell.getContext())}
                </TableCell>
              )
            })}
          </TableRow>
        ))}
      </>
    )
  } else if (table.getRowModel().rows.length === 0) {
    rowContent = (
      <TableRow>
        <TableCell colSpan={columns.length} className="h-24 text-center">
          No result.
        </TableCell>
      </TableRow>
    )
  }

  return (
    <div className={cn(className)} {...props}>
      <div className="overflow-hidden rounded-md border">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => {
                  const actionColumn = header.id === 'actions'
                  return (
                    <TableHead
                      key={header.id}
                      className={cn(actionColumn && 'text-right')}
                    >
                      {header.isPlaceholder ? null : (
                        <>
                          {flexRender(
                            header.column.columnDef.header,
                            header.getContext(),
                          )}
                          {header.column.getCanFilter() ? (
                            <Filter column={header.column} />
                          ) : null}
                        </>
                      )}
                    </TableHead>
                  )
                })}
              </TableRow>
            ))}
          </TableHeader>

          <TableBody>{rowContent}</TableBody>
        </Table>
      </div>

      <Pagination className="mt-4">
        <Field orientation="horizontal" className="w-0">
          <FieldLabel htmlFor="show">Show</FieldLabel>
          <Select
            value={table.getState().pagination.pageSize.toString()}
            onValueChange={(e) => {
              table.setPageSize(+e)
            }}
          >
            <SelectTrigger>
              <SelectValue placeholder="Page" id="show" />
            </SelectTrigger>
            <SelectContent>
              {[10, 20, 30, 40, 50].map((pageSize) => (
                <SelectItem key={pageSize} value={pageSize.toString()}>
                  {pageSize}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Field>

        <PaginationContent className="flex justify-center ml-auto">
          <PaginationItem>
            <PaginationPrevious
              onClick={() =>
                !table.getCanPreviousPage() ? undefined : table.previousPage()
              }
            />
          </PaginationItem>
          {paginationRange?.map((page, index) => {
            const pageNumber = +page
            const isCurrentPage =
              table.getState().pagination.pageIndex === pageNumber
            if (page === DOTS) {
              return (
                <PaginationItem>
                  <PaginationEllipsis key={`${page}-${index}`} />
                </PaginationItem>
              )
            }

            return (
              <PaginationItem key={page}>
                <PaginationLink
                  onClick={() =>
                    isCurrentPage ? undefined : table.setPageIndex(pageNumber)
                  }
                  isActive={isCurrentPage}
                >
                  {page}
                </PaginationLink>
              </PaginationItem>
            )
          })}
          <PaginationItem>
            <PaginationNext
              onClick={() =>
                !table.getCanNextPage() ? undefined : table.nextPage()
              }
            />
          </PaginationItem>
        </PaginationContent>
      </Pagination>
    </div>
  )
}
