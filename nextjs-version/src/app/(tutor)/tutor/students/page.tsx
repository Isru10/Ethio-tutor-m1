"use client"

import { useEffect, useState, useMemo, useCallback } from "react"
import { useRouter } from "next/navigation"
import {
  type ColumnDef, type SortingState, type ColumnFiltersState,
  flexRender, getCoreRowModel, getSortedRowModel,
  getFilteredRowModel, getPaginationRowModel, useReactTable,
} from "@tanstack/react-table"
import {
  Users, TrendingUp, BookCheck, GraduationCap, Search,
  MessageSquare, ArrowUpDown, Loader2, X,
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Skeleton } from "@/components/ui/skeleton"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { useAuthStore } from "@/lib/store/useAuthStore"
import { chatService } from "@/lib/services/chatService"
import { API_BASE } from "@/lib/api"
import { toast } from "sonner"
import { cn } from "@/lib/utils"

// ─── Types ────────────────────────────────────────────────────
interface StudentRow {
  user_id:       number
  name:          string
  email:         string
  totalSessions: number
  completedSessions: number
  subjects:      string[]
  lastSession:   string | null
  totalPaid:     number
  status:        "active" | "inactive"
}

function authHeaders(token: string | null) {
  return { Authorization: `Bearer ${token}` }
}

export default function TutorStudentsPage() {
  const { user, accessToken } = useAuthStore()
  const router = useRouter()

  const [rows,    setRows]    = useState<StudentRow[]>([])
  const [loading, setLoading] = useState(true)
  const [messagingId, setMessagingId] = useState<number | null>(null)

  // Table state
  const [sorting,       setSorting]       = useState<SortingState>([])
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([])
  const [globalFilter,  setGlobalFilter]  = useState("")

  const load = useCallback(async () => {
    if (!accessToken) return
    try {
      // Get all tutor bookings — derive unique students from them
      const res = await fetch(`${API_BASE}/bookings/tutor`, { headers: authHeaders(accessToken) })
      const data = await res.json()
      const bookings: any[] = data.data ?? []

      // Aggregate by student user_id
      const map = new Map<number, StudentRow>()
      for (const b of bookings) {
        const studentUser = b.student?.user
        if (!studentUser) continue
        const uid = studentUser.user_id
        const subjectName = b.slot?.subject?.name ?? "Unknown"
        const slotDate    = b.slot?.slot_date
          ? (typeof b.slot.slot_date === "string" ? b.slot.slot_date.split("T")[0] : new Date(b.slot.slot_date).toISOString().split("T")[0])
          : null
        const amount = Number(b.transaction?.total_amount ?? 0)
        const isCompleted = b.status === "completed"

        if (!map.has(uid)) {
          map.set(uid, {
            user_id:           uid,
            name:              studentUser.name ?? "Unknown",
            email:             studentUser.email ?? "",
            totalSessions:     0,
            completedSessions: 0,
            subjects:          [],
            lastSession:       null,
            totalPaid:         0,
            status:            "inactive",
          })
        }
        const row = map.get(uid)!
        row.totalSessions++
        if (isCompleted) row.completedSessions++
        if (!row.subjects.includes(subjectName)) row.subjects.push(subjectName)
        if (slotDate && (!row.lastSession || slotDate > row.lastSession)) row.lastSession = slotDate
        row.totalPaid += amount
        if (isCompleted) row.status = "active"
      }

      setRows(Array.from(map.values()).sort((a, b) => b.completedSessions - a.completedSessions))
    } catch (err: any) {
      toast.error("Could not load students")
    } finally {
      setLoading(false)
    }
  }, [accessToken])

  useEffect(() => { if (user) load() }, [user, load])

  const stats = useMemo(() => ({
    total:         rows.length,
    active:        rows.filter(r => r.status === "active").length,
    totalSessions: rows.reduce((a, r) => a + r.completedSessions, 0),
    totalRevenue:  rows.reduce((a, r) => a + r.totalPaid, 0),
  }), [rows])

  const handleMessage = async (studentUserId: number) => {
    setMessagingId(studentUserId)
    try {
      const conv = await chatService.startConversation(studentUserId)
      // Navigate to chat and select this conversation
      router.push(`/tutor/chat`)
      // Small delay to let the page load, then select the conversation
      setTimeout(() => {
        const { useChat } = require("@/app/(tutor)/tutor/chat/use-chat")
        useChat.getState().setSelectedConversation(String(conv.conversation_id))
      }, 500)
    } catch (err: any) {
      toast.error(err.message || "Could not start conversation")
    } finally {
      setMessagingId(null)
    }
  }

  const statusFilter = (columnFilters.find(f => f.id === "status")?.value as string) ?? ""
  const setFilter = (id: string, value: string) => {
    setColumnFilters(prev => {
      const without = prev.filter(f => f.id !== id)
      return value ? [...without, { id, value }] : without
    })
  }

  const columns: ColumnDef<StudentRow>[] = [
    {
      accessorKey: "name",
      header: ({ column }) => (
        <Button variant="ghost" size="sm" className="-ml-3 h-8" onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}>
          Student <ArrowUpDown className="ml-1.5 size-3.5" />
        </Button>
      ),
      cell: ({ row }) => {
        const { name, email } = row.original
        const initials = name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2)
        return (
          <div className="flex items-center gap-2.5">
            <Avatar className="h-8 w-8 shrink-0">
              <AvatarFallback className="text-xs font-bold bg-primary/10 text-primary">{initials}</AvatarFallback>
            </Avatar>
            <div className="min-w-0">
              <p className="font-medium text-sm truncate">{name}</p>
              <p className="text-xs text-muted-foreground truncate">{email}</p>
            </div>
          </div>
        )
      },
    },
    {
      accessorKey: "subjects",
      header: "Subjects",
      cell: ({ row }) => (
        <div className="flex flex-wrap gap-1">
          {row.original.subjects.slice(0, 3).map(s => (
            <Badge key={s} variant="outline" className="text-xs">{s}</Badge>
          ))}
          {row.original.subjects.length > 3 && (
            <Badge variant="outline" className="text-xs">+{row.original.subjects.length - 3}</Badge>
          )}
        </div>
      ),
    },
    {
      accessorKey: "completedSessions",
      header: ({ column }) => (
        <Button variant="ghost" size="sm" className="-ml-3 h-8" onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}>
          Sessions <ArrowUpDown className="ml-1.5 size-3.5" />
        </Button>
      ),
      cell: ({ row }) => (
        <div className="text-sm">
          <span className="font-semibold">{row.original.completedSessions}</span>
          <span className="text-muted-foreground"> / {row.original.totalSessions} booked</span>
        </div>
      ),
    },
    {
      accessorKey: "lastSession",
      header: "Last Session",
      cell: ({ row }) => (
        <span className="text-sm text-muted-foreground">
          {row.original.lastSession
            ? new Date(row.original.lastSession + "T00:00").toLocaleDateString("en-ET", { month: "short", day: "numeric", year: "numeric" })
            : "—"}
        </span>
      ),
    },
    {
      accessorKey: "totalPaid",
      header: ({ column }) => (
        <Button variant="ghost" size="sm" className="-ml-3 h-8" onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}>
          Revenue <ArrowUpDown className="ml-1.5 size-3.5" />
        </Button>
      ),
      cell: ({ row }) => (
        <span className="font-medium text-green-600 dark:text-green-400">
          {row.original.totalPaid > 0 ? `${row.original.totalPaid.toLocaleString()} ETB` : "—"}
        </span>
      ),
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => {
        const s = row.original.status
        return (
          <Badge variant="secondary" className={cn(
            "text-xs capitalize",
            s === "active" ? "bg-green-100 text-green-700 dark:bg-green-950/30 dark:text-green-400" : "bg-muted text-muted-foreground"
          )}>
            {s}
          </Badge>
        )
      },
    },
    {
      id: "actions",
      header: "",
      cell: ({ row }) => {
        const uid = row.original.user_id
        const isMessaging = messagingId === uid
        return (
          <Button
            size="sm"
            variant="outline"
            className="h-7 gap-1.5 text-xs"
            disabled={isMessaging}
            onClick={() => handleMessage(uid)}
          >
            {isMessaging
              ? <Loader2 className="size-3 animate-spin" />
              : <MessageSquare className="size-3" />}
            Message
          </Button>
        )
      },
    },
  ]

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
      <div className="px-4 lg:px-6">
        <h1 className="text-2xl font-bold tracking-tight">My Students</h1>
        <p className="text-muted-foreground text-sm">All students you have taught. Click Message to start a conversation.</p>
      </div>

      {/* Stats */}
      <div className="px-4 lg:px-6 grid gap-4 grid-cols-2 md:grid-cols-4">
        {[
          { label: "Total Students",    value: loading ? "–" : stats.total,                                    icon: Users,         color: "text-foreground"  },
          { label: "Active Students",   value: loading ? "–" : stats.active,                                   icon: GraduationCap, color: "text-blue-500"    },
          { label: "Sessions Taught",   value: loading ? "–" : stats.totalSessions,                            icon: BookCheck,     color: "text-purple-500"  },
          { label: "Revenue Generated", value: loading ? "–" : `${stats.totalRevenue.toLocaleString()} ETB`,   icon: TrendingUp,    color: "text-green-500"   },
        ].map(({ label, value, icon: Icon, color }) => (
          <Card key={label}>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-muted-foreground text-sm font-medium">{label}</p>
                  <p className="text-2xl font-bold mt-1">{value}</p>
                </div>
                <div className="bg-secondary rounded-lg p-3"><Icon className={`size-5 ${color}`} /></div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Table */}
      <div className="px-4 lg:px-6">
        <Card>
          <CardHeader>
            <CardTitle>Student Records</CardTitle>
            <CardDescription>All unique students who have booked sessions with you.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Toolbar */}
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="relative max-w-xs flex-1">
                <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search student…"
                  value={globalFilter}
                  onChange={e => setGlobalFilter(e.target.value)}
                  className="pl-9 h-9"
                />
              </div>
              <div className="flex items-center gap-2">
                <Select value={statusFilter || "all"} onValueChange={v => setFilter("status", v === "all" ? "" : v)}>
                  <SelectTrigger className="w-32 h-9"><SelectValue placeholder="All" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="inactive">Inactive</SelectItem>
                  </SelectContent>
                </Select>
                {(statusFilter || globalFilter) && (
                  <Button variant="ghost" size="sm" className="h-9 gap-1.5 text-muted-foreground"
                    onClick={() => { setColumnFilters([]); setGlobalFilter("") }}>
                    <X className="size-3.5" /> Clear
                  </Button>
                )}
              </div>
            </div>

            {loading ? (
              <div className="space-y-2">{Array.from({length:6}).map((_,i) => <Skeleton key={i} className="h-12 w-full rounded" />)}</div>
            ) : (
              <div className="rounded-md border overflow-auto">
                <Table>
                  <TableHeader className="bg-muted/40">
                    {table.getHeaderGroups().map(hg => (
                      <TableRow key={hg.id}>
                        {hg.headers.map(h => (
                          <TableHead key={h.id} className="text-xs font-semibold">
                            {h.isPlaceholder ? null : flexRender(h.column.columnDef.header, h.getContext())}
                          </TableHead>
                        ))}
                      </TableRow>
                    ))}
                  </TableHeader>
                  <TableBody>
                    {table.getRowModel().rows.length ? (
                      table.getRowModel().rows.map(row => (
                        <TableRow key={row.id} className="hover:bg-muted/30 transition-colors">
                          {row.getVisibleCells().map(cell => (
                            <TableCell key={cell.id}>{flexRender(cell.column.columnDef.cell, cell.getContext())}</TableCell>
                          ))}
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={columns.length} className="h-32 text-center text-muted-foreground text-sm">
                          {rows.length === 0 ? "No students yet. Students will appear here once they book your sessions." : "No results match your filters."}
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            )}

            {/* Pagination */}
            <div className="flex items-center justify-between text-sm text-muted-foreground">
              <span>{table.getFilteredRowModel().rows.length} student(s)</span>
              <div className="flex items-center gap-2">
                <Select value={String(table.getState().pagination.pageSize)} onValueChange={v => table.setPageSize(Number(v))}>
                  <SelectTrigger className="w-24 h-8"><SelectValue /></SelectTrigger>
                  <SelectContent>{[10,20,50].map(n => <SelectItem key={n} value={String(n)}>{n} / page</SelectItem>)}</SelectContent>
                </Select>
                <Button variant="outline" size="sm" onClick={() => table.previousPage()} disabled={!table.getCanPreviousPage()}>Previous</Button>
                <span>{table.getState().pagination.pageIndex + 1} / {table.getPageCount()}</span>
                <Button variant="outline" size="sm" onClick={() => table.nextPage()} disabled={!table.getCanNextPage()}>Next</Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </>
  )
}
