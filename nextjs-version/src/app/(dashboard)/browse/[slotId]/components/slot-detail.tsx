"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import {
  ArrowLeft, Star, Clock, Users, Banknote, CalendarDays,
  Languages, GraduationCap, FileText, BookCheck, Share2, Check,
} from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Separator } from "@/components/ui/separator"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { BookingDialog } from "../../components/booking-dialog"
import type { SlotWithDetails } from "@/types/database"
import { toast } from "sonner"

interface SlotDetailProps {
  slot: SlotWithDetails
}

export function SlotDetail({ slot }: SlotDetailProps) {
  const router = useRouter()
  const [dialogOpen, setDialogOpen] = useState(false)
  const [copied, setCopied] = useState(false)

  const { slot: s, subject, teacher, teacher_profile, grade_from_label, grade_to_label } = slot

  const dateOnly    = s.slot_date.split("T")[0]
  const startTime   = s.start_time.slice(0, 5)
  const endTime     = s.end_time.slice(0, 5)
  const sessionDate = new Date(`${dateOnly}T${startTime}:00`)
  const endDate     = new Date(`${dateOnly}T${endTime}:00`)
  const durationMins = Math.round((endDate.getTime() - sessionDate.getTime()) / 60000)
  const takenSeats  = s.max_students - s.remaining_seats
  const fillPct     = Math.round((takenSeats / s.max_students) * 100)
  const isFull      = s.remaining_seats === 0
  const rating      = Number(teacher_profile.average_rating ?? 0)
  const initials    = teacher.name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2)
  const langs       = teacher_profile.languages.split(",").map(l => l.trim()).filter(Boolean)

  const handleShare = async () => {
    const url = window.location.href
    if (navigator.share) {
      try { await navigator.share({ title: `${subject.name} class by ${teacher.name}`, url }) } catch {}
    } else {
      navigator.clipboard.writeText(url)
      setCopied(true)
      toast.success("Link copied!")
      setTimeout(() => setCopied(false), 2000)
    }
  }

  return (
    <>
      {/* Back */}
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => router.back()}>
          <ArrowLeft className="size-4" />
        </Button>
        <span className="text-sm text-muted-foreground">Back to Browse</span>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_340px]">
        {/* ── Left: session info ── */}
        <div className="space-y-5">
          {/* Header */}
          <div className="flex items-start gap-4">
            <Avatar className="h-14 w-14 shrink-0">
              <AvatarFallback className="bg-primary text-primary-foreground text-lg font-bold">
                {initials}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <h1 className="text-2xl font-bold tracking-tight">{subject.name}</h1>
              <p className="text-muted-foreground">with {teacher.name}</p>
              <div className="flex flex-wrap items-center gap-2 mt-2">
                <Badge variant="default">{subject.name}</Badge>
                {grade_from_label && grade_to_label && (
                  <Badge variant="outline">
                    {grade_from_label === grade_to_label ? grade_from_label : `${grade_from_label} – ${grade_to_label}`}
                  </Badge>
                )}
                {subject.category && (
                  <Badge variant="outline" className="text-muted-foreground">{subject.category}</Badge>
                )}
              </div>
            </div>
          </div>

          {/* Description */}
          {(s as any).description && (
            <Card>
              <CardContent className="pt-4 pb-4">
                <div className="flex items-center gap-2 mb-2">
                  <FileText className="size-4 text-muted-foreground" />
                  <span className="font-semibold text-sm">About this session</span>
                </div>
                <div
                  className="text-sm text-muted-foreground leading-relaxed tiptap-editor"
                  dangerouslySetInnerHTML={{ __html: (s as any).description }}
                />
              </CardContent>
            </Card>
          )}

          {/* Session details */}
          <Card>
            <CardContent className="pt-4 pb-4 space-y-3">
              <p className="font-semibold text-sm">Session Details</p>
              <Separator />
              <div className="grid gap-3 text-sm">
                <div className="flex items-center gap-3">
                  <CalendarDays className="size-4 text-muted-foreground shrink-0" />
                  <span>{sessionDate.toLocaleDateString("en-ET", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}</span>
                </div>
                <div className="flex items-center gap-3">
                  <Clock className="size-4 text-muted-foreground shrink-0" />
                  <span>
                    {sessionDate.toLocaleTimeString("en-ET", { hour: "2-digit", minute: "2-digit" })}
                    {" – "}
                    {endDate.toLocaleTimeString("en-ET", { hour: "2-digit", minute: "2-digit" })}
                    <span className="text-muted-foreground ml-2 text-xs">({durationMins} min)</span>
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <GraduationCap className="size-4 text-muted-foreground shrink-0" />
                  <span>
                    {grade_from_label === grade_to_label ? grade_from_label : `${grade_from_label} – ${grade_to_label}`}
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <Users className="size-4 text-muted-foreground shrink-0" />
                  <div className="flex-1">
                    <div className="flex justify-between text-xs mb-1">
                      <span><span className="font-semibold">{s.remaining_seats}</span> of {s.max_students} seats left</span>
                      {isFull && <span className="text-rose-500 font-medium">Full</span>}
                    </div>
                    <Progress value={fillPct} className="h-1.5" />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* ── Right: tutor + booking ── */}
        <div className="space-y-4">
          {/* Tutor card */}
          <Card>
            <CardContent className="pt-4 pb-4 space-y-3">
              <p className="font-semibold text-sm">Your Tutor</p>
              <Separator />
              <div className="flex items-center gap-3">
                <Avatar className="h-12 w-12">
                  <AvatarFallback className="bg-primary/10 text-primary font-bold">{initials}</AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-semibold">{teacher.name}</p>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground mt-0.5">
                    {rating > 0 && (
                      <span className="flex items-center gap-0.5 text-amber-500">
                        <Star className="size-3 fill-amber-400" /> {rating.toFixed(1)}
                      </span>
                    )}
                    <span>{teacher_profile.experience_years}y exp</span>
                  </div>
                </div>
              </div>
              {teacher_profile.bio && (
                <p className="text-xs text-muted-foreground leading-relaxed line-clamp-3">
                  {teacher_profile.bio}
                </p>
              )}
              {langs.length > 0 && (
                <div className="flex items-center gap-1.5 flex-wrap">
                  <Languages className="size-3.5 text-muted-foreground" />
                  {langs.map(l => (
                    <span key={l} className="text-xs bg-muted px-1.5 py-0.5 rounded-md">{l}</span>
                  ))}
                </div>
              )}
              <Button variant="outline" size="sm" className="w-full" asChild>
                <a href={`/tutors/${teacher.user_id}`}>View Full Profile</a>
              </Button>
            </CardContent>
          </Card>

          {/* Booking card */}
          <Card className="sticky top-4">
            <CardContent className="pt-4 pb-4 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Banknote className="size-4 text-muted-foreground" />
                  <span className="text-2xl font-bold">
                    {Number(teacher_profile.hourly_rate).toLocaleString("en-ET")} ETB
                  </span>
                </div>
                <span className="text-xs text-muted-foreground">/ session</span>
              </div>
              <Button
                className="w-full gap-2"
                disabled={isFull}
                onClick={() => setDialogOpen(true)}
              >
                <BookCheck className="size-4" />
                {isFull ? "Session Full" : "Book This Session"}
              </Button>
              <Button variant="outline" size="sm" className="w-full gap-2" onClick={handleShare}>
                {copied ? <><Check className="size-3.5 text-green-600" /> Copied!</> : <><Share2 className="size-3.5" /> Share</>}
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>

      <BookingDialog
        slot={slot}
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        onConfirm={() => {}}
      />

      <style>{`
        .tiptap-editor h2 { font-size: 1.1rem; font-weight: 700; margin: 0.5rem 0 0.25rem; }
        .tiptap-editor ul { list-style-type: disc; padding-left: 1.5rem; margin: 0.5rem 0; }
        .tiptap-editor ol { list-style-type: decimal; padding-left: 1.5rem; margin: 0.5rem 0; }
        .tiptap-editor li { margin: 0.2rem 0; }
        .tiptap-editor blockquote { border-left: 3px solid hsl(var(--border)); padding-left: 1rem; color: hsl(var(--muted-foreground)); margin: 0.5rem 0; font-style: italic; }
      `}</style>
    </>
  )
}
