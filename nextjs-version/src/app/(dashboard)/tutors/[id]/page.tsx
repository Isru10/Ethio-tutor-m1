"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import Link from "next/link"
import {
  Star, Clock, Users, Banknote, BookOpen, ArrowLeft,
  Award, Globe, ChevronRight, CheckCircle2, Calendar,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { Skeleton } from "@/components/ui/skeleton"
import { useAuthStore } from "@/store/authStore"
import { getTutorById } from "@/lib/services/dashboardService"
import type { TutorWithProfile, SlotWithDetails } from "@/types/database"
import type { Review } from "@/types/database"

// ── Types for the enriched tutor detail ─────────────────────
type TutorDetail = TutorWithProfile & {
  reviewItems: { review: Review; studentName: string }[]
  availableSlots: SlotWithDetails[]
}

// ── Star rating display ──────────────────────────────────────
function StarRating({ rating, size = "sm" }: { rating: number; size?: "sm" | "lg" }) {
  const cls = size === "lg" ? "size-5" : "size-3.5"
  return (
    <div className="flex items-center gap-1">
      {Array.from({ length: 5 }).map((_, i) => (
        <Star
          key={i}
          className={
            i < Math.floor(rating)
              ? `${cls} fill-amber-400 text-amber-400`
              : i < rating
              ? `${cls} fill-amber-200 text-amber-200`
              : `${cls} text-muted-foreground/30`
          }
        />
      ))}
    </div>
  )
}

// ── Stat pill ────────────────────────────────────────────────
function StatPill({ icon: Icon, label, value }: { icon: React.ElementType; label: string; value: string }) {
  return (
    <div className="flex flex-col items-center gap-1 rounded-xl border bg-card p-4 text-center">
      <Icon className="size-5 text-primary" />
      <p className="text-lg font-bold">{value}</p>
      <p className="text-xs text-muted-foreground">{label}</p>
    </div>
  )
}

// ── Slot card ────────────────────────────────────────────────
function SlotCard({ slot, onBook }: { slot: SlotWithDetails; onBook: () => void }) {
  const formatDate = (date: string, time: string) => {
    const d = new Date(`${date}T${time}`)
    return d.toLocaleDateString("en-ET", { weekday: "long", month: "short", day: "numeric" }) +
           " · " + d.toLocaleTimeString("en-ET", { hour: "2-digit", minute: "2-digit" })
  }
  return (
    <div className="flex items-center justify-between rounded-xl border px-4 py-3 hover:border-primary/40 transition-colors">
      <div className="flex items-center gap-3">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10">
          <Calendar className="size-4 text-primary" />
        </div>
        <div>
          <p className="text-sm font-medium">{slot.subject.name}</p>
          <p className="text-xs text-muted-foreground">
            {formatDate(slot.slot.slot_date, slot.slot.start_time)}
          </p>
          <p className="text-xs text-muted-foreground">
            Grades {slot.grade_from_label} – {slot.grade_to_label} · {slot.slot.remaining_seats} seat{slot.slot.remaining_seats !== 1 ? "s" : ""} left
          </p>
        </div>
      </div>
      <div className="flex flex-col items-end gap-1.5">
        <p className="text-sm font-bold">{slot.teacher_profile.hourly_rate} <span className="text-xs font-normal text-muted-foreground">ETB</span></p>
        <Button size="sm" className="h-7 text-xs px-3" onClick={onBook}>Book</Button>
      </div>
    </div>
  )
}

// ── Main page ────────────────────────────────────────────────
export default function TutorProfilePage() {
  const params    = useParams()
  const router    = useRouter()
  const { user }  = useAuthStore()
  const tutorId   = Number(params.id)

  const [tutor,   setTutor]   = useState<TutorDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)

  useEffect(() => {
    if (!user || isNaN(tutorId)) return
    getTutorById(tutorId, user.tenant_id).then((data) => {
      if (!data) { setNotFound(true) } else { setTutor(data as TutorDetail) }
      setLoading(false)
    })
  }, [tutorId, user])

  if (loading) {
    return (
      <div className="space-y-6 px-4 lg:px-6">
        <Skeleton className="h-8 w-40" />
        <div className="grid md:grid-cols-3 gap-6">
          <Skeleton className="h-80 rounded-2xl" />
          <div className="md:col-span-2 space-y-4">
            <Skeleton className="h-40 rounded-2xl" />
            <Skeleton className="h-40 rounded-2xl" />
          </div>
        </div>
      </div>
    )
  }

  if (notFound || !tutor) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center px-4">
        <p className="text-2xl font-bold mb-2">Tutor not found</p>
        <p className="text-muted-foreground text-sm mb-6">This tutor may not be available on your platform.</p>
        <Button asChild variant="outline"><Link href="/dashboard">← Back to Dashboard</Link></Button>
      </div>
    )
  }

  const { user: t, profile, subjects, reviewItems, availableSlots, reviewCount, totalEarned } = tutor
  const initials = t.name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2)
  const uniqueSubjects = Array.from(new Set(subjects.map((s) => s.subject.name)))
  const sessionsCount = (reviewCount ?? 0) + 8  // rough display number

  const gradientMap: Record<number, string> = {
    0: "linear-gradient(135deg, #6366f1, #8b5cf6)",
    1: "linear-gradient(135deg, #0ea5e9, #2563eb)",
    2: "linear-gradient(135deg, #10b981, #059669)",
  }
  const gradient = gradientMap[t.user_id % 3]

  return (
    <div className="space-y-6 px-4 lg:px-6">
      {/* ── Back nav ── */}
      <Button variant="ghost" size="sm" className="gap-1.5 -ml-2" onClick={() => router.back()}>
        <ArrowLeft className="size-4" /> Back
      </Button>

      <div className="grid md:grid-cols-3 gap-6 items-start">
        {/* ── LEFT: Profile card ── */}
        <div className="space-y-4">
          {/* Avatar + name card */}
          <Card>
            <CardContent className="pt-6 text-center space-y-3">
              {/* Big gradient avatar */}
              <div
                className="mx-auto flex h-24 w-24 items-center justify-center rounded-3xl text-white text-3xl font-bold shadow-lg"
                style={{ background: gradient }}
              >
                {initials}
              </div>
              <div>
                <h1 className="text-xl font-bold">{t.name}</h1>
                <p className="text-sm text-muted-foreground">{profile.experience_years} years of experience</p>
              </div>

              {/* Rating row */}
              <div className="flex items-center justify-center gap-2">
                <StarRating rating={profile.average_rating} size="lg" />
                <span className="text-base font-bold">{profile.average_rating.toFixed(1)}</span>
                <span className="text-sm text-muted-foreground">({reviewCount} reviews)</span>
              </div>

              {/* Online indicator */}
              <div className="flex items-center justify-center gap-1.5">
                <div className="h-2.5 w-2.5 rounded-full bg-green-500 animate-pulse" />
                <span className="text-sm text-green-600 dark:text-green-400 font-medium">Available Now</span>
              </div>

              <Separator />

              {/* Languages */}
              <div className="text-left space-y-1">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Teaches In</p>
                <div className="flex flex-wrap gap-1.5">
                  {profile.languages.split(",").map((lang) => (
                    <Badge key={lang} variant="outline" className="text-xs gap-1">
                      <Globe className="size-3" />{lang.trim()}
                    </Badge>
                  ))}
                </div>
              </div>

              {/* Qualifications */}
              <div className="text-left space-y-1">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Qualifications</p>
                <div className="flex items-start gap-1.5">
                  <Award className="size-4 text-amber-500 shrink-0 mt-0.5" />
                  <p className="text-sm">{profile.qualifications}</p>
                </div>
              </div>

              {/* Book CTA */}
              <Button className="w-full gap-2 mt-2" asChild>
                <Link href={`/browse?teacher=${t.user_id}`}>
                  <BookOpen className="size-4" />
                  Browse All Slots
                </Link>
              </Button>
            </CardContent>
          </Card>

          {/* Stats pills */}
          <div className="grid grid-cols-2 gap-3">
            <StatPill icon={Star} label="Rating" value={profile.average_rating.toFixed(1)} />
            <StatPill icon={Users} label="Sessions" value={sessionsCount.toString()} />
            <StatPill icon={Banknote} label="Rate/hr" value={`${profile.hourly_rate} ETB`} />
            <StatPill icon={CheckCircle2} label="ETB Earned" value={(totalEarned ?? 0).toLocaleString("en-ET")} />
          </div>
        </div>

        {/* ── RIGHT: Detail panels ── */}
        <div className="md:col-span-2 space-y-5">
          {/* About */}
          <Card>
            <CardHeader>
              <CardTitle>About {t.name.split(" ")[0]}</CardTitle>
              <CardDescription>Teaching bio & expertise</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm leading-relaxed text-muted-foreground">{profile.bio}</p>
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2">Subjects</p>
                <div className="flex flex-wrap gap-2">
                  {uniqueSubjects.map((sub) => (
                    <Badge key={sub} variant="secondary" className="text-sm px-3 py-1">
                      {sub}
                    </Badge>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Available slots */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-3">
              <div>
                <CardTitle>Available Slots</CardTitle>
                <CardDescription>Book a class directly from here</CardDescription>
              </div>
              <Button variant="outline" size="sm" asChild>
                <Link href={`/browse?teacher=${t.user_id}`}>
                  All slots <ChevronRight className="size-3.5 ml-1" />
                </Link>
              </Button>
            </CardHeader>
            <CardContent className="space-y-3">
              {availableSlots.length === 0 ? (
                <div className="flex flex-col items-center py-8 text-center">
                  <Clock className="size-8 text-muted-foreground mb-2" />
                  <p className="text-sm text-muted-foreground">No slots available right now. Check back soon!</p>
                </div>
              ) : (
                availableSlots.slice(0, 4).map((slot) => (
                  <SlotCard
                    key={slot.slot.slot_id}
                    slot={slot}
                    onBook={() => router.push(`/browse?slot=${slot.slot.slot_id}`)}
                  />
                ))
              )}
            </CardContent>
          </Card>

          {/* Reviews */}
          <Card>
            <CardHeader>
              <CardTitle>Student Reviews</CardTitle>
              <CardDescription>
                {reviewItems.length} review{reviewItems.length !== 1 ? "s" : ""} · {profile.average_rating.toFixed(1)} average
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {reviewItems.length === 0 ? (
                <p className="text-sm text-muted-foreground italic text-center py-6">
                  No reviews yet. Be the first to learn with {t.name.split(" ")[0]}!
                </p>
              ) : (
                reviewItems.map(({ review, studentName }) => (
                  <div key={review.review_id} className="space-y-2 pb-4 last:pb-0 border-b last:border-b-0">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2">
                        {/* Student avatar */}
                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-bold">
                          {studentName.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase()}
                        </div>
                        <div>
                          <p className="text-sm font-medium">{studentName}</p>
                          <p className="text-xs text-muted-foreground">
                            {new Date(review.created_at).toLocaleDateString("en-ET", {
                              month: "short", day: "numeric", year: "numeric"
                            })}
                          </p>
                        </div>
                      </div>
                      <StarRating rating={review.rating} />
                    </div>
                    <p className="text-sm text-muted-foreground leading-relaxed pl-10">
                      "{review.comment}"
                    </p>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
