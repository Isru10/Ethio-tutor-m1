"use client"

/**
 * UnifiedSessionCard
 *
 * A single card component used across:
 *  - (dashboard)/browse   → mode="browse"  → shows price + Book Now
 *  - (dashboard)/sessions → mode="session" → shows countdown + Join/Share
 *
 * All visual structure is identical. Only the footer actions differ by mode.
 */

import { useEffect, useState } from "react"
import {
  Star, Clock, Users, Banknote, CalendarDays,
  BookCheck, ChevronRight, Languages, Video,
  Share2, Check, CheckCircle2,
} from "lucide-react"
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Separator } from "@/components/ui/separator"
import { cn } from "@/lib/utils"
import { toast } from "sonner"

// ─── Shared slot data shape ───────────────────────────────────
export interface CardSlotData {
  slot_id: number
  slot_date: string
  start_time: string
  end_time: string
  max_students: number
  remaining_seats: number
  description?: string | null
  grade_from?: number
  grade_to?: number
  grade_from_label?: string
  grade_to_label?: string
  subject: { name: string; category?: string | null }
  teacher: {
    user: { name: string; user_id: number }
    average_rating: number | string
    experience_years: number
    languages?: string
    hourly_rate?: number | string
  }
  session?: { session_id: number; status: string; room_name?: string | null } | null
}

// ─── Browse mode props ────────────────────────────────────────
interface BrowseModeProps {
  mode: "browse"
  slot: CardSlotData
  onBook: (slotId: number) => void
  onClick?: () => void
}

// ─── Session mode props ───────────────────────────────────────
interface SessionModeProps {
  mode: "session"
  slot: CardSlotData
  bookingStatus: "confirmed" | "completed" | "pending" | "cancelled"
  onClick?: () => void
}

export type UnifiedSessionCardProps = BrowseModeProps | SessionModeProps

// ─── Countdown hook ───────────────────────────────────────────
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

// ─── Main component ───────────────────────────────────────────
export function UnifiedSessionCard(props: UnifiedSessionCardProps) {
  const [copied, setCopied] = useState(false)
  const { slot, onClick } = props

  const dateOnly    = slot.slot_date.split("T")[0]
  const startTime   = slot.start_time.slice(0, 5)
  const endTime     = slot.end_time.slice(0, 5)
  const sessionDate = new Date(`${dateOnly}T${startTime}:00`)
  const endDate     = new Date(`${dateOnly}T${endTime}:00`)
  const durationMins = Math.round((endDate.getTime() - sessionDate.getTime()) / 60000)

  const takenSeats = slot.max_students - slot.remaining_seats
  const fillPct    = slot.max_students > 0 ? Math.round((takenSeats / slot.max_students) * 100) : 0
  const seatColor  = slot.remaining_seats === 0
    ? "text-rose-500"
    : slot.remaining_seats <= 1
    ? "text-amber-500"
    : "text-green-600"
  const isFull = slot.remaining_seats === 0

  const rating   = Number(slot.teacher.average_rating ?? 0)
  const initials = slot.teacher.user.name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2)
  const langs    = (slot.teacher.languages ?? "").split(",").map(l => l.trim()).filter(Boolean)
  const visibleLangs = langs.slice(0, 2)
  const extraLangs   = langs.length - 2

  const formattedDate  = sessionDate.toLocaleDateString("en-ET", { weekday: "long", day: "numeric", month: "short" })
  const formattedStart = sessionDate.toLocaleTimeString("en-ET", { hour: "2-digit", minute: "2-digit" })
  const formattedEnd   = endDate.toLocaleTimeString("en-ET", { hour: "2-digit", minute: "2-digit" })

  const { label: countdown, urgent } = useCountdown(dateOnly, startTime)

  // Session-mode derived values
  const isSessionMode = props.mode === "session"
  const isLive        = isSessionMode && slot.session?.status === "live"
  const isCompleted   = isSessionMode && props.bookingStatus === "completed"

  const handleShare = async (e: React.MouseEvent) => {
    e.stopPropagation()
    if (!slot.session) {
      toast.error("Share link available once the tutor starts the session.")
      return
    }
    const id  = slot.session.room_name ?? slot.session.session_id
    const url = `${window.location.origin}/room/${id}`
    if (navigator.share) {
      try { await navigator.share({ title: `Join my ${slot.subject.name} session`, url }) } catch {}
    } else {
      navigator.clipboard.writeText(url)
      setCopied(true)
      toast.success("Session link copied!")
      setTimeout(() => setCopied(false), 2000)
    }
  }

  // Grade label
  const gradeLabel = slot.grade_from_label && slot.grade_to_label
    ? slot.grade_from_label === slot.grade_to_label
      ? slot.grade_from_label
      : `${slot.grade_from_label} – ${slot.grade_to_label}`
    : slot.grade_from && slot.grade_to
    ? `Grade ${slot.grade_from} – ${slot.grade_to}`
    : null

  return (
    <Card
      onClick={onClick}
      className={cn(
        "flex flex-col transition-all duration-200 hover:shadow-md border",
        onClick && "cursor-pointer hover:border-primary/30 hover:-translate-y-0.5",
        isFull && props.mode === "browse" && "opacity-60",
        isLive && "ring-2 ring-green-500 shadow-green-100 dark:shadow-green-950/20",
        isCompleted && "opacity-75",
      )}
    >
      <CardHeader className="pb-3">
        {/* Teacher row */}
        <div className="flex items-start gap-3">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary text-primary-foreground text-sm font-bold">
            {initials}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <p className="font-semibold text-sm leading-tight">{slot.teacher.user.name}</p>
              <div className="flex items-center gap-1 shrink-0">
                {/* Browse mode: rating */}
                {props.mode === "browse" && rating > 0 && (
                  <div className="flex items-center gap-1">
                    <Star className="size-3.5 fill-amber-400 text-amber-400" />
                    <span className="text-xs font-semibold">{rating.toFixed(1)}</span>
                  </div>
                )}
                {/* Browse mode: countdown */}
                {props.mode === "browse" && countdown && (
                  <span className={cn("text-[10px] font-semibold ml-1", urgent ? "text-amber-500" : "text-muted-foreground")}>
                    {countdown} left
                  </span>
                )}
                {/* Session mode: live/done/countdown */}
                {isSessionMode && (
                  isLive
                    ? <Badge className="text-[10px] bg-green-500 text-white animate-pulse">● LIVE</Badge>
                    : isCompleted
                    ? <Badge variant="outline" className="text-[10px] text-green-600 border-green-400 gap-1">
                        <CheckCircle2 className="size-2.5" /> Done
                      </Badge>
                    : countdown
                    ? <span className={cn("text-[10px] font-semibold", urgent ? "text-amber-500" : "text-muted-foreground")}>
                        {countdown} left
                      </span>
                    : null
                )}
              </div>
            </div>

            {/* Experience + Languages */}
            <div className="flex items-center gap-1.5 mt-1 text-muted-foreground flex-wrap">
              <Languages className="size-3 shrink-0" />
              <span className="text-xs">{slot.teacher.experience_years}y exp</span>
              {visibleLangs.length > 0 && (
                <>
                  <span className="text-xs text-muted-foreground/40">·</span>
                  <div className="flex items-center gap-1 flex-wrap">
                    {visibleLangs.map(l => (
                      <span key={l} className="text-xs bg-muted px-1.5 py-0.5 rounded-md">{l}</span>
                    ))}
                    {extraLangs > 0 && (
                      <span className="text-xs bg-muted px-1.5 py-0.5 rounded-md text-muted-foreground">+{extraLangs}</span>
                    )}
                  </div>
                </>
              )}
              {/* Session mode: rating inline */}
              {isSessionMode && rating > 0 && (
                <>
                  <span className="text-xs text-muted-foreground/40">·</span>
                  <span className="flex items-center gap-0.5 text-xs text-amber-500">
                    <Star className="size-3 fill-amber-400" /> {rating.toFixed(1)}
                  </span>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Subject + Grade + Category badges */}
        <div className="flex flex-wrap items-center gap-1.5 mt-2">
          <Badge variant="default" className="text-xs px-2 py-0.5">{slot.subject.name}</Badge>
          {gradeLabel && (
            <Badge variant="outline" className="text-xs px-2 py-0.5">{gradeLabel}</Badge>
          )}
          {slot.subject.category && (
            <Badge variant="outline" className="text-xs px-2 py-0.5 text-muted-foreground">
              {slot.subject.category}
            </Badge>
          )}
        </div>
      </CardHeader>

      <CardContent className="pb-3 space-y-3">
        <Separator />

        <div className="flex items-center gap-2 text-sm">
          <CalendarDays className="size-4 shrink-0 text-muted-foreground" />
          <span className="font-medium">{formattedDate}</span>
        </div>
        <div className="flex items-center gap-2 text-sm">
          <Clock className="size-4 shrink-0 text-muted-foreground" />
          <span>
            {formattedStart} – {formattedEnd}
            <span className="text-muted-foreground text-xs ml-1.5">({durationMins} min)</span>
          </span>
        </div>

        {/* Browse mode: price */}
        {props.mode === "browse" && slot.teacher.hourly_rate !== undefined && (
          <div className="flex items-center gap-2 text-sm">
            <Banknote className="size-4 shrink-0 text-muted-foreground" />
            <span className="font-semibold">
              {Number(slot.teacher.hourly_rate).toLocaleString("en-ET")} ETB
            </span>
            <span className="text-muted-foreground text-xs">/ session</span>
          </div>
        )}

        {/* Seat availability */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-xs">
            <div className="flex items-center gap-1.5 text-muted-foreground">
              <Users className="size-3.5" />
              <span>
                <span className={`font-semibold ${seatColor}`}>{slot.remaining_seats}</span>
                {" of "}
                <span className="font-medium">{slot.max_students}</span>
                {" seats left"}
              </span>
            </div>
            {isFull && props.mode === "browse" && (
              <span className="text-rose-500 font-medium text-xs">Full</span>
            )}
          </div>
          <Progress value={fillPct} className="h-1.5" />
        </div>
      </CardContent>

      <CardFooter className="pt-0 mt-auto gap-2">
        {/* ── Browse mode footer ── */}
        {props.mode === "browse" && (
          <>
            <Button variant="outline" size="sm" className="flex-1 gap-1" asChild>
              <a href={`/tutors/${slot.teacher.user.user_id}`}>
                Profile <ChevronRight className="size-3.5" />
              </a>
            </Button>
            <Button
              size="sm" className="flex-1 gap-1"
              disabled={isFull}
              onClick={e => { e.stopPropagation(); props.onBook(slot.slot_id) }}
            >
              <BookCheck className="size-4" />
              {isFull ? "Full" : "Book Now"}
            </Button>
          </>
        )}

        {/* ── Session mode footer ── */}
        {props.mode === "session" && (
          <>
            <Button variant="outline" size="sm" className="gap-1 text-xs" onClick={handleShare}>
              {copied ? <Check className="size-3.5 text-green-600" /> : <Share2 className="size-3.5" />}
              {copied ? "Copied" : "Share"}
            </Button>
            {isCompleted ? (
              <Button size="sm" variant="outline" className="flex-1 text-xs" disabled>
                Session Ended
              </Button>
            ) : slot.session ? (
              <Button size="sm" className="flex-1 gap-1.5 text-xs" asChild
                onClick={e => e.stopPropagation()}>
                <a href={`/room/${slot.session!.room_name ?? slot.session!.session_id}`}>
                  <Video className="size-3.5" />
                  {isLive ? "Join Live" : "Enter Room"}
                </a>
              </Button>
            ) : (
              <Button size="sm" variant="outline" className="flex-1 text-xs" disabled>
                Waiting for tutor…
              </Button>
            )}
          </>
        )}
      </CardFooter>
    </Card>
  )
}
