"use client"

import { useEffect, useState, useMemo } from "react"
import { useAuthStore } from "@/store/authStore"
import { getStudentSessions } from "@/lib/services/dashboardService"
import { Calendar } from "@/app/(dashboard)/calendar/components/calendar"
import type { CalendarEvent } from "@/app/(dashboard)/calendar/types"
import type { SessionWithDetails } from "@/types/database"
import {
  Card, CardContent, CardHeader, CardTitle,
} from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import {
  Calendar as CalendarIcon, Clock, Video, BookOpen, CheckCircle2,
} from "lucide-react"
import { Skeleton } from "@/components/ui/skeleton"

// Map subject name to a calendar event color (matches template colour set)
const SUBJECT_COLORS: Record<string, string> = {
  Mathematics: "#3b82f6",
  Physics:     "#8b5cf6",
  Chemistry:   "#f59e0b",
  Biology:     "#10b981",
  English:     "#ef4444",
  History:     "#f97316",
  Geography:   "#06b6d4",
}
const DEFAULT_COLOR = "#6366f1"

// Shape SessionWithDetails → CalendarEvent (the existing Calendar component's format)
function sessionToCalendarEvent(s: SessionWithDetails): CalendarEvent {
  const start = new Date(s.session.start_time)
  const end   = new Date(s.session.end_time)
  const durationMins = Math.round((end.getTime() - start.getTime()) / 60000)

  const hh = start.getHours().toString().padStart(2, "0")
  const mm = start.getMinutes().toString().padStart(2, "0")

  return {
    id:          s.session.session_id,
    title:       `${s.subject.name} — ${s.teacher.name}`,
    date:        start,
    time:        `${hh}:${mm}`,
    duration:    `${durationMins} min`,
    type:        "meeting",
    attendees:   [s.teacher.name],
    location:    s.session.meeting_link ?? "Online",
    color:       SUBJECT_COLORS[s.subject.name] ?? DEFAULT_COLOR,
    description: s.session.status === "scheduled"
      ? `Upcoming session · ${durationMins} min`
      : `Session ${s.session.status}`,
  }
}

export default function SessionsPage() {
  const { user } = useAuthStore()
  const [sessionDetails, setSessionDetails] = useState<SessionWithDetails[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user) return
    getStudentSessions(user.user_id, user.tenant_id).then((data) => {
      setSessionDetails(data)
      setLoading(false)
    })
  }, [user])

  // Convert to CalendarEvent objects for the existing Calendar component
  const calendarEvents = useMemo(
    () => sessionDetails.map(sessionToCalendarEvent),
    [sessionDetails]
  )

  // Derive event-dot data for the mini calendar sidebar
  const eventDates = useMemo(() => {
    const map = new Map<string, number>()
    calendarEvents.forEach((e) => {
      const key = e.date.toDateString()
      map.set(key, (map.get(key) ?? 0) + 1)
    })
    return Array.from(map.entries()).map(([key, count]) => ({
      date: new Date(key),
      count,
    }))
  }, [calendarEvents])

  // Separate upcoming vs past
  const now = new Date()
  const upcoming = sessionDetails.filter(
    (s) => s.session.status === "scheduled" && new Date(s.session.start_time) > now
  )
  const past = sessionDetails.filter((s) => s.session.status === "completed")

  if (loading) {
    return (
      <div className="px-4 lg:px-6 space-y-6">
        <div>
          <Skeleton className="h-7 w-40 mb-2" />
          <Skeleton className="h-4 w-64" />
        </div>
        <Skeleton className="h-[600px] rounded-xl" />
      </div>
    )
  }

  return (
    <>
      {/* Page heading */}
      <div className="px-4 lg:px-6">
        <h1 className="text-2xl font-bold tracking-tight">My Sessions</h1>
        <p className="text-muted-foreground text-sm">
          Your scheduled and past tutoring sessions on a calendar.
        </p>
      </div>

      {/* Quick stat row */}
      <div className="px-4 lg:px-6 grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: "Total Sessions",    value: sessionDetails.length, icon: BookOpen,    color: "text-foreground"  },
          { label: "Upcoming",          value: upcoming.length,       icon: CalendarIcon, color: "text-blue-500"   },
          { label: "Completed",         value: past.length,           icon: CheckCircle2, color: "text-green-500"  },
          { label: "Subjects Covered",  value: new Set(sessionDetails.map((s) => s.subject.name)).size, icon: BookOpen, color: "text-amber-500" },
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

      {/* ── CALENDAR (full existing template component, zero changes) ── */}
      <div className="px-4 lg:px-6">
        <Calendar events={calendarEvents} eventDates={eventDates} />
      </div>

      {/* ── UPCOMING SESSIONS LIST ── */}
      {upcoming.length > 0 && (
        <div className="px-4 lg:px-6 space-y-3">
          <h2 className="text-lg font-semibold">Upcoming Sessions</h2>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {upcoming.map((s) => {
              const start = new Date(s.session.start_time)
              const end   = new Date(s.session.end_time)
              const mins  = Math.round((end.getTime() - start.getTime()) / 60000)
              const initials = s.teacher.name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2)
              const color = SUBJECT_COLORS[s.subject.name] ?? DEFAULT_COLOR

              return (
                <Card key={s.session.session_id} className="hover:shadow-md transition-shadow">
                  <CardHeader className="pb-2">
                    <div className="flex items-start gap-3">
                      <div
                        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-white text-sm font-bold"
                        style={{ backgroundColor: color }}
                      >
                        {initials}
                      </div>
                      <div className="flex-1 min-w-0">
                        <CardTitle className="text-sm leading-tight">{s.teacher.name}</CardTitle>
                        <div className="flex gap-1.5 mt-1 flex-wrap">
                          <Badge variant="default" className="text-xs px-1.5 py-0">{s.subject.name}</Badge>
                        </div>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <Separator />
                    <div className="flex items-center gap-2 text-sm">
                      <CalendarIcon className="size-3.5 text-muted-foreground" />
                      <span>{start.toLocaleDateString("en-ET", { weekday: "short", month: "short", day: "numeric" })}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <Clock className="size-3.5 text-muted-foreground" />
                      <span>
                        {start.toLocaleTimeString("en-ET", { hour: "2-digit", minute: "2-digit" })}
                        {" – "}
                        {end.toLocaleTimeString("en-ET", { hour: "2-digit", minute: "2-digit" })}
                        <span className="text-muted-foreground text-xs ml-1">({mins} min)</span>
                      </span>
                    </div>
                    {/* Join button — active if within 15 min of start */}
                    {s.session.meeting_link && (
                      <Button
                        className="w-full gap-2 mt-1"
                        size="sm"
                        asChild
                      >
                        <a href={s.session.meeting_link} target="_blank" rel="noopener noreferrer">
                          <Video className="size-4" />
                          Join Session
                        </a>
                      </Button>
                    )}
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </div>
      )}

      {/* ── PAST SESSIONS ── */}
      {past.length > 0 && (
        <div className="px-4 lg:px-6 space-y-3">
          <h2 className="text-lg font-semibold text-muted-foreground">Past Sessions</h2>
          <div className="space-y-2">
            {past.map((s) => {
              const start = new Date(s.session.start_time)
              const color = SUBJECT_COLORS[s.subject.name] ?? DEFAULT_COLOR
              return (
                <div
                  key={s.session.session_id}
                  className="flex items-center gap-4 rounded-lg border px-4 py-3 text-sm"
                >
                  <div
                    className="h-2.5 w-2.5 rounded-full shrink-0"
                    style={{ backgroundColor: color }}
                  />
                  <span className="font-medium flex-1">{s.subject.name}</span>
                  <span className="text-muted-foreground">{s.teacher.name}</span>
                  <span className="text-muted-foreground">
                    {start.toLocaleDateString("en-ET", { month: "short", day: "numeric", year: "numeric" })}
                  </span>
                  <Badge variant="outline" className="text-green-600 border-green-400 text-xs">
                    Completed
                  </Badge>
                  {s.recording && (
                    <Badge variant="outline" className="text-xs border-blue-400 text-blue-600">
                      <Video className="size-3 mr-1" />
                      Recording
                    </Badge>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Empty state */}
      {sessionDetails.length === 0 && (
        <div className="px-4 lg:px-6 flex flex-col items-center justify-center py-20 text-center gap-3">
          <CalendarIcon className="size-10 text-muted-foreground/40" />
          <p className="text-muted-foreground text-sm font-medium">No sessions yet.</p>
          <p className="text-muted-foreground text-xs">
            Book a class from the Browse page to see your sessions here.
          </p>
          <Button variant="outline" size="sm" asChild>
            <a href="/browse">Browse Classes</a>
          </Button>
        </div>
      )}
    </>
  )
}
