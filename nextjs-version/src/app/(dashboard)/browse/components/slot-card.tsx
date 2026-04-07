"use client"

import {
  Star, Clock, Users, Banknote, CalendarDays,
  BookCheck, ChevronRight, Languages
} from "lucide-react"
import {
  Card, CardContent, CardFooter, CardHeader,
} from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Separator } from "@/components/ui/separator"
import type { SlotWithDetails } from "@/types/database"

interface SlotCardProps {
  slot: SlotWithDetails
  onBook: (slotId: number) => void
}

export function SlotCard({ slot, onBook }: SlotCardProps) {
  const { slot: s, subject, teacher, teacher_profile, grade_from_label, grade_to_label } = slot

  const initials = teacher.name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2)

  // Seat fill percentage
  const takenSeats = s.max_students - s.remaining_seats
  const fillPct = Math.round((takenSeats / s.max_students) * 100)

  // Seat color: green → amber → red
  const seatColor =
    s.remaining_seats === 0
      ? "text-rose-500"
      : s.remaining_seats <= 1
      ? "text-amber-500"
      : "text-green-600"

  // Normalise: slot_date is "YYYY-MM-DD", times are "HH:mm" (or "HH:mm:ss" — trim to 5 chars)
  const dateOnly   = s.slot_date.split("T")[0]
  const startTime  = s.start_time.slice(0, 5)
  const endTime    = s.end_time.slice(0, 5)

  const sessionDate = new Date(`${dateOnly}T${startTime}:00`)
  const endDate     = new Date(`${dateOnly}T${endTime}:00`)

  const formattedDate  = sessionDate.toLocaleDateString("en-ET", { weekday: "long", day: "numeric", month: "short" })
  const formattedStart = sessionDate.toLocaleTimeString("en-ET", { hour: "2-digit", minute: "2-digit" })
  const formattedEnd   = endDate.toLocaleTimeString("en-ET",     { hour: "2-digit", minute: "2-digit" })
  const durationMins   = Math.round((endDate.getTime() - sessionDate.getTime()) / 60000)

  const isFull = s.remaining_seats === 0

  return (
    <Card className={`flex flex-col transition-shadow duration-200 hover:shadow-md border ${isFull ? "opacity-60" : ""}`}>
      <CardHeader className="pb-3">
        {/* Teacher row */}
        <div className="flex items-start gap-3">
          {/* Avatar */}
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary text-primary-foreground text-sm font-bold">
            {initials}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <p className="font-semibold text-sm leading-tight">{teacher.name}</p>
              {/* Rating */}
              <div className="flex items-center gap-1 shrink-0">
                <Star className="size-3.5 fill-amber-400 text-amber-400" />
                <span className="text-xs font-semibold">{Number(teacher_profile.average_rating).toFixed(1)}</span>
              </div>
            </div>
            {/* Experience + Languages */}
            <div className="flex items-center gap-1.5 mt-1 text-muted-foreground">
              <Languages className="size-3" />
              <span className="text-xs truncate">
                {teacher_profile.experience_years}y exp · {teacher_profile.languages.replace(/,/g, " · ")}
              </span>
            </div>
          </div>
        </div>

        {/* Subject + Grade badges */}
        <div className="flex flex-wrap items-center gap-1.5 mt-2">
          <Badge variant="default" className="text-xs px-2 py-0.5">
            {subject.name}
          </Badge>
          <Badge variant="outline" className="text-xs px-2 py-0.5">
            {grade_from_label === grade_to_label
              ? grade_from_label
              : `${grade_from_label} – ${grade_to_label}`}
          </Badge>
          <Badge variant="outline" className="text-xs px-2 py-0.5 text-muted-foreground">
            {subject.category}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="pb-3 space-y-3">
        <Separator />

        {/* Date & Time */}
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

        {/* Price */}
        <div className="flex items-center gap-2 text-sm">
          <Banknote className="size-4 shrink-0 text-muted-foreground" />
          <span className="font-semibold">{Number(teacher_profile.hourly_rate).toLocaleString("en-ET")} ETB</span>
          <span className="text-muted-foreground text-xs">/ session</span>
        </div>

        {/* Seat availability */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-xs">
            <div className="flex items-center gap-1.5 text-muted-foreground">
              <Users className="size-3.5" />
              <span>
                <span className={`font-semibold ${seatColor}`}>{s.remaining_seats}</span>
                {" of "}
                <span className="font-medium">{s.max_students}</span>
                {" seats left"}
              </span>
            </div>
            {isFull && (
              <span className="text-rose-500 font-medium text-xs">Full</span>
            )}
          </div>
          <Progress
            value={fillPct}
            className="h-1.5"
          />
        </div>
      </CardContent>

      <CardFooter className="pt-0 mt-auto gap-2">
        <Button
          variant="outline"
          size="sm"
          className="flex-1 gap-1"
          asChild
        >
          <a href={`/browse?teacher=${teacher.user_id}`}>
            Profile <ChevronRight className="size-3.5" />
          </a>
        </Button>
        <Button
          size="sm"
          className="flex-1 gap-1"
          disabled={isFull}
          onClick={() => onBook(s.slot_id)}
        >
          <BookCheck className="size-4" />
          {isFull ? "Full" : "Book Now"}
        </Button>
      </CardFooter>
    </Card>
  )
}
