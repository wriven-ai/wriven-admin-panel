import {
  flexRender,
  type ColumnDef,
  type Table as TanTable,
} from '@tanstack/react-table'
import { cn } from '@/lib/utils'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'

interface DataTableProps<TData> {
  table: TanTable<TData>
  columns: ColumnDef<TData, unknown>[]
  isLoading?: boolean
  emptyMessage?: string
  getRowClassName?: (row: { original: TData }) => string | undefined
  onRowClick?: (row: TData) => void
}

export function DataTable<TData>({
  table,
  isLoading,
  emptyMessage = 'No results found.',
  getRowClassName,
  onRowClick,
}: DataTableProps<TData>) {
  const rows = table.getRowModel().rows

  return (
    <div className="overflow-hidden rounded-lg border bg-card shadow-[var(--shadow-sm)]">
      <Table>
        <TableHeader>
          {table.getHeaderGroups().map((hg) => (
            <TableRow key={hg.id} className="bg-muted/50 hover:bg-muted/50">
              {hg.headers.map((header) => (
                <TableHead
                  key={header.id}
                  className={cn(
                    'text-xs text-muted-foreground',
                    header.column.getCanSort() &&
                      'cursor-pointer select-none hover:text-foreground',
                  )}
                  onClick={header.column.getToggleSortingHandler()}
                >
                  <span className="flex items-center gap-1">
                    {flexRender(header.column.columnDef.header, header.getContext())}
                    {header.column.getIsSorted() === 'asc' && ' ↑'}
                    {header.column.getIsSorted() === 'desc' && ' ↓'}
                  </span>
                </TableHead>
              ))}
            </TableRow>
          ))}
        </TableHeader>
        <TableBody>
          {isLoading ? (
            Array.from({ length: 8 }).map((_, i) => (
              <TableRow key={i}>
                {table.getAllColumns().map((col) => (
                  <TableCell key={col.id}>
                    <div className="h-4 animate-pulse rounded bg-muted" />
                  </TableCell>
                ))}
              </TableRow>
            ))
          ) : rows.length === 0 ? (
            <TableRow className="hover:bg-transparent">
              <TableCell
                colSpan={table.getAllColumns().length}
                className="py-12 text-center text-sm text-muted-foreground"
              >
                {emptyMessage}
              </TableCell>
            </TableRow>
          ) : (
            rows.map((row) => (
              <TableRow
                key={row.id}
                className={cn(onRowClick && 'cursor-pointer', getRowClassName?.(row))}
                onClick={onRowClick ? () => onRowClick(row.original) : undefined}
              >
                {row.getVisibleCells().map((cell) => (
                  <TableCell key={cell.id}>
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </TableCell>
                ))}
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  )
}
