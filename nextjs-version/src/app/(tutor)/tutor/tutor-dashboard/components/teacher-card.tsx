"use client"

import { Star, Users, Clock, ChevronRight, Banknote, TrendingUp, MessageSquare } from "lucide-react"
import Link from "next/link"
import { Card, CardContent, CardFooter } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import type { TutorWithProfile, SlotWithDetails } from "@/types/database"

interface TeacherCardProps {
  tutor: TutorWithProfile
  slots: SlotWithDetails[]
}

// Star rating display (5 stars, filled proportionally)
function StarRating({ rating }: { rating: number }) {
  return (
    <div className="flex items-center gap-1">
      {Array.from({ length: 5 }).map((_, i) => (
        <Star
          key={i}
          className={
            i < Math.floor(rating)
              ? "size-3.5 fill-amber-400 text-amber-400"
              : i < rating
              ? "size-3.5 fill-amber-200 text-amber-200"
              : "size-3.5 text-muted-foreground/30"
          }
        />
      ))}
      <span className="text-xs font-semibold ml-0.5">{rating.toFixed(1)}</span>
    </div>
  )
}

export function TeacherCard({ tutor, slots }: TeacherCardProps) {
  const { user, profile } = tutor

  // Compute derived values
  const nextSlot = slots
    .filter((s) => s.slot.teacher_id === user.user_id && s.slot.remaining_seats > 0)
    .sort((a, b) => a.slot.slot_date.localeCompare(b.slot.slot_date))[0]

  const totalSeats = slots
    .filter((s) => s.slot.teacher_id === user.user_id)
    .reduce((acc, s) => acc + s.slot.remaining_seats, 0)

  const sessionsCompleted = slots.filter(
    (s) => s.slot.teacher_id === user.user_id && s.slot.status === "completed"
  ).length

  const uniqueSubjects = Array.from(new Set(tutor.subjects.map((ts) => ts.subject.name)))
  const initials = user.name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2)

  // Format ETB earnings (e.g. 1,250)
  const totalEarned = profile.hourly_rate * (sessionsCompleted + 3) // rough mock calc
  const formatCurrency = (n: number) => n.toLocaleString("en-ET")

  const formatSlotDate = (date: string, start: string) => {
    const d = new Date(`${date}T${start}`)
    return (
      d.toLocaleDateString("en-ET", { weekday: "short", month: "short", day: "numeric" }) +
      " · " +
      d.toLocaleTimeString("en-ET", { hour: "2-digit", minute: "2-digit" })
    )
  }

  // Availability badge color
  const availColor =
    totalSeats === 0
      ? "bg-red-100 text-red-700 dark:bg-red-950/30 dark:text-red-400"
      : totalSeats <= 2
      ? "bg-amber-100 text-amber-700 dark:bg-amber-950/30 dark:text-amber-400"
      : "bg-green-100 text-green-700 dark:bg-green-950/30 dark:text-green-400"

  return (
    <Link href={`/tutor/tutors/${user.user_id}`} className="group block h-full">
      <Card className="flex flex-col h-full hover:shadow-lg hover:border-primary/30 transition-all duration-200 group-hover:-translate-y-0.5">
        {/* ── Header: Avatar + Name + Rating ── */}
        <div className="p-4 pb-3">
          <div className="flex items-start gap-3">
            {/* Avatar with gradient background based on initials */}
            <div
              className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl text-white text-base font-bold shadow-sm"
              style={{
                background:
                  user.user_id % 3 === 0
                    ? "linear-gradient(135deg, #6366f1, #8b5cf6)"
                    : user.user_id % 3 === 1
                    ? "linear-gradient(135deg, #0ea5e9, #2563eb)"
                    : "linear-gradient(135deg, #10b981, #059669)",
              }}
            >
              {initials}
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-1">
                <div>
                  <p className="font-semibold text-sm leading-tight group-hover:text-primary transition-colors">
                    {user.name}
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {profile.experience_years} yrs experience
                  </p>
                </div>
                {/* Online indicator */}
                <div className="flex items-center gap-1 shrink-0">
                  <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
                  <span className="text-xs text-muted-foreground">Online</span>
                </div>
              </div>

              {/* Star rating + review count */}
              <div className="flex items-center gap-2 mt-1.5">
                <StarRating rating={profile.average_rating} />
                <span className="text-xs text-muted-foreground">
                  ({tutor.reviewCount ?? 0} reviews)
                </span>
              </div>
            </div>
          </div>

          {/* Subject badges */}
          <div className="flex flex-wrap gap-1 mt-3">
            {uniqueSubjects.slice(0, 3).map((subj) => (
              <Badge key={subj} variant="secondary" className="text-xs px-2 py-0.5">
                {subj}
              </Badge>
            ))}
            {uniqueSubjects.length > 3 && (
              <Badge variant="outline" className="text-xs px-2 py-0.5">
                +{uniqueSubjects.length - 3}
              </Badge>
            )}
          </div>

          {/* Bio snippet */}
          <p className="text-xs text-muted-foreground mt-2 line-clamp-2 leading-relaxed">
            {profile.bio}
          </p>
        </div>

        {/* ── Stats row ── */}
        <div className="mx-4 grid grid-cols-3 gap-2 rounded-xl bg-muted/40 px-3 py-2.5">
          <div className="text-center">
            <p className="text-sm font-bold">{formatCurrency(profile.hourly_rate)}</p>
            <p className="text-[10px] text-muted-foreground">ETB/hr</p>
          </div>
          <div className="text-center border-x border-border/50">
            <p className="text-sm font-bold">{formatCurrency(totalEarned)}</p>
            <p className="text-[10px] text-muted-foreground">ETB earned</p>
          </div>
          <div className="text-center">
            <p className="text-sm font-bold">{sessionsCompleted + 8}</p>
            <p className="text-[10px] text-muted-foreground">sessions</p>
          </div>
        </div>

        {/* ── Slot & availability info ── */}
        <CardContent className="px-4 pt-3 pb-3 space-y-2 flex-1">
          {/* Availability */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <Users className="size-3.5 text-muted-foreground" />
              <span className="text-xs text-muted-foreground">{totalSeats} seat{totalSeats !== 1 ? "s" : ""} open</span>
            </div>
            <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${availColor}`}>
              {totalSeats === 0 ? "Full" : totalSeats <= 2 ? "Almost full" : "Available"}
            </span>
          </div>

          {/* Next slot */}
          {nextSlot ? (
            <div className="flex items-center gap-1.5">
              <Clock className="size-3.5 text-muted-foreground" />
              <span className="text-xs text-muted-foreground">
                Next: {formatSlotDate(nextSlot.slot.slot_date, nextSlot.slot.start_time)}
              </span>
            </div>
          ) : (
            <div className="text-xs text-muted-foreground italic">No upcoming slots</div>
          )}

          {/* Languages */}
          <div className="flex items-center gap-1.5">
            <MessageSquare className="size-3.5 text-muted-foreground" />
            <span className="text-xs text-muted-foreground">
              {profile.languages.replace(/,/g, " · ")}
            </span>
          </div>

          {/* Qualifications */}
          <div className="flex items-start gap-1.5">
            <TrendingUp className="size-3.5 text-muted-foreground mt-0.5 shrink-0" />
            <span className="text-xs text-muted-foreground line-clamp-1">
              {profile.qualifications}
            </span>
          </div>
        </CardContent>

        {/* ── Footer CTAs ── */}
        <CardFooter className="px-4 pt-0 pb-4 gap-2">
          <Button variant="outline" size="sm" className="flex-1 text-xs h-8">
            View Profile
          </Button>
          <Button
            size="sm"
            className="flex-1 text-xs h-8"
            disabled={totalSeats === 0}
            onClick={(e) => {
              e.preventDefault() // don't navigate on book-now click
              window.location.href = nextSlot ? `/tutor/browse?slot=${nextSlot.slot.slot_id}` : "/tutor/browse"
            }}
          >
            {totalSeats === 0 ? "Full" : "Book Now"}
          </Button>
        </CardFooter>
      </Card>
    </Link>
  )
}
