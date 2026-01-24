import React from 'react'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationNext,
  PaginationPrevious,
  PaginationLink,
  PaginationEllipsis,
  DOTS,
  getPaginationRange,
} from '@/components/ui/pagination'

import { Field, FieldLabel } from '@/components/ui/field'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Skeleton } from '@/components/ui/skeleton'

import { flexRender } from '@tanstack/react-table'
import type { Table as TableType, ColumnDef } from '@tanstack/react-table'
import type { ListMeta } from '@/lib/constants'

interface BooksDataTableProps<TData> {
  columns: ColumnDef<TData>[]
  meta?: ListMeta
  table: TableType<TData>
  dataStatus?: 'idle' | 'pending' | 'error' | 'success'
  footer?: React.ReactNode
  actions?: React.ReactNode
}

export function BooksDataTable<TData>({
  columns,
  meta,
  table,
  dataStatus = 'idle',
  footer,
  actions,
}: BooksDataTableProps<TData>) {
  return (
    <div className="space-y-4">
      {/* Custom actions/filters area */}
      {actions && <div className="flex items-center gap-4">{actions}</div>}

      {/* Table container with scroll */}
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHead key={header.id}>
                    {flexRender(
                      header.column.columnDef.header,
                      header.getContext(),
                    )}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>

          <TableBody>
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow key={row.id}>
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext(),
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : dataStatus === 'pending' ? (
              // Skeleton loading rows
              Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={`skeleton-${i}`}>
                  {columns.map((_, colIndex) => (
                    <TableCell key={colIndex}>
                      <Skeleton className="h-4 w-full" />
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="h-24 text-center"
                >
                  No transactions found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>

          {/* Custom footer support */}
          {footer && (
            <tfoot>
              <TableRow>
                <TableCell colSpan={columns.length} className="p-0">
                  {footer}
                </TableCell>
              </TableRow>
            </tfoot>
          )}
        </Table>
      </div>

      {/* Pagination */}
      {meta && (
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
            {getPaginationRange(meta.currentPage, meta.lastPage)?.map(
              (page, index) => {
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
                        isCurrentPage
                          ? undefined
                          : table.setPageIndex(pageNumber)
                      }
                      isActive={isCurrentPage}
                    >
                      {page}
                    </PaginationLink>
                  </PaginationItem>
                )
              },
            )}
            <PaginationItem>
              <PaginationNext
                onClick={() =>
                  !table.getCanNextPage() ? undefined : table.nextPage()
                }
              />
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      )}
    </div>
  )
}
