"use client"

import { useEffect, useState, useMemo, useCallback } from "react"
import { useRouter } from "next/navigation"
import { format, isSameDay, startOfMonth, endOfMonth, eachDayOfInterval, getDay, addMonths, subMonths } from "date-fns"
import {
  Plus, Video, BookOpen, CheckCircle2, Clock,
  CalendarDays, Users, Trash2, Loader2, Pencil,
  ChevronLeft, ChevronRight, Zap,
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { Separator } from "@/components/ui/separator"
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
  DialogDescription, DialogFooter,
} from "@/components/ui/dialog"
import { cn } from "@/lib/utils"
import { useAuthStore } from "@/lib/store/useAuthStore"
import { slotService } from "@/lib/services/slotService"
import { getTutorSessionsApi, startSessionApi, type TutorSession } from "@/lib/services/sessionService"
import { NewSlotDialog } from "./components/new-slot-dialog"
import { EditSlotDialog } from "./components/edit-slot-dialog"

// ─── Types ────────────────────────────────────────────────────
type Slot = {
  slot_id: number
  slot_date: string
  start_time: string
  end_time: string
  grade_from: number
  grade_to: number
  max_students: number
  remaining_seats: number
  status: string
  subject: { name: string }
  bookings: Array<{ status: string }>
}

// ─── Constants ────────────────────────────────────────────────
const SUBJECT_COLORS: Record<string, string> = {
  Mathematics: "#3b82f6", Physics: "#8b5cf6", Chemistry: "#f59e0b",
  Biology: "#10b981", English: "#ef4444", Amharic: "#ec4899",
  History: "#f97316", Geography: "#06b6d4", Civics: "#14b8a6", ICT: "#6366f1",
}
const DEFAULT_COLOR = "#6366f1"

function slotColor(name: string) { return SUBJECT_COLORS[name] ?? DEFAULT_COLOR }

function dateStr(slot: Slot) {
  return typeof slot.slot_date === "string"
    ? slot.slot_date.split("T")[0]
    : new Date(slot.slot_date).toISOString().split("T")[0]
}

// ─── Main Page ────────────────────────────────────────────────
export default function TutorSessionsPage() {
  const { user } = useAuthStore()
  const router = useRouter()

  const [slots, setSlots] = useState<Slot[]>([])
  const [liveSessions, setLiveSessions] = useState<TutorSession[]>([])
  const [loading, setLoading] = useState(true)
  const [newSlotOpen, setNewSlotOpen] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<Slot | null>(null)
  const [editTarget, setEditTarget]     = useState<Slot | null>(null)
  const [startingId, setStartingId] = useState<number | null>(null)
  const [currentMonth, setCurrentMonth] = useState(new Date())
  const [selectedDay, setSelectedDay] = useState<Date | null>(null)

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

  // ── Calendar helpers ──────────────────────────────────────
  const monthDays = useMemo(() => {
    return eachDayOfInterval({ start: startOfMonth(currentMonth), end: endOfMonth(currentMonth) })
  }, [currentMonth])

  const startPad = getDay(startOfMonth(currentMonth))

  const slotsByDate = useMemo(() => {
    const map = new Map<string, Slot[]>()
    for (const slot of slots) {
      const key = dateStr(slot)
      if (!map.has(key)) map.set(key, [])
      map.get(key)!.push(slot)
    }
    return map
  }, [slots])

  const selectedDaySlots = useMemo(() => {
    if (!selectedDay) return []
    return slotsByDate.get(format(selectedDay, "yyyy-MM-dd")) ?? []
  }, [selectedDay, slotsByDate])

  // ── Stats ─────────────────────────────────────────────────
  const stats = useMemo(() => ({
    total:     slots.length,
    available: slots.filter(s => s.status === "available").length,
    live:      liveSessions.length,
    completed: slots.filter(s => s.status === "completed").length,
  }), [slots, liveSessions])

  // ── Actions ───────────────────────────────────────────────
  const handleDelete = async (slotId: number) => {
    try {
      await slotService.deleteSlot(slotId)
      setSlots(prev => prev.filter(s => s.slot_id !== slotId))
      setDeleteTarget(null)
    } catch (err: any) { alert(err.message) }
  }

  const handleStartSession = async (bookingId: number) => {
    try {
      setStartingId(bookingId)
      const res = await startSessionApi(bookingId)
      router.push(`/room/${res.roomName}`)
    } catch (err: any) {
      alert(err.message)
      setStartingId(null)
    }
  }

  if (loading) {
    return (
      <div className="px-4 lg:px-6 space-y-6">
        <Skeleton className="h-8 w-56" />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-24 rounded-xl" />)}
        </div>
        <Skeleton className="h-[480px] rounded-xl" />
      </div>
    )
  }

  return (
    <>
      {/* ── Header ── */}
      <div className="px-4 lg:px-6 flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Sessions & Slots</h1>
          <p className="text-muted-foreground text-sm">Manage your teaching schedule. Click a day to see its slots.</p>
        </div>
        <Button className="gap-2 shrink-0" onClick={() => router.push("/tutor/new-session")}>
          <Plus className="size-4" /> Add New Session
        </Button>
      </div>

      {/* ── Stats ── */}
      <div className="px-4 lg:px-6 grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: "Total Slots",  value: stats.total,     icon: CalendarDays, color: "text-foreground" },
          { label: "Available",    value: stats.available, icon: Clock,        color: "text-green-500"  },
          { label: "Live Now",     value: stats.live,      icon: Zap,          color: "text-blue-500"   },
          { label: "Completed",    value: stats.completed, icon: CheckCircle2, color: "text-muted-foreground" },
        ].map(({ label, value, icon: Icon, color }) => (
          <Card key={label}>
            <CardContent className="pt-5">
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

      {/* ── Live sessions banner ── */}
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
                  <Button
                    size="sm"
                    className="shrink-0 bg-green-600 hover:bg-green-700 text-white gap-1.5"
                    disabled={startingId === s.session_id}
                    onClick={() => router.push(`/room/${s.room_name}`)}
                  >
                    {startingId === s.session_id ? <Loader2 className="size-3.5 animate-spin" /> : <Video className="size-3.5" />}
                    Rejoin
                  </Button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── Calendar + Day panel ── */}
      <div className="px-4 lg:px-6 grid gap-4 lg:grid-cols-[1fr_320px]">
        {/* Calendar */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">{format(currentMonth, "MMMM yyyy")}</CardTitle>
              <div className="flex gap-1">
                <Button variant="outline" size="icon" className="h-7 w-7" onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}>
                  <ChevronLeft className="size-4" />
                </Button>
                <Button variant="outline" size="sm" className="h-7 px-2 text-xs" onClick={() => setCurrentMonth(new Date())}>Today</Button>
                <Button variant="outline" size="icon" className="h-7 w-7" onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}>
                  <ChevronRight className="size-4" />
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {/* Day-of-week headers */}
            <div className="grid grid-cols-7 mb-1">
              {["Sun","Mon","Tue","Wed","Thu","Fri","Sat"].map(d => (
                <div key={d} className="text-center text-xs font-medium text-muted-foreground py-1">{d}</div>
              ))}
            </div>
            {/* Day cells */}
            <div className="grid grid-cols-7 gap-0.5">
              {Array.from({ length: startPad }).map((_, i) => <div key={`pad-${i}`} />)}
              {monthDays.map(day => {
                const key = format(day, "yyyy-MM-dd")
                const daySlots = slotsByDate.get(key) ?? []
                const isSelected = selectedDay ? isSameDay(day, selectedDay) : false
                const isToday = isSameDay(day, new Date())
                const hasAvailable = daySlots.some(s => s.status === "available")
                const hasCompleted = daySlots.some(s => s.status === "completed")

                return (
                  <button
                    key={key}
                    onClick={() => setSelectedDay(isSameDay(day, selectedDay ?? new Date("")) ? null : day)}
                    className={cn(
                      "relative flex flex-col items-center rounded-lg p-1.5 min-h-[52px] text-sm transition-colors hover:bg-muted/60",
                      isSelected && "bg-primary/10 ring-1 ring-primary",
                      isToday && !isSelected && "bg-muted font-semibold",
                    )}
                  >
                    <span className={cn("text-xs leading-none", isToday && "text-primary font-bold")}>
                      {format(day, "d")}
                    </span>
                    {daySlots.length > 0 && (
                      <div className="flex gap-0.5 mt-1.5 flex-wrap justify-center">
                        {hasAvailable && <span className="h-1.5 w-1.5 rounded-full bg-green-500" />}
                        {hasCompleted && <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground/40" />}
                        {!hasAvailable && !hasCompleted && <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />}
                      </div>
                    )}
                  </button>
                )
              })}
            </div>
            {/* Legend */}
            <div className="flex gap-4 mt-3 text-xs text-muted-foreground">
              <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-green-500" /> Available</span>
              <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-amber-500" /> Full/Other</span>
              <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-muted-foreground/40" /> Completed</span>
            </div>
          </CardContent>
        </Card>

        {/* Day detail panel */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">
              {selectedDay ? format(selectedDay, "EEEE, MMM d") : "Select a day"}
            </CardTitle>
            <p className="text-xs text-muted-foreground">
              {selectedDay
                ? selectedDaySlots.length > 0
                  ? `${selectedDaySlots.length} slot${selectedDaySlots.length > 1 ? "s" : ""} scheduled`
                  : "No slots on this day"
                : "Click a day on the calendar to see its slots"}
            </p>
          </CardHeader>
          <CardContent className="space-y-3">
            {!selectedDay && (
              <div className="flex flex-col items-center justify-center py-10 text-center gap-2">
                <CalendarDays className="size-8 text-muted-foreground/30" />
                <p className="text-xs text-muted-foreground">No day selected</p>
              </div>
            )}

            {selectedDay && selectedDaySlots.length === 0 && (
              <div className="flex flex-col items-center justify-center py-10 text-center gap-3">
                <CalendarDays className="size-8 text-muted-foreground/30" />
                <p className="text-xs text-muted-foreground">No slots on this day</p>
                <Button size="sm" variant="outline" className="gap-1.5 text-xs" onClick={() => router.push("/tutor/new-session")}>
                  <Plus className="size-3.5" /> Add slot for this day
                </Button>
              </div>
            )}

            {selectedDaySlots.map(slot => {
              const color = slotColor(slot.subject.name)
              const confirmedBookings = slot.bookings.filter(b => b.status === "confirmed").length
              const statusCls =
                slot.status === "available" ? "bg-green-100 text-green-700 dark:bg-green-950/30 dark:text-green-400"
                : slot.status === "full"      ? "bg-red-100 text-red-700 dark:bg-red-950/30 dark:text-red-400"
                : slot.status === "completed" ? "bg-muted text-muted-foreground"
                : "bg-amber-100 text-amber-700"

              return (
                <div key={slot.slot_id} className="rounded-xl border p-3 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="h-8 w-8 rounded-lg flex items-center justify-center text-white text-xs font-bold shrink-0"
                        style={{ backgroundColor: color }}>
                        {slot.subject.name.slice(0, 2).toUpperCase()}
                      </div>
                      <div>
                        <p className="font-semibold text-sm">{slot.subject.name}</p>
                        <p className="text-xs text-muted-foreground">Grade {slot.grade_from}–{slot.grade_to}</p>
                      </div>
                    </div>
                    <span className={cn("text-[10px] font-semibold px-2 py-0.5 rounded-full capitalize", statusCls)}>
                      {slot.status}
                    </span>
                  </div>

                  <Separator />

                  <div className="grid grid-cols-2 gap-1.5 text-xs text-muted-foreground">
                    <div className="flex items-center gap-1.5">
                      <Clock className="size-3" />
                      <span>{slot.start_time} – {slot.end_time}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Users className="size-3" />
                      <span>{slot.remaining_seats}/{slot.max_students} seats</span>
                    </div>
                  </div>

                  {confirmedBookings > 0 && (
                    <div className="flex items-center gap-1.5 text-xs">
                      <BookOpen className="size-3 text-muted-foreground" />
                      <span className="text-muted-foreground">{confirmedBookings} confirmed booking{confirmedBookings > 1 ? "s" : ""}</span>
                    </div>
                  )}

                  <div className="flex gap-2 pt-0.5">
                    {slot.status === "available" && confirmedBookings > 0 && (
                      <Button
                        size="sm" className="flex-1 gap-1.5 text-xs h-7 bg-green-600 hover:bg-green-700 text-white"
                        disabled={startingId !== null}
                        onClick={() => handleStartSession(slot.bookings.findIndex(b => b.status === "confirmed"))}
                      >
                        {startingId !== null ? <Loader2 className="size-3 animate-spin" /> : <Video className="size-3" />}
                        Start Session
                      </Button>
                    )}
                    <Button
                      size="sm" variant="ghost"
                      className="gap-1 text-xs h-7 text-muted-foreground hover:text-foreground"
                      onClick={() => setEditTarget(slot)}
                    >
                      <Pencil className="size-3" /> Edit
                    </Button>
                    <Button
                      size="sm" variant="ghost"
                      className="gap-1 text-xs h-7 text-destructive hover:text-destructive hover:bg-destructive/10"
                      onClick={() => setDeleteTarget(slot)}
                    >
                      <Trash2 className="size-3" /> Delete
                    </Button>
                  </div>
                </div>
              )
            })}
          </CardContent>
        </Card>
      </div>

      {/* ── All upcoming slots list ── */}
      {slots.filter(s => s.status === "available").length > 0 && (
        <div className="px-4 lg:px-6 space-y-3">
          <h2 className="text-base font-semibold">All Available Slots</h2>
          <div className="space-y-2">
            {slots
              .filter(s => s.status === "available")
              .sort((a, b) => dateStr(a).localeCompare(dateStr(b)))
              .map(slot => {
                const color = slotColor(slot.subject.name)
                const raw = dateStr(slot)
                const dateLabel = format(new Date(raw + "T00:00"), "EEE, MMM d")
                return (
                  <div key={slot.slot_id} className="flex items-center gap-3 rounded-lg border px-4 py-3 text-sm hover:bg-muted/30 transition-colors">
                    <div className="h-2.5 w-2.5 rounded-full shrink-0" style={{ backgroundColor: color }} />
                    <span className="font-medium w-28 truncate">{slot.subject.name}</span>
                    <span className="text-muted-foreground hidden sm:block">{dateLabel}</span>
                    <span className="text-muted-foreground">{slot.start_time} – {slot.end_time}</span>
                    <Badge variant="outline" className="text-xs ml-auto">
                      Grade {slot.grade_from}–{slot.grade_to}
                    </Badge>
                    <span className="text-xs text-muted-foreground">{slot.remaining_seats}/{slot.max_students}</span>
                    <Button
                      size="sm" variant="ghost"
                      className="h-7 gap-1 text-xs text-destructive hover:text-destructive hover:bg-destructive/10"
                      onClick={() => setDeleteTarget(slot)}
                    >
                      <Trash2 className="size-3" />
                    </Button>
                  </div>
                )
              })}
          </div>
        </div>
      )}

      {/* ── Empty state ── */}
      {slots.length === 0 && (
        <div className="px-4 lg:px-6 flex flex-col items-center justify-center py-20 text-center gap-4">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-muted">
            <CalendarDays className="size-8 text-muted-foreground/50" />
          </div>
          <div className="space-y-1">
            <p className="font-semibold">No sessions yet</p>
            <p className="text-sm text-muted-foreground">Create your first teaching slot so students can find and book you.</p>
          </div>
          <Button className="gap-2" onClick={() => router.push("/tutor/new-session")}>
            <Plus className="size-4" /> Add New Session
          </Button>
        </div>
      )}

      {/* ── Delete Confirm Dialog ── */}
      <Dialog open={!!deleteTarget} onOpenChange={() => setDeleteTarget(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Delete Slot</DialogTitle>
            <DialogDescription>
              Permanently delete the <strong>{deleteTarget?.subject.name}</strong> slot on{" "}
              {deleteTarget ? format(new Date(dateStr(deleteTarget) + "T00:00"), "MMM d, yyyy") : ""}?
              This cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setDeleteTarget(null)}>Cancel</Button>
            <Button variant="destructive" onClick={() => deleteTarget && handleDelete(deleteTarget.slot_id)}>Delete</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Edit Slot Dialog ── */}
      <EditSlotDialog
        slot={editTarget}
        open={!!editTarget}
        onOpenChange={v => { if (!v) setEditTarget(null) }}
        onUpdated={loadData}
      />
    </>
  )
}
