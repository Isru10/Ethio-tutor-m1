"use client"

import { useEffect, useState, useMemo } from "react"
import { format, isSameDay, startOfMonth, endOfMonth, eachDayOfInterval, getDay, addMonths, subMonths } from "date-fns"
import { Calendar as CalendarIcon, Clock, Video, BookOpen, CheckCircle2, ChevronLeft, ChevronRight, CreditCard } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { Skeleton } from "@/components/ui/skeleton"
import { cn } from "@/lib/utils"
import { useAuthStore } from "@/store/authStore"
import { bookingService } from "@/lib/services/bookingService"

const SUBJECT_COLORS: Record<string, string> = {
  Mathematics: "#3b82f6", Physics: "#8b5cf6", Chemistry: "#f59e0b",
  Biology: "#10b981", English: "#ef4444", History: "#f97316",
  Geography: "#06b6d4", Amharic: "#ec4899", ICT: "#6366f1",
}
const DEFAULT_COLOR = "#6366f1"

type Booking = {
  booking_id: number
  status: string
  created_at: string
  slot: {
    slot_date: string
    start_time: string
    end_time: string
    subject: { name: string }
    teacher: { user: { name: string } }
    session: { session_id: number; status: string; room_name?: string } | null
  }
  transaction?: { payment_status: string; total_amount: number } | null
}

function slotDateStr(b: Booking) {
  return typeof b.slot.slot_date === "string"
    ? b.slot.slot_date.split("T")[0]
    : new Date(b.slot.slot_date).toISOString().split("T")[0]
}

export default function SessionsPage() {
  const { user } = useAuthStore()
  const [bookings, setBookings] = useState<Booking[]>([])
  const [loading, setLoading] = useState(true)
  const [currentMonth, setCurrentMonth] = useState(new Date())
  const [selectedDay, setSelectedDay] = useState<Date | null>(null)

  useEffect(() => {
    if (!user) return
    bookingService.getMyBookings()
      .then((data) => { setBookings(data); setLoading(false) })
      .catch(() => setLoading(false))
  }, [user])

  // Only show paid/confirmed/completed bookings on the sessions page
  const sessions = useMemo(() =>
    bookings.filter(b => ["confirmed", "completed"].includes(b.status)),
    [bookings]
  )

  const confirmed = sessions.filter(b => b.status === "confirmed")
  const completed = sessions.filter(b => b.status === "completed")

  // Calendar helpers
  const monthDays = useMemo(() =>
    eachDayOfInterval({ start: startOfMonth(currentMonth), end: endOfMonth(currentMonth) }),
    [currentMonth]
  )
  const startPad = getDay(startOfMonth(currentMonth))

  const sessionsByDate = useMemo(() => {
    const map = new Map<string, Booking[]>()
    for (const b of sessions) {
      const key = slotDateStr(b)
      if (!map.has(key)) map.set(key, [])
      map.get(key)!.push(b)
    }
    return map
  }, [sessions])

  const selectedDaySessions = useMemo(() => {
    if (!selectedDay) return []
    return sessionsByDate.get(format(selectedDay, "yyyy-MM-dd")) ?? []
  }, [selectedDay, sessionsByDate])

  // Filter list by selected day if one is picked
  const displayConfirmed = selectedDay
    ? confirmed.filter(b => slotDateStr(b) === format(selectedDay, "yyyy-MM-dd"))
    : confirmed
  const displayCompleted = selectedDay
    ? completed.filter(b => slotDateStr(b) === format(selectedDay, "yyyy-MM-dd"))
    : completed

  if (loading) {
    return (
      <div className="px-4 lg:px-6 space-y-6">
        <Skeleton className="h-8 w-48" />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-24 rounded-xl" />)}
        </div>
        <Skeleton className="h-[420px] rounded-xl" />
      </div>
    )
  }

  return (
    <>
      {/* Header */}
      <div className="px-4 lg:px-6">
        <h1 className="text-2xl font-bold tracking-tight">My Sessions</h1>
        <p className="text-muted-foreground text-sm">Your confirmed and completed tutoring sessions.</p>
      </div>

      {/* Stats */}
      <div className="px-4 lg:px-6 grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: "Total Sessions",  value: sessions.length,   icon: BookOpen,    color: "text-foreground" },
          { label: "Confirmed",       value: confirmed.length,  icon: CalendarIcon, color: "text-blue-500" },
          { label: "Completed",       value: completed.length,  icon: CheckCircle2, color: "text-green-500" },
          { label: "Subjects",        value: new Set(sessions.map(b => b.slot.subject.name)).size, icon: BookOpen, color: "text-amber-500" },
        ].map(({ label, value, icon: Icon, color }) => (
          <Card key={label}>
            <CardContent className="space-y-1 pt-4">
              <Icon className={`size-5 ${color}`} />
              <p className="text-muted-foreground text-xs font-medium">{label}</p>
              <p className="text-2xl font-bold">{value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Calendar + Day panel */}
      <div className="px-4 lg:px-6 grid gap-4 lg:grid-cols-[1fr_300px]">
        {/* Mini calendar */}
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
            <div className="grid grid-cols-7 mb-1">
              {["Sun","Mon","Tue","Wed","Thu","Fri","Sat"].map(d => (
                <div key={d} className="text-center text-xs font-medium text-muted-foreground py-1">{d}</div>
              ))}
            </div>
            <div className="grid grid-cols-7 gap-0.5">
              {Array.from({ length: startPad }).map((_, i) => <div key={`pad-${i}`} />)}
              {monthDays.map(day => {
                const key = format(day, "yyyy-MM-dd")
                const daySessions = sessionsByDate.get(key) ?? []
                const isSelected = selectedDay ? isSameDay(day, selectedDay) : false
                const isToday = isSameDay(day, new Date())
                const hasConfirmed = daySessions.some(b => b.status === "confirmed")
                const hasCompleted = daySessions.some(b => b.status === "completed")

                return (
                  <button
                    key={key}
                    onClick={() => setSelectedDay(isSelected ? null : day)}
                    className={cn(
                      "relative flex flex-col items-center rounded-lg p-1.5 min-h-[48px] text-sm transition-colors hover:bg-muted/60",
                      isSelected && "bg-primary/10 ring-1 ring-primary",
                      isToday && !isSelected && "bg-muted font-semibold",
                    )}
                  >
                    <span className={cn("text-xs leading-none", isToday && "text-primary font-bold")}>
                      {format(day, "d")}
                    </span>
                    {daySessions.length > 0 && (
                      <div className="flex gap-0.5 mt-1.5 flex-wrap justify-center">
                        {hasConfirmed && <span className="h-1.5 w-1.5 rounded-full bg-blue-500" />}
                        {hasCompleted && <span className="h-1.5 w-1.5 rounded-full bg-green-500" />}
                      </div>
                    )}
                  </button>
                )
              })}
            </div>
            <div className="flex gap-4 mt-3 text-xs text-muted-foreground">
              <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-blue-500" /> Confirmed</span>
              <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-green-500" /> Completed</span>
            </div>
          </CardContent>
        </Card>

        {/* Day detail */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">
              {selectedDay ? format(selectedDay, "EEEE, MMM d") : "All sessions"}
            </CardTitle>
            <p className="text-xs text-muted-foreground">
              {selectedDay
                ? selectedDaySessions.length > 0
                  ? `${selectedDaySessions.length} session${selectedDaySessions.length > 1 ? "s" : ""}`
                  : "No sessions on this day"
                : "Click a day to filter"}
            </p>
          </CardHeader>
          <CardContent className="space-y-3">
            {selectedDay && selectedDaySessions.length === 0 && (
              <div className="flex flex-col items-center justify-center py-8 text-center gap-2">
                <CalendarIcon className="size-7 text-muted-foreground/30" />
                <p className="text-xs text-muted-foreground">No sessions on this day</p>
              </div>
            )}
            {(selectedDay ? selectedDaySessions : sessions.slice(0, 5)).map(b => {
              const color = SUBJECT_COLORS[b.slot.subject.name] ?? DEFAULT_COLOR
              const isLive = b.slot.session?.status === "live"
              const dateOnly = slotDateStr(b)
              const startTime = b.slot.start_time.slice(0, 5)
              const endTime = b.slot.end_time.slice(0, 5)
              return (
                <div key={b.booking_id} className="rounded-xl border p-3 space-y-2">
                  <div className="flex items-center gap-2">
                    <div className="h-8 w-8 rounded-lg flex items-center justify-center text-white text-xs font-bold shrink-0"
                      style={{ backgroundColor: color }}>
                      {b.slot.subject.name.slice(0, 2).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-sm truncate">{b.slot.subject.name}</p>
                      <p className="text-xs text-muted-foreground truncate">{b.slot.teacher.user.name}</p>
                    </div>
                    {isLive && <Badge className="text-[10px] px-1.5 py-0 bg-green-500 text-white animate-pulse shrink-0">LIVE</Badge>}
                  </div>
                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <Clock className="size-3" />
                    <span>{format(new Date(`${dateOnly}T${startTime}:00`), "MMM d")} · {startTime} – {endTime}</span>
                  </div>
                  {b.slot.session ? (
                    <Button size="sm" className="w-full h-7 text-xs gap-1.5" asChild>
                      <a href={`/room/${b.slot.session.room_name ?? b.slot.session.session_id}`}>
                        <Video className="size-3.5" />
                        {isLive ? "Join Live" : "Enter Room"}
                      </a>
                    </Button>
                  ) : (
                    <Button size="sm" variant="outline" className="w-full h-7 text-xs" disabled>
                      Waiting for tutor…
                    </Button>
                  )}
                </div>
              )
            })}
          </CardContent>
        </Card>
      </div>

      {/* Confirmed sessions grid */}
      {displayConfirmed.length > 0 && (
        <div className="px-4 lg:px-6 space-y-3">
          <h2 className="text-lg font-semibold">
            {selectedDay ? `Confirmed on ${format(selectedDay, "MMM d")}` : "Upcoming Confirmed Sessions"}
          </h2>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {displayConfirmed.map((b) => {
              const color = SUBJECT_COLORS[b.slot.subject.name] ?? DEFAULT_COLOR
              const initials = b.slot.teacher.user.name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2)
              const isLive = b.slot.session?.status === "live"
              const dateOnly = slotDateStr(b)
              const startTime = b.slot.start_time.slice(0, 5)
              const endTime = b.slot.end_time.slice(0, 5)

              return (
                <Card key={b.booking_id} className="hover:shadow-md transition-shadow">
                  <CardHeader className="pb-2">
                    <div className="flex items-start gap-3">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-white text-sm font-bold"
                        style={{ backgroundColor: color }}>
                        {initials}
                      </div>
                      <div className="flex-1 min-w-0">
                        <CardTitle className="text-sm leading-tight">{b.slot.teacher.user.name}</CardTitle>
                        <div className="flex gap-1.5 mt-1 flex-wrap">
                          <Badge variant="default" className="text-xs px-1.5 py-0">{b.slot.subject.name}</Badge>
                          {isLive && <Badge className="text-xs px-1.5 py-0 bg-green-500 text-white animate-pulse">● LIVE</Badge>}
                        </div>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <Separator />
                    <div className="flex items-center gap-2 text-sm">
                      <CalendarIcon className="size-3.5 text-muted-foreground" />
                      <span>{format(new Date(`${dateOnly}T00:00`), "EEE, MMM d yyyy")}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <Clock className="size-3.5 text-muted-foreground" />
                      <span>{startTime} – {endTime}</span>
                    </div>
                    {b.transaction && (
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <CreditCard className="size-3.5" />
                        <span>{Number(b.transaction.total_amount).toLocaleString("en-ET")} ETB · Paid</span>
                      </div>
                    )}
                    {b.slot.session ? (
                      <Button className="w-full gap-2 mt-1" size="sm" asChild>
                        <a href={`/room/${b.slot.session.room_name ?? b.slot.session.session_id}`}>
                          <Video className="size-4" />
                          {isLive ? "Join Live Session" : "Enter Room"}
                        </a>
                      </Button>
                    ) : (
                      <Button className="w-full mt-1" size="sm" variant="outline" disabled>
                        Waiting for tutor to start…
                      </Button>
                    )}
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </div>
      )}

      {/* Past sessions */}
      {displayCompleted.length > 0 && (
        <div className="px-4 lg:px-6 space-y-3">
          <h2 className="text-lg font-semibold text-muted-foreground">Past Sessions</h2>
          <div className="space-y-2">
            {displayCompleted.map((b) => {
              const color = SUBJECT_COLORS[b.slot.subject.name] ?? DEFAULT_COLOR
              const dateOnly = slotDateStr(b)
              return (
                <div key={b.booking_id} className="flex items-center gap-4 rounded-lg border px-4 py-3 text-sm">
                  <div className="h-2.5 w-2.5 rounded-full shrink-0" style={{ backgroundColor: color }} />
                  <span className="font-medium flex-1">{b.slot.subject.name}</span>
                  <span className="text-muted-foreground hidden sm:block">{b.slot.teacher.user.name}</span>
                  <span className="text-muted-foreground">{format(new Date(`${dateOnly}T00:00`), "MMM d, yyyy")}</span>
                  <Badge variant="outline" className="text-green-600 border-green-400 text-xs">Completed</Badge>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Empty state */}
      {sessions.length === 0 && (
        <div className="px-4 lg:px-6 flex flex-col items-center justify-center py-20 text-center gap-3">
          <CalendarIcon className="size-10 text-muted-foreground/40" />
          <p className="text-muted-foreground text-sm font-medium">No sessions yet.</p>
          <p className="text-muted-foreground text-xs">Book and pay for a class to see your sessions here.</p>
          <Button variant="outline" size="sm" asChild><a href="/browse">Browse Classes</a></Button>
        </div>
      )}
    </>
  )
}
