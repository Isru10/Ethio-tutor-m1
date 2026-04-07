"use client"

import { useEffect, useState, useMemo } from "react"
import { ArrowUp, BookCheck, Clock, CheckCircle2, XCircle } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { useAuthStore } from "@/store/authStore"
import { getStudentBookings } from "@/lib/services/dashboardService"
import { bookingColumns } from "./components/columns"
import type { BookingWithDetails } from "@/types/database"
import type { BookingRow } from "./data/schema"
import {
  useReactTable, getCoreRowModel, getSortedRowModel,
  getFilteredRowModel, getPaginationRowModel,
  flexRender, type SortingState, type ColumnFiltersState,
} from "@tanstack/react-table"
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { grades } from "@/lib/mockData"

// Shape raw BookingWithDetails into a flat BookingRow for the table
function toRow(b: BookingWithDetails): BookingRow {
  const gradeLabel = grades.find((g) => g.grade_id === b.booking.student_grade)?.grade_name
    ?? `Grade ${b.booking.student_grade}`
  return {
    booking_id:   b.booking.booking_id,
    subject:      b.subject.name,
    teacher_name: b.teacher.name,
    date:         b.slot.slot_date,
    time:         `${b.slot.start_time.slice(0, 5)} – ${b.slot.end_time.slice(0, 5)}`,
    grade:        gradeLabel,
    amount:       b.transaction?.total_amount ?? 0,
    status:       b.booking.status,
    created_at:   b.booking.created_at,
  }
}

export default function BookingsPage() {
  const { user } = useAuthStore()
  const [rawBookings, setRawBookings] = useState<BookingWithDetails[]>([])
  const [loading, setLoading] = useState(true)
  const [sorting, setSorting] = useState<SortingState>([])
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([])
  const [globalFilter, setGlobalFilter] = useState("")

  useEffect(() => {
    if (!user) return
    getStudentBookings(user.user_id, user.tenant_id).then((data) => {
      setRawBookings(data)
      setLoading(false)
    })
  }, [user])

  const rows = useMemo(() => rawBookings.map(toRow), [rawBookings])

  // Stat counts — same pattern as tasks page
  const stats = {
    total:     rows.length,
    confirmed: rows.filter((r) => r.status === "confirmed").length,
    completed: rows.filter((r) => r.status === "completed").length,
    pending:   rows.filter((r) => r.status === "pending").length,
    cancelled: rows.filter((r) => r.status === "cancelled").length,
  }

  const handleCancel = (bookingId: number) => {
    setRawBookings((prev) =>
      prev.map((b) =>
        b.booking.booking_id === bookingId
          ? { ...b, booking: { ...b.booking, status: "cancelled" } }
          : b
      )
    )
  }

  const columns = useMemo(() => bookingColumns(handleCancel), [])

  const table = useReactTable({
    data: rows,
    columns,
    state: { sorting, columnFilters, globalFilter },
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onGlobalFilterChange: setGlobalFilter,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    initialState: { pagination: { pageSize: 10 } },
  })

  return (
    <>
      {/* Page heading */}
      <div className="px-4 lg:px-6">
        <h1 className="text-2xl font-bold tracking-tight">My Bookings</h1>
        <p className="text-muted-foreground text-sm">
          View and manage all your class bookings.
        </p>
      </div>

      {/* Stat cards — exactly tasks page pattern */}
      <div className="px-4 lg:px-6 grid gap-4 grid-cols-2 md:grid-cols-4">
        {[
          { label: "Total",     value: stats.total,     icon: BookCheck,    color: "text-foreground"  },
          { label: "Confirmed", value: stats.confirmed,  icon: CheckCircle2, color: "text-blue-500"    },
          { label: "Completed", value: stats.completed,  icon: CheckCircle2, color: "text-green-500"   },
          { label: "Pending",   value: stats.pending,    icon: Clock,        color: "text-amber-500"   },
        ].map(({ label, value, icon: Icon, color }) => (
          <Card key={label}>
            <CardContent>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-muted-foreground text-sm font-medium">{label}</p>
                  <div className="mt-1 flex items-baseline gap-2">
                    <span className="text-2xl font-bold">{loading ? "–" : value}</span>
                    {!loading && stats.total > 0 && (
                      <span className={`flex items-center gap-0.5 text-xs ${color}`}>
                        <ArrowUp className="size-3" />
                        {Math.round((value / stats.total) * 100)}%
                      </span>
                    )}
                  </div>
                </div>
                <div className="bg-secondary rounded-lg p-3">
                  <Icon className={`size-5 ${color}`} />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* DataTable */}
      <div className="px-4 lg:px-6">
        <Card>
          <CardHeader>
            <CardTitle>Booking History</CardTitle>
            <CardDescription>All your class bookings with status and payment details.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Toolbar */}
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <Input
                placeholder="Search teacher or subject…"
                value={globalFilter}
                onChange={(e) => setGlobalFilter(e.target.value)}
                className="h-8 max-w-xs"
              />
              {/* Status filter badges */}
              <div className="flex gap-1.5 flex-wrap">
                {(["confirmed", "pending", "completed", "cancelled"] as const).map((s) => {
                  const active = columnFilters.some(
                    (f) => f.id === "status" && (f.value as string[]).includes(s)
                  )
                  return (
                    <Badge
                      key={s}
                      variant={active ? "default" : "outline"}
                      className="cursor-pointer capitalize text-xs"
                      onClick={() => {
                        const existing = (columnFilters.find((f) => f.id === "status")?.value as string[] | undefined) ?? []
                        const next = active
                          ? existing.filter((v) => v !== s)
                          : [...existing, s]
                        setColumnFilters(
                          next.length
                            ? [{ id: "status", value: next }]
                            : columnFilters.filter((f) => f.id !== "status")
                        )
                      }}
                    >
                      {s}
                    </Badge>
                  )
                })}
              </div>
            </div>

            {/* Table */}
            {loading ? (
              <div className="space-y-2">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Skeleton key={i} className="h-10 w-full rounded" />
                ))}
              </div>
            ) : (
              <div className="rounded-md border overflow-auto">
                <Table>
                  <TableHeader>
                    {table.getHeaderGroups().map((hg) => (
                      <TableRow key={hg.id}>
                        {hg.headers.map((h) => (
                          <TableHead key={h.id}>
                            {h.isPlaceholder ? null : flexRender(h.column.columnDef.header, h.getContext())}
                          </TableHead>
                        ))}
                      </TableRow>
                    ))}
                  </TableHeader>
                  <TableBody>
                    {table.getRowModel().rows.length ? (
                      table.getRowModel().rows.map((row) => (
                        <TableRow key={row.id}>
                          {row.getVisibleCells().map((cell) => (
                            <TableCell key={cell.id}>
                              {flexRender(cell.column.columnDef.cell, cell.getContext())}
                            </TableCell>
                          ))}
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={columns.length} className="h-24 text-center text-muted-foreground text-sm">
                          No bookings found.
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            )}

            {/* Pagination */}
            <div className="flex items-center justify-between text-sm text-muted-foreground">
              <span>{table.getFilteredRowModel().rows.length} booking(s)</span>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={() => table.previousPage()} disabled={!table.getCanPreviousPage()}>
                  Previous
                </Button>
                <Button variant="outline" size="sm" onClick={() => table.nextPage()} disabled={!table.getCanNextPage()}>
                  Next
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </>
  )
}
