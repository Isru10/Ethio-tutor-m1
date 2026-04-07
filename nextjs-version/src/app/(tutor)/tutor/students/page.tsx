"use client"

import { useEffect, useState, useMemo } from "react"
import {
  Users, TrendingUp, BookCheck, GraduationCap, Search,
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Skeleton } from "@/components/ui/skeleton"
import {
  useReactTable, getCoreRowModel, getSortedRowModel,
  getFilteredRowModel, getPaginationRowModel,
  flexRender, type SortingState, createColumnHelper,
} from "@tanstack/react-table"
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { useAuthStore } from "@/store/authStore"
import { getTutorStudents } from "@/lib/services/tutorService"
import type { TutorStudentRow } from "@/types/tutor"

export default function TutorStudentsPage() {
  const { user } = useAuthStore()
  const [rows, setRows] = useState<TutorStudentRow[]>([])
  const [loading, setLoading] = useState(true)
  const [sorting, setSorting] = useState<SortingState>([])
  const [globalFilter, setGlobalFilter] = useState("")

  useEffect(() => {
    if (!user) return
    getTutorStudents(user.user_id, user.tenant_id).then((data) => {
      setRows(data)
      setLoading(false)
    })
  }, [user])

  const stats = useMemo(() => ({
    total: rows.length,
    active: rows.filter(r => r.totalSessions > 0).length,
    totalSessions: rows.reduce((a, r) => a + r.totalSessions, 0),
    totalRevenue: rows.reduce((a, r) => a + r.totalPaid, 0),
  }), [rows])

  const col = createColumnHelper<TutorStudentRow>()
  const columns = useMemo(() => [
    col.accessor("name", {
      header: "Student",
      cell: (i) => {
        const initials = i.getValue().split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2)
        return (
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">
              {initials}
            </div>
            <span className="font-medium text-sm">{i.getValue()}</span>
          </div>
        )
      },
    }),
    col.accessor("grade", {
      header: "Grade",
      cell: (i) => <Badge variant="secondary">{i.getValue()}</Badge>,
    }),
    col.accessor("subjects", {
      header: "Subjects",
      cell: (i) => (
        <div className="flex flex-wrap gap-1">
          {i.getValue().map((s: string) => <Badge key={s} variant="outline" className="text-xs">{s}</Badge>)}
        </div>
      ),
    }),
    col.accessor("totalSessions", {
      header: "Sessions",
      cell: (i) => <span className="font-semibold">{i.getValue()}</span>,
    }),
    col.accessor("lastSession", {
      header: "Last Session",
      cell: (i) => <span className="text-sm text-muted-foreground">{i.getValue()}</span>,
    }),
    col.accessor("totalPaid", {
      header: "Revenue",
      cell: (i) => <span className="font-medium text-green-600 dark:text-green-400">{i.getValue().toLocaleString()} ETB</span>,
    }),
    col.accessor("status", {
      header: "Status",
      cell: (i) => {
        const v = i.getValue()
        return <span className={`px-2 py-0.5 rounded-full text-xs font-semibold capitalize ${v === "active" ? "bg-green-100 text-green-700 dark:bg-green-950/30 dark:text-green-400" : "bg-muted text-muted-foreground"}`}>{v}</span>
      },
    }),
  ], [])

  const table = useReactTable({
    data: rows,
    columns,
    state: { sorting, globalFilter },
    onSortingChange: setSorting,
    onGlobalFilterChange: setGlobalFilter,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    initialState: { pagination: { pageSize: 10 } },
  })

  return (
    <>
      <div className="px-4 lg:px-6">
        <h1 className="text-2xl font-bold tracking-tight">My Students</h1>
        <p className="text-muted-foreground text-sm">Complete record of all students you have taught.</p>
      </div>

      <div className="px-4 lg:px-6 grid gap-4 grid-cols-2 md:grid-cols-4">
        {[
          { label: "Total Students",   value: loading ? "–" : stats.total,                          icon: Users,          color: "text-foreground" },
          { label: "Active Students",  value: loading ? "–" : stats.active,                         icon: GraduationCap,  color: "text-blue-500" },
          { label: "Total Sessions",   value: loading ? "–" : stats.totalSessions,                   icon: BookCheck,      color: "text-purple-500" },
          { label: "Revenue Generated",value: loading ? "–" : `${stats.totalRevenue.toLocaleString()} ETB`, icon: TrendingUp, color: "text-green-500" },
        ].map(({ label, value, icon: Icon, color }) => (
          <Card key={label}>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-muted-foreground text-sm font-medium">{label}</p>
                  <p className="text-2xl font-bold mt-1">{value}</p>
                </div>
                <div className="bg-secondary rounded-lg p-3">
                  <Icon className={`size-5 ${color}`} />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="px-4 lg:px-6">
        <Card>
          <CardHeader>
            <CardTitle>Student Records</CardTitle>
            <CardDescription>All unique students who have completed at least one session with you.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="relative max-w-xs">
              <Search className="absolute left-2.5 top-2 size-3.5 text-muted-foreground" />
              <Input
                placeholder="Search student…"
                value={globalFilter}
                onChange={(e) => setGlobalFilter(e.target.value)}
                className="h-8 pl-8"
              />
            </div>
            {loading ? (
              <div className="space-y-2">{Array.from({ length: 8 }).map((_, i) => <Skeleton key={i} className="h-10 w-full rounded" />)}</div>
            ) : (
              <div className="rounded-md border overflow-auto">
                <Table>
                  <TableHeader>
                    {table.getHeaderGroups().map(hg => (
                      <TableRow key={hg.id}>
                        {hg.headers.map(h => <TableHead key={h.id}>{h.isPlaceholder ? null : flexRender(h.column.columnDef.header, h.getContext())}</TableHead>)}
                      </TableRow>
                    ))}
                  </TableHeader>
                  <TableBody>
                    {table.getRowModel().rows.length ? (
                      table.getRowModel().rows.map(row => (
                        <TableRow key={row.id}>
                          {row.getVisibleCells().map(cell => <TableCell key={cell.id}>{flexRender(cell.column.columnDef.cell, cell.getContext())}</TableCell>)}
                        </TableRow>
                      ))
                    ) : (
                      <TableRow><TableCell colSpan={columns.length} className="h-24 text-center text-muted-foreground text-sm">No students found.</TableCell></TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            )}
            <div className="flex items-center justify-between text-sm text-muted-foreground">
              <span>{table.getFilteredRowModel().rows.length} student(s)</span>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={() => table.previousPage()} disabled={!table.getCanPreviousPage()}>Previous</Button>
                <Button variant="outline" size="sm" onClick={() => table.nextPage()} disabled={!table.getCanNextPage()}>Next</Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </>
  )
}
