"use client"

import { useEffect, useState, useMemo } from "react"
import {
  format, isSameDay, startOfMonth, endOfMonth,
  eachDayOfInterval, getDay, addMonths, subMonths,
} from "date-fns"
import {
  Calendar as CalendarIcon, Clock, Video, BookOpen,
  CheckCircle2, ChevronLeft, ChevronRight, CreditCard,
  Share2, Check, Users, Star, X, GraduationCap, FileText,
} from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { Skeleton } from "@/components/ui/skeleton"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import {
  Sheet, SheetContent, SheetHeader, SheetTitle,
} from "@/components/ui/sheet"
import { cn } from "@/lib/utils"
import { useAuthStore } from "@/lib/store/useAuthStore"
import { bookingService } from "@/lib/services/bookingService"
import { toast } from "sonner"

const SUBJECT_COLORS: Record<string, string> = {
  Mathematics: "#3b82f6", Physics: "#8b5cf6", Chemistry: "#f59e0b",
  Biology: "#10b981", English: "#ef4444", History: "#f97316",
  Geography: "#06b6d4", Amharic: "#ec4899", ICT: "#6366f1",
}
const DEFAULT_COLOR = "#6366f1"

type Booking = {
  booking_id: number
  status: string
  slot: {
    slot_id: number
    slot_date: string
    start_time: string
    end_time: string
    max_students: number
    remaining_seats: number
    description?: string | null
    grade_from?: number
    grade_to?: number
    subject: { name: string }
    teacher: { user: { name: string }; average_rating: number; experience_years: number; languages?: string }
    session: { session_id: number; status: string; room_name?: string } | null
    bookings?: Array<{ student: { user: { name: string } }; status: string }>
  }
  transaction?: { payment_status: string; total_amount: number } | null
}

function slotDateStr(b: Booking) {
  return typeof b.slot.slot_date === "string"
    ? b.slot.slot_date.split("T")[0]
    : new Date(b.slot.slot_date).toISOString().split("T")[0]
}

// ── Live countdown ────────────────────────────────────────────
function useCountdown(slotDate: string, startTime: string) {
  const [label, setLabel] = useState("")
  const [urgent, setUrgent] = useState(false)

  useEffect(() => {
    const target = new Date(`${slotDate}T${startTime.slice(0, 5)}:00`)
    if (isNaN(target.getTime())) return
    const tick = () => {
      const diff = target.getTime() - Date.now()
      if (diff <= 0) { setLabel("Starting now"); setUrgent(true); return }
      const m = Math.floor(diff / 60000)
      const d = Math.floor(m / 1440), h = Math.floor((m % 1440) / 60), min = m % 60
      setUrgent(m < 30)
      setLabel(d > 0 ? `${d}d ${h}h` : h > 0 ? `${h}h ${min}m` : `${min}m`)
    }
    tick()
    const id = setInterval(tick, 30000)
    return () => clearInterval(id)
  }, [slotDate, startTime])

  return { label, urgent }
}

// ── Compact session card ──────────────────────────────────────
function SessionCard({ b, onClick }: { b: Booking; onClick: () => void }) {
  const color     = SUBJECT_COLORS[b.slot.subject.name] ?? DEFAULT_COLOR
  const isLive    = b.slot.session?.status === "live"
  const dateOnly  = slotDateStr(b)
  const startTime = b.slot.start_time.slice(0, 5)
  const endTime   = b.slot.end_time.slice(0, 5)
  const enrolled  = (b.slot.max_students ?? 0) - (b.slot.remaining_seats ?? 0)
  const { label: countdown, urgent } = useCountdown(dateOnly, startTime)

  return (
    <div
      onClick={onClick}
      className={cn(
        "group relative rounded-2xl border bg-card cursor-pointer overflow-hidden",
        "transition-all duration-200 hover:shadow-lg hover:-translate-y-0.5 hover:border-primary/30",
        isLive && "ring-2 ring-green-500"
      )}
    >
      {/* Coloured top strip */}
      <div className="h-1.5 w-full" style={{ backgroundColor: color }} />

      <div className="p-4 space-y-3">
        {/* Subject + live badge */}
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-white text-xs font-bold"
              style={{ background: `linear-gradient(135deg, ${color}, ${color}99)` }}>
              {b.slot.subject.name.slice(0, 2).toUpperCase()}
            </div>
            <div>
              <p className="font-semibold text-sm leading-tight">{b.slot.subject.name}</p>
              <p className="text-xs text-muted-foreground">{b.slot.teacher.user.name}</p>
            </div>
          </div>
          {isLive
            ? <Badge className="text-[10px] bg-green-500 text-white animate-pulse shrink-0">LIVE</Badge>
            : b.status === "confirmed" && countdown
            ? <span className={cn("text-[10px] font-semibold shrink-0", urgent ? "text-amber-500" : "text-muted-foreground")}>
                {countdown} left
              </span>
            : null
          }
        </div>

        {/* Date & time */}
        <div className="space-y-1">
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <CalendarIcon className="size-3 shrink-0" />
            <span>{format(new Date(`${dateOnly}T00:00`), "EEE, MMM d")}</span>
          </div>
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Clock className="size-3 shrink-0" />
            <span>{startTime} – {endTime}</span>
          </div>
        </div>

        {/* Enrolled count */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <Users className="size-3" />
            <span>{enrolled}/{b.slot.max_students}</span>
          </div>
          {b.status === "completed" && (
            <Badge variant="outline" className="text-[10px] text-green-600 border-green-400">Done</Badge>
          )}
        </div>
      </div>
    </div>
  )
}

// ── Session detail sheet ──────────────────────────────────────
function SessionSheet({ b, open, onClose }: { b: Booking | null; open: boolean; onClose: () => void }) {
  const [copied, setCopied] = useState(false)

  if (!b) return null

  const color     = SUBJECT_COLORS[b.slot.subject.name] ?? DEFAULT_COLOR
  const isLive    = b.slot.session?.status === "live"
  const dateOnly  = slotDateStr(b)
  const startTime = b.slot.start_time.slice(0, 5)
  const endTime   = b.slot.end_time.slice(0, 5)
  const sessionDate = new Date(`${dateOnly}T${startTime}:00`)
  const endDate     = new Date(`${dateOnly}T${endTime}:00`)
  const durationMins = Math.round((endDate.getTime() - sessionDate.getTime()) / 60000)
  const enrolled  = (b.slot.max_students ?? 0) - (b.slot.remaining_seats ?? 0)
  const rating    = Number(b.slot.teacher.average_rating ?? 0)
  const enrolledStudents = b.slot.bookings?.filter(bk => bk.status !== "cancelled") ?? []

  const handleShare = async () => {
    if (!b.slot.session) { toast.error("Share link available once the tutor starts the session."); return }
    const id  = b.slot.session.room_name ?? b.slot.session.session_id
    const url = `${window.location.origin}/room/${id}`
    if (navigator.share) {
      try { await navigator.share({ title: `Join my ${b.slot.subject.name} session`, url }) } catch {}
    } else {
      navigator.clipboard.writeText(url)
      setCopied(true); toast.success("Link copied!")
      setTimeout(() => setCopied(false), 2000)
    }
  }

  return (
    <Sheet open={open} onOpenChange={v => { if (!v) onClose() }}>
      <SheetContent className="w-full sm:max-w-md overflow-y-auto p-0">
        {/* Header strip */}
        <div className="h-2 w-full" style={{ backgroundColor: color }} />

        <div className="p-6 space-y-5">
          <SheetHeader>
            <div className="flex items-start gap-3">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl text-white font-bold"
                style={{ background: `linear-gradient(135deg, ${color}, ${color}99)` }}>
                {b.slot.subject.name.slice(0, 2).toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <SheetTitle className="text-lg leading-tight">{b.slot.subject.name}</SheetTitle>
                <p className="text-sm text-muted-foreground">{b.slot.teacher.user.name}</p>
                {isLive && <Badge className="mt-1 text-[10px] bg-green-500 text-white animate-pulse">● LIVE NOW</Badge>}
              </div>
            </div>
          </SheetHeader>

          {/* Description */}
          {b.slot.description && (
            <div className="rounded-xl bg-muted/40 p-3 space-y-1">
              <div className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                <FileText className="size-3" /> About this session
              </div>
              <p className="text-sm leading-relaxed">{b.slot.description}</p>
            </div>
          )}

          {/* Session details */}
          <div className="space-y-2.5 text-sm">
            <div className="flex items-center gap-2.5">
              <CalendarIcon className="size-4 text-muted-foreground shrink-0" />
              <span>{format(new Date(`${dateOnly}T00:00`), "EEEE, MMMM d yyyy")}</span>
            </div>
            <div className="flex items-center gap-2.5">
              <Clock className="size-4 text-muted-foreground shrink-0" />
              <span>{startTime} – {endTime}</span>
              <span className="text-xs text-muted-foreground">({durationMins} min)</span>
            </div>
            {b.slot.grade_from && b.slot.grade_to && (
              <div className="flex items-center gap-2.5">
                <GraduationCap className="size-4 text-muted-foreground shrink-0" />
                <span>Grade {b.slot.grade_from} – {b.slot.grade_to}</span>
              </div>
            )}
            {b.transaction && (
              <div className="flex items-center gap-2.5">
                <CreditCard className="size-4 text-muted-foreground shrink-0" />
                <span>{Number(b.transaction.total_amount).toLocaleString("en-ET")} ETB · Paid</span>
              </div>
            )}
          </div>

          {/* Tutor info */}
          <div className="rounded-xl border p-3 space-y-2">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Tutor</p>
            <div className="flex items-center gap-3">
              <Avatar className="h-10 w-10">
                <AvatarFallback className="bg-primary/10 text-primary text-sm font-bold">
                  {b.slot.teacher.user.name.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div>
                <p className="font-semibold text-sm">{b.slot.teacher.user.name}</p>
                <div className="flex items-center gap-3 text-xs text-muted-foreground">
                  {rating > 0 && (
                    <span className="flex items-center gap-0.5 text-amber-500">
                      <Star className="size-3 fill-amber-400" /> {rating.toFixed(1)}
                    </span>
                  )}
                  <span>{b.slot.teacher.experience_years}y exp</span>
                  {b.slot.teacher.languages && <span>{b.slot.teacher.languages.split(",")[0]}</span>}
                </div>
              </div>
            </div>
          </div>

          <Separator />

          {/* Enrolled students */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                <Users className="size-3.5" /> Enrolled Students
              </p>
              <span className="text-xs text-muted-foreground">{enrolled} / {b.slot.max_students}</span>
            </div>
            {enrolledStudents.length === 0 ? (
              <p className="text-xs text-muted-foreground">No student data available.</p>
            ) : (
              <div className="space-y-1.5">
                {enrolledStudents.map((bk, i) => (
                  <div key={i} className="flex items-center gap-2.5 rounded-lg border px-3 py-2">
                    <Avatar className="h-7 w-7">
                      <AvatarFallback className="text-[10px] font-bold bg-muted">
                        {bk.student.user.name.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <span className="text-sm font-medium">{bk.student.user.name}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          <Separator />

          {/* Actions */}
          <div className="flex gap-2">
            <Button variant="outline" size="sm" className="gap-1.5 flex-1" onClick={handleShare}>
              {copied ? <Check className="size-3.5 text-green-600" /> : <Share2 className="size-3.5" />}
              {copied ? "Copied!" : "Share Link"}
            </Button>
            {b.status === "completed" ? (
              <Button size="sm" variant="outline" className="flex-1" disabled>
                Session Ended
              </Button>
            ) : b.slot.session ? (
              <Button size="sm" className="gap-1.5 flex-1" asChild>
                <a href={`/room/${b.slot.session.room_name ?? b.slot.session.session_id}`}>
                  <Video className="size-3.5" />
                  {isLive ? "Join Live" : "Enter Room"}
                </a>
              </Button>
            ) : (
              <Button size="sm" variant="outline" className="flex-1" disabled>
                Waiting for tutor…
              </Button>
            )}
          </div>
        </div>
      </SheetContent>
    </Sheet>
  )
}

// ── Calendar panel ────────────────────────────────────────────
function CalendarPanel({ sessions, onClose }: { sessions: Booking[]; onClose: () => void }) {
  const [currentMonth, setCurrentMonth] = useState(new Date())
  const [selectedDay, setSelectedDay]   = useState<Date | null>(null)

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

  const selectedDaySessions = useMemo(() =>
    selectedDay ? (sessionsByDate.get(format(selectedDay, "yyyy-MM-dd")) ?? []) : [],
    [selectedDay, sessionsByDate]
  )

  return (
    <div className="px-4 lg:px-6">
      <Card>
        <div className="p-4 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <p className="font-semibold text-sm">{format(currentMonth, "MMMM yyyy")}</p>
              <div className="flex gap-1">
                <Button variant="outline" size="icon" className="h-7 w-7" onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}>
                  <ChevronLeft className="size-3.5" />
                </Button>
                <Button variant="outline" size="sm" className="h-7 px-2 text-xs" onClick={() => setCurrentMonth(new Date())}>Today</Button>
                <Button variant="outline" size="icon" className="h-7 w-7" onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}>
                  <ChevronRight className="size-3.5" />
                </Button>
              </div>
            </div>
            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={onClose}>
              <X className="size-4" />
            </Button>
          </div>

          <div className="grid lg:grid-cols-[1fr_240px] gap-4">
            <div>
              <div className="grid grid-cols-7 mb-1">
                {["S","M","T","W","T","F","S"].map((d, i) => (
                  <div key={i} className="text-center text-xs font-medium text-muted-foreground py-1">{d}</div>
                ))}
              </div>
              <div className="grid grid-cols-7 gap-0.5">
                {Array.from({ length: startPad }).map((_, i) => <div key={`p${i}`} />)}
                {monthDays.map(day => {
                  const key = format(day, "yyyy-MM-dd")
                  const ds  = sessionsByDate.get(key) ?? []
                  const isSel = selectedDay ? isSameDay(day, selectedDay) : false
                  const isToday = isSameDay(day, new Date())
                  return (
                    <button key={key} onClick={() => setSelectedDay(isSel ? null : day)}
                      className={cn(
                        "flex flex-col items-center rounded-lg p-1 min-h-[40px] text-xs transition-colors hover:bg-muted/60",
                        isSel && "bg-primary/10 ring-1 ring-primary",
                        isToday && !isSel && "bg-muted font-bold",
                      )}>
                      <span className={cn(isToday && "text-primary")}>{format(day, "d")}</span>
                      {ds.length > 0 && (
                        <div className="flex gap-0.5 mt-0.5">
                          {ds.some(b => b.status === "confirmed") && <span className="h-1 w-1 rounded-full bg-blue-500" />}
                          {ds.some(b => b.status === "completed") && <span className="h-1 w-1 rounded-full bg-green-500" />}
                        </div>
                      )}
                    </button>
                  )
                })}
              </div>
            </div>

            <div className="space-y-2">
              <p className="text-xs font-medium text-muted-foreground">
                {selectedDay ? format(selectedDay, "EEEE, MMM d") : "Select a day"}
              </p>
              {selectedDaySessions.length === 0 && selectedDay && (
                <p className="text-xs text-muted-foreground">No sessions</p>
              )}
              {selectedDaySessions.map(b => {
                const color = SUBJECT_COLORS[b.slot.subject.name] ?? DEFAULT_COLOR
                return (
                  <div key={b.booking_id} className="rounded-lg border p-2.5 space-y-1">
                    <div className="flex items-center gap-2">
                      <div className="h-2 w-2 rounded-full shrink-0" style={{ backgroundColor: color }} />
                      <p className="text-xs font-semibold">{b.slot.subject.name}</p>
                    </div>
                    <p className="text-[10px] text-muted-foreground pl-4">
                      {b.slot.start_time.slice(0, 5)} – {b.slot.end_time.slice(0, 5)}
                    </p>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      </Card>
    </div>
  )
}

// ── Main page ─────────────────────────────────────────────────
export default function SessionsPage() {
  const { user }    = useAuthStore()
  const [bookings, setBookings]         = useState<Booking[]>([])
  const [loading, setLoading]           = useState(true)
  const [showCalendar, setShowCalendar] = useState(false)
  const [selected, setSelected]         = useState<Booking | null>(null)

  useEffect(() => {
    if (!user) return
    bookingService.getMyBookings()
      .then(data => { setBookings(data); setLoading(false) })
      .catch(() => setLoading(false))
  }, [user])

  const sessions  = useMemo(() => bookings.filter(b => ["confirmed", "completed"].includes(b.status)), [bookings])
  const confirmed = useMemo(() => sessions.filter(b => b.status === "confirmed"), [sessions])
  const completed = useMemo(() => sessions.filter(b => b.status === "completed"), [sessions])

  if (loading) return (
    <div className="px-4 lg:px-6 space-y-6">
      <Skeleton className="h-8 w-48" />
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
        {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-44 rounded-2xl" />)}
      </div>
    </div>
  )

  return (
    <>
      {/* Header */}
      <div className="px-4 lg:px-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">My Sessions</h1>
          <p className="text-muted-foreground text-sm">{sessions.length} session{sessions.length !== 1 ? "s" : ""} total</p>
        </div>
        <Button variant={showCalendar ? "default" : "outline"} size="sm" className="gap-2"
          onClick={() => setShowCalendar(v => !v)}>
          <CalendarIcon className="size-4" />
          <span className="hidden sm:inline">{showCalendar ? "Hide" : "View"} Calendar</span>
        </Button>
      </div>

      {/* Stats row */}
      <div className="px-4 lg:px-6 flex gap-3 flex-wrap">
        {[
          { label: "Confirmed",  value: confirmed.length, color: "text-blue-500"  },
          { label: "Completed",  value: completed.length, color: "text-green-500" },
          { label: "Subjects",   value: new Set(sessions.map(b => b.slot.subject.name)).size, color: "text-amber-500" },
        ].map(s => (
          <div key={s.label} className="flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs">
            <span className={`font-bold ${s.color}`}>{s.value}</span>
            <span className="text-muted-foreground">{s.label}</span>
          </div>
        ))}
      </div>

      {/* Optional calendar */}
      {showCalendar && <CalendarPanel sessions={sessions} onClose={() => setShowCalendar(false)} />}

      {/* Upcoming sessions grid */}
      {confirmed.length > 0 && (
        <div className="px-4 lg:px-6 space-y-3">
          <h2 className="text-base font-semibold">Upcoming</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
            {confirmed.map(b => (
              <SessionCard key={b.booking_id} b={b} onClick={() => setSelected(b)} />
            ))}
          </div>
        </div>
      )}

      {/* Past sessions grid */}
      {completed.length > 0 && (
        <div className="px-4 lg:px-6 space-y-3">
          <h2 className="text-base font-semibold text-muted-foreground">Past Sessions</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 opacity-75">
            {completed.map(b => (
              <SessionCard key={b.booking_id} b={b} onClick={() => setSelected(b)} />
            ))}
          </div>
        </div>
      )}

      {/* Empty state */}
      {sessions.length === 0 && (
        <div className="px-4 lg:px-6 flex flex-col items-center justify-center py-20 text-center gap-3">
          <CalendarIcon className="size-10 text-muted-foreground/40" />
          <p className="text-muted-foreground text-sm font-medium">No sessions yet.</p>
          <Button variant="outline" size="sm" asChild><a href="/browse">Browse Classes</a></Button>
        </div>
      )}

      {/* Detail sheet */}
      <SessionSheet b={selected} open={!!selected} onClose={() => setSelected(null)} />
    </>
  )
}
