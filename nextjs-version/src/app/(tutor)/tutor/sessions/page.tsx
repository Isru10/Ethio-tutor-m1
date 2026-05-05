"use client"

import { useEffect, useState, useMemo, useCallback } from "react"
import { useRouter } from "next/navigation"
import { format, isSameDay, startOfMonth, endOfMonth, eachDayOfInterval, getDay, addMonths, subMonths } from "date-fns"
import {
  type ColumnDef, type ColumnFiltersState, type SortingState,
  flexRender, getCoreRowModel, getFilteredRowModel,
  getPaginationRowModel, getSortedRowModel, useReactTable,
} from "@tanstack/react-table"
import {
  Plus, Video, CheckCircle2, Clock, CalendarDays, Users, Trash2,
  Loader2, Pencil, ChevronLeft, ChevronRight, Zap, ArrowUpDown,
  Search, X, Calendar, BookOpen,
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { cn } from "@/lib/utils"
import { useAuthStore } from "@/lib/store/useAuthStore"
import { slotService } from "@/lib/services/slotService"
import { getTutorSessionsApi, startSessionApi, type TutorSession } from "@/lib/services/sessionService"
import { EditSlotDialog } from "./components/edit-slot-dialog"
import { toast } from "sonner"

type Slot = {
  slot_id: number; slot_date: string; start_time: string; end_time: string
  grade_from: number; grade_to: number; max_students: number; remaining_seats: number
  status: string; subject: { name: string }; bookings: Array<{ status: string }>
}

const SUBJECT_COLORS: Record<string,string> = {
  Mathematics:"#3b82f6",Physics:"#8b5cf6",Chemistry:"#f59e0b",Biology:"#10b981",
  English:"#ef4444",Amharic:"#ec4899",History:"#f97316",Geography:"#06b6d4",
  Civics:"#14b8a6",ICT:"#6366f1",
}

const STATUS_STYLES: Record<string,string> = {
  available: "bg-green-100 text-green-700 dark:bg-green-950/30 dark:text-green-400",
  full:      "bg-red-100 text-red-700 dark:bg-red-950/30 dark:text-red-400",
  completed: "bg-muted text-muted-foreground",
  cancelled: "bg-rose-100 text-rose-700 dark:bg-rose-950/30 dark:text-rose-400",
}

function slotColor(name: string) { return SUBJECT_COLORS[name] ?? "#6366f1" }
function dateStr(slot: Slot) {
  return typeof slot.slot_date === "string"
    ? slot.slot_date.split("T")[0]
    : new Date(slot.slot_date).toISOString().split("T")[0]
}

export default function TutorSessionsPage() {
  const { user } = useAuthStore()
  const router   = useRouter()

  const [slots,        setSlots]        = useState<Slot[]>([])
  const [liveSessions, setLiveSessions] = useState<TutorSession[]>([])
  const [loading,      setLoading]      = useState(true)
  const [calendarOpen, setCalendarOpen] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<Slot | null>(null)
  const [editTarget,   setEditTarget]   = useState<Slot | null>(null)
  const [startingId,   setStartingId]   = useState<number | null>(null)
  const [currentMonth, setCurrentMonth] = useState(new Date())
  const [selectedDay,  setSelectedDay]  = useState<Date | null>(null)

  // Table state
  const [globalFilter,   setGlobalFilter]   = useState("")
  const [sorting,        setSorting]        = useState<SortingState>([])
  const [columnFilters,  setColumnFilters]  = useState<ColumnFiltersState>([])

  const loadData = useCallback(async () => {
    try {
      const [mySlots, mySessions] = await Promise.all([
        slotService.getMySlots(),
        getTutorSessionsApi().catch(() => [] as TutorSession[]),
      ])
      setSlots(mySlots)
      setLiveSessions(mySessions.filter(s => s.status === "live"))
    } catch { /* silent */ }
    finally { setLoading(false) }
  }, [])

  useEffect(() => { if (user) loadData() }, [user, loadData])

  // Build a map: "YYYY-MM-DD|HH:mm" → TutorSession for quick lookup
  const liveSessionBySlotKey = useMemo(() => {
    const map = new Map<string, TutorSession>()
    for (const s of liveSessions) {
      const dateKey = typeof s.slot.slot_date === "string"
        ? s.slot.slot_date.split("T")[0]
        : new Date(s.slot.slot_date).toISOString().split("T")[0]
      map.set(`${dateKey}|${s.slot.start_time.slice(0,5)}`, s)
    }
    return map
  }, [liveSessions])

  const getLiveSession = (slot: Slot): TutorSession | undefined => {
    const key = `${dateStr(slot)}|${slot.start_time.slice(0,5)}`
    return liveSessionBySlotKey.get(key)
  }

  const stats = useMemo(() => ({
    total:     slots.length,
    available: slots.filter(s => s.status === "available").length,
    live:      liveSessions.length,
    completed: slots.filter(s => s.status === "completed").length,
  }), [slots, liveSessions])

  // Calendar helpers
  const monthDays  = useMemo(() => eachDayOfInterval({ start: startOfMonth(currentMonth), end: endOfMonth(currentMonth) }), [currentMonth])
  const startPad   = getDay(startOfMonth(currentMonth))
  const slotsByDate = useMemo(() => {
    const map = new Map<string, Slot[]>()
    for (const s of slots) { const k = dateStr(s); if (!map.has(k)) map.set(k, []); map.get(k)!.push(s) }
    return map
  }, [slots])
  const selectedDaySlots = useMemo(() => selectedDay ? (slotsByDate.get(format(selectedDay,"yyyy-MM-dd")) ?? []) : [], [selectedDay, slotsByDate])

  const handleDelete = async (slotId: number) => {
    try {
      await slotService.deleteSlot(slotId)
      setSlots(prev => prev.filter(s => s.slot_id !== slotId))
      setDeleteTarget(null)
      toast.success("Slot deleted.")
    } catch (err: any) { toast.error(err.message) }
  }

  const handleStartSession = async (bookingId: number) => {
    try {
      setStartingId(bookingId)
      const res = await startSessionApi(bookingId)
      router.push(`/room/${res.roomName}`)
    } catch (err: any) { toast.error(err.message); setStartingId(null) }
  }

  // ── TanStack columns ──────────────────────────────────────
  const columns: ColumnDef<Slot>[] = [
    {
      accessorKey: "subject",
      header: ({ column }) => (
        <Button variant="ghost" size="sm" className="-ml-3 h-8" onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}>
          Subject <ArrowUpDown className="ml-1.5 size-3.5" />
        </Button>
      ),
      accessorFn: row => row.subject.name,
      cell: ({ row }) => {
        const name = row.original.subject.name
        return (
          <div className="flex items-center gap-2">
            <div className="h-2.5 w-2.5 rounded-full shrink-0" style={{ backgroundColor: slotColor(name) }} />
            <span className="font-medium text-sm">{name}</span>
          </div>
        )
      },
    },
    {
      accessorKey: "slot_date",
      header: ({ column }) => (
        <Button variant="ghost" size="sm" className="-ml-3 h-8" onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}>
          Date <ArrowUpDown className="ml-1.5 size-3.5" />
        </Button>
      ),
      cell: ({ row }) => {
        const raw = dateStr(row.original)
        return <span className="text-sm">{format(new Date(raw+"T00:00"),"EEE, MMM d yyyy")}</span>
      },
    },
    {
      id: "time",
      header: "Time",
      cell: ({ row }) => (
        <span className="text-sm text-muted-foreground">{row.original.start_time} – {row.original.end_time}</span>
      ),
    },
    {
      id: "grade",
      header: "Grade",
      cell: ({ row }) => (
        <Badge variant="outline" className="text-xs">
          {row.original.grade_from === row.original.grade_to
            ? `Grade ${row.original.grade_from}`
            : `Grade ${row.original.grade_from}–${row.original.grade_to}`}
        </Badge>
      ),
    },
    {
      id: "seats",
      header: "Seats",
      cell: ({ row }) => {
        const s = row.original
        const booked = s.max_students - s.remaining_seats
        return (
          <div className="flex items-center gap-1.5 text-sm">
            <Users className="size-3.5 text-muted-foreground" />
            <span className="font-medium">{booked}</span>
            <span className="text-muted-foreground">/ {s.max_students}</span>
          </div>
        )
      },
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => {
        const s = row.original.status
        return (
          <Badge variant="secondary" className={cn("text-xs capitalize", STATUS_STYLES[s] ?? "")}>
            {s}
          </Badge>
        )
      },
    },
    {
      id: "actions",
      header: "",
      cell: ({ row }) => {
        const slot = row.original
        const confirmedBookings = slot.bookings.filter(b => b.status === "confirmed")
        const liveSession = getLiveSession(slot)
        const isLive = !!liveSession

        return (
          <div className="flex items-center gap-1 justify-end">
            {/* Rejoin — session already live */}
            {isLive && (
              <Button size="sm" className="h-7 text-xs gap-1 bg-blue-600 hover:bg-blue-700 text-white"
                onClick={() => router.push(`/room/${liveSession.session_id}`)}>
                <Video className="size-3" /> Rejoin
              </Button>
            )}
            {/* Start — not live yet but has confirmed students */}
            {!isLive && slot.status === "available" && confirmedBookings.length > 0 && (
              <Button size="sm" className="h-7 text-xs gap-1 bg-green-600 hover:bg-green-700 text-white"
                onClick={() => router.push(`/tutor/bookings/${slot.slot_id}`)}>
                <Video className="size-3" /> Start
              </Button>
            )}
            {/* Edit — only when not live and not completed/cancelled */}
            {!isLive && slot.status !== "completed" && slot.status !== "cancelled" && (
              <Button size="sm" variant="ghost" className="h-7 w-7 p-0 text-muted-foreground hover:text-foreground"
                onClick={() => setEditTarget(slot)}>
                <Pencil className="size-3.5" />
              </Button>
            )}
            <Button size="sm" variant="ghost" className="h-7 w-7 p-0 text-destructive hover:text-destructive hover:bg-destructive/10"
              onClick={() => setDeleteTarget(slot)}>
              <Trash2 className="size-3.5" />
            </Button>
          </div>
        )
      },
    },
  ]

  const setFilter = (id: string, value: string) => {
    setColumnFilters(prev => {
      const without = prev.filter(f => f.id !== id)
      return value ? [...without, { id, value }] : without
    })
  }
  const statusFilter  = (columnFilters.find(f => f.id === "status")?.value  as string) ?? ""
  const subjectFilter = (columnFilters.find(f => f.id === "subject")?.value as string) ?? ""

  const table = useReactTable({
    data: slots,
    columns,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    onGlobalFilterChange: setGlobalFilter,
    state: { sorting, columnFilters, globalFilter },
    initialState: { pagination: { pageSize: 10 } },
  })

  if (loading) return (
    <div className="px-4 lg:px-6 space-y-6">
      <Skeleton className="h-8 w-56" />
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">{Array.from({length:4}).map((_,i)=><Skeleton key={i} className="h-24 rounded-xl" />)}</div>
      <Skeleton className="h-64 rounded-xl" />
    </div>
  )

  return (
    <>
      {/* Header */}
      <div className="px-4 lg:px-6 flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Sessions & Slots</h1>
          <p className="text-muted-foreground text-sm">Manage your teaching schedule.</p>
        </div>
        <Button className="gap-2 shrink-0" onClick={() => router.push("/tutor/new-session")}>
          <Plus className="size-4" /> New Session
        </Button>
      </div>

      {/* Stats */}
      <div className="px-4 lg:px-6 grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label:"Total Slots",  value:stats.total,     icon:CalendarDays, color:"text-foreground"       },
          { label:"Available",    value:stats.available, icon:Clock,        color:"text-green-500"         },
          { label:"Live Now",     value:stats.live,      icon:Zap,          color:"text-blue-500"          },
          { label:"Completed",    value:stats.completed, icon:CheckCircle2, color:"text-muted-foreground"  },
        ].map(({ label, value, icon: Icon, color }) => (
          <Card key={label}>
            <CardContent className="pt-5">
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

      {/* Live sessions banner */}
      {liveSessions.length > 0 && (
        <div className="px-4 lg:px-6">
          <div className="rounded-xl border border-green-300 dark:border-green-800 bg-green-50 dark:bg-green-950/20 p-4 space-y-3">
            <div className="flex items-center gap-2">
              <span className="h-2.5 w-2.5 rounded-full bg-green-500 animate-pulse" />
              <span className="font-semibold text-green-700 dark:text-green-400">Live Sessions Right Now</span>
            </div>
            <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
              {liveSessions.map(s => (
                <div key={s.session_id} className="flex items-center justify-between rounded-lg bg-white dark:bg-green-950/30 border border-green-200 dark:border-green-800 px-3 py-2.5 gap-3">
                  <div className="min-w-0">
                    <p className="font-medium text-sm truncate">{s.slot.subject.name}</p>
                    <p className="text-xs text-muted-foreground">{s.slot.start_time} – {s.slot.end_time}</p>
                  </div>
                  <Button size="sm" className="shrink-0 bg-green-600 hover:bg-green-700 text-white gap-1.5"
                    onClick={() => router.push(`/room/${s.session_id}`)}>
                    <Video className="size-3.5" /> Rejoin
                  </Button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Calendar toggle */}
      <div className="px-4 lg:px-6">
        <Collapsible open={calendarOpen} onOpenChange={setCalendarOpen}>
          <CollapsibleTrigger asChild>
            <Button variant="outline" size="sm" className="gap-2">
              <Calendar className="size-4" />
              {calendarOpen ? "Hide Calendar" : "Show Calendar"}
              <ChevronRight className={cn("size-3.5 transition-transform", calendarOpen && "rotate-90")} />
            </Button>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <div className="mt-3 grid gap-4 lg:grid-cols-[1fr_300px]">
              {/* Calendar */}
              <Card>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base">{format(currentMonth,"MMMM yyyy")}</CardTitle>
                    <div className="flex gap-1">
                      <Button variant="outline" size="icon" className="h-7 w-7" onClick={() => setCurrentMonth(subMonths(currentMonth,1))}><ChevronLeft className="size-4" /></Button>
                      <Button variant="outline" size="sm" className="h-7 px-2 text-xs" onClick={() => setCurrentMonth(new Date())}>Today</Button>
                      <Button variant="outline" size="icon" className="h-7 w-7" onClick={() => setCurrentMonth(addMonths(currentMonth,1))}><ChevronRight className="size-4" /></Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-7 mb-1">
                    {["Sun","Mon","Tue","Wed","Thu","Fri","Sat"].map(d=>(
                      <div key={d} className="text-center text-xs font-medium text-muted-foreground py-1">{d}</div>
                    ))}
                  </div>
                  <div className="grid grid-cols-7 gap-0.5">
                    {Array.from({length:startPad}).map((_,i)=><div key={`p${i}`} />)}
                    {monthDays.map(day => {
                      const key = format(day,"yyyy-MM-dd")
                      const daySlots = slotsByDate.get(key) ?? []
                      const isSelected = selectedDay ? isSameDay(day,selectedDay) : false
                      const isToday = isSameDay(day,new Date())
                      return (
                        <button key={key} onClick={() => setSelectedDay(isSameDay(day,selectedDay??new Date("")) ? null : day)}
                          className={cn(
                            "relative flex flex-col items-center rounded-lg p-1.5 min-h-[52px] text-sm transition-colors hover:bg-muted/60",
                            isSelected && "bg-primary/10 ring-1 ring-primary",
                            isToday && !isSelected && "bg-muted font-semibold",
                          )}>
                          <span className={cn("text-xs leading-none", isToday && "text-primary font-bold")}>{format(day,"d")}</span>
                          {daySlots.length > 0 && (
                            <div className="flex gap-0.5 mt-1.5 flex-wrap justify-center">
                              {daySlots.some(s=>s.status==="available") && <span className="h-1.5 w-1.5 rounded-full bg-green-500" />}
                              {daySlots.some(s=>s.status==="completed") && <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground/40" />}
                            </div>
                          )}
                        </button>
                      )
                    })}
                  </div>
                </CardContent>
              </Card>
              {/* Day panel */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">{selectedDay ? format(selectedDay,"EEEE, MMM d") : "Select a day"}</CardTitle>
                  <p className="text-xs text-muted-foreground">
                    {selectedDay ? (selectedDaySlots.length > 0 ? `${selectedDaySlots.length} slot(s)` : "No slots") : "Click a day to see slots"}
                  </p>
                </CardHeader>
                <CardContent className="space-y-2">
                  {!selectedDay && (
                    <div className="flex flex-col items-center justify-center py-8 gap-2">
                      <CalendarDays className="size-8 text-muted-foreground/30" />
                      <p className="text-xs text-muted-foreground">No day selected</p>
                    </div>
                  )}
                  {selectedDay && selectedDaySlots.length === 0 && (
                    <div className="flex flex-col items-center justify-center py-8 gap-3">
                      <CalendarDays className="size-8 text-muted-foreground/30" />
                      <p className="text-xs text-muted-foreground">No slots on this day</p>
                    </div>
                  )}
                  {selectedDaySlots.map(slot => (
                    <div key={slot.slot_id} className="rounded-lg border p-3 space-y-2">
                      <div className="flex items-center gap-2">
                        <div className="h-7 w-7 rounded-lg flex items-center justify-center text-white text-[10px] font-bold shrink-0"
                          style={{ backgroundColor: slotColor(slot.subject.name) }}>
                          {slot.subject.name.slice(0,2).toUpperCase()}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-sm">{slot.subject.name}</p>
                          <p className="text-xs text-muted-foreground">{slot.start_time} – {slot.end_time}</p>
                        </div>
                        <Badge variant="secondary" className={cn("text-[10px] capitalize", STATUS_STYLES[slot.status]??"")}>{slot.status}</Badge>
                      </div>
                      <div className="flex gap-1.5">
                        <Button size="sm" variant="ghost" className="h-6 text-xs gap-1 text-muted-foreground" onClick={() => setEditTarget(slot)}>
                          <Pencil className="size-3" /> Edit
                        </Button>
                        <Button size="sm" variant="ghost" className="h-6 text-xs gap-1 text-destructive hover:bg-destructive/10" onClick={() => setDeleteTarget(slot)}>
                          <Trash2 className="size-3" /> Delete
                        </Button>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </div>
          </CollapsibleContent>
        </Collapsible>
      </div>

      {/* Rich Table */}
      <div className="px-4 lg:px-6 space-y-4">
        {/* Toolbar */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative max-w-xs flex-1">
            <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input placeholder="Search subject…" value={globalFilter} onChange={e => setGlobalFilter(e.target.value)} className="pl-9 h-9" />
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <Select value={statusFilter || "all"} onValueChange={v => setFilter("status", v === "all" ? "" : v)}>
              <SelectTrigger className="w-36 h-9"><SelectValue placeholder="All Status" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="available">Available</SelectItem>
                <SelectItem value="full">Full</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
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

        {/* Table */}
        <div className="rounded-lg border overflow-hidden">
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
                  <TableRow
                    key={row.id}
                    className="hover:bg-muted/30 transition-colors cursor-pointer"
                    onClick={e => {
                      // Don't navigate if the click was on a button/action inside the row
                      if ((e.target as HTMLElement).closest("button,a")) return
                      router.push(`/tutor/bookings/${row.original.slot_id}`)
                    }}
                  >
                    {row.getVisibleCells().map(cell => (
                      <TableCell key={cell.id}>{flexRender(cell.column.columnDef.cell, cell.getContext())}</TableCell>
                    ))}
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={columns.length} className="h-32 text-center text-muted-foreground text-sm">
                    {slots.length === 0 ? "No sessions yet. Create your first session." : "No results match your filters."}
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>

        {/* Pagination */}
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">{table.getFilteredRowModel().rows.length} slot(s)</p>
          <div className="flex items-center gap-2">
            <Select value={String(table.getState().pagination.pageSize)} onValueChange={v => table.setPageSize(Number(v))}>
              <SelectTrigger className="w-24 h-8"><SelectValue /></SelectTrigger>
              <SelectContent>{[10,20,50].map(n=><SelectItem key={n} value={String(n)}>{n} / page</SelectItem>)}</SelectContent>
            </Select>
            <Button variant="outline" size="sm" onClick={() => table.previousPage()} disabled={!table.getCanPreviousPage()}>Previous</Button>
            <span className="text-sm text-muted-foreground">{table.getState().pagination.pageIndex+1} / {table.getPageCount()}</span>
            <Button variant="outline" size="sm" onClick={() => table.nextPage()} disabled={!table.getCanNextPage()}>Next</Button>
          </div>
        </div>
      </div>

      {/* Empty state */}
      {slots.length === 0 && !loading && (
        <div className="px-4 lg:px-6 flex flex-col items-center justify-center py-16 text-center gap-4">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-muted">
            <BookOpen className="size-8 text-muted-foreground/50" />
          </div>
          <div className="space-y-1">
            <p className="font-semibold">No sessions yet</p>
            <p className="text-sm text-muted-foreground">Create your first teaching slot so students can find and book you.</p>
          </div>
          <Button className="gap-2" onClick={() => router.push("/tutor/new-session")}>
            <Plus className="size-4" /> New Session
          </Button>
        </div>
      )}

      {/* Delete dialog */}
      <Dialog open={!!deleteTarget} onOpenChange={() => setDeleteTarget(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Delete Slot</DialogTitle>
            <DialogDescription>
              Permanently delete the <strong>{deleteTarget?.subject.name}</strong> slot on{" "}
              {deleteTarget ? format(new Date(dateStr(deleteTarget)+"T00:00"),"MMM d, yyyy") : ""}? This cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setDeleteTarget(null)}>Cancel</Button>
            <Button variant="destructive" onClick={() => deleteTarget && handleDelete(deleteTarget.slot_id)}>Delete</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <EditSlotDialog slot={editTarget} open={!!editTarget} onOpenChange={v => { if (!v) setEditTarget(null) }} onUpdated={loadData} />
    </>
  )
}
