"use client"

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { CalendarDays, Clock, Users, Banknote, Star, CheckCircle2 } from "lucide-react"
import { useState } from "react"
import type { SlotWithDetails } from "@/types/database"

interface BookingDialogProps {
  slot: SlotWithDetails | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onConfirm: (slotId: number) => void
}

export function BookingDialog({ slot, open, onOpenChange, onConfirm }: BookingDialogProps) {
  const [confirming, setConfirming] = useState(false)
  const [confirmed, setConfirmed] = useState(false)

  if (!slot) return null

  const { slot: s, subject, teacher, teacher_profile, grade_from_label, grade_to_label } = slot

  const sessionDate = new Date(`${s.slot_date}T${s.start_time}`)
  const endDate = new Date(`${s.slot_date}T${s.end_time}`)
  const durationMins = Math.round((endDate.getTime() - sessionDate.getTime()) / 60000)

  const initials = teacher.name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2)

  const handleConfirm = async () => {
    setConfirming(true)
    // Simulate network call (300ms – matches mock service)
    await new Promise((r) => setTimeout(r, 700))
    onConfirm(s.slot_id)
    setConfirming(false)
    setConfirmed(true)
  }

  const handleClose = () => {
    setConfirmed(false)
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        {confirmed ? (
          /* ── Success state ── */
          <div className="flex flex-col items-center gap-4 py-6 text-center">
            <CheckCircle2 className="size-14 text-green-500" />
            <DialogHeader>
              <DialogTitle>Booking Confirmed!</DialogTitle>
              <DialogDescription>
                Your session has been booked. Check <strong>My Bookings</strong> for details.
              </DialogDescription>
            </DialogHeader>
            <Button className="w-full" onClick={handleClose}>Done</Button>
          </div>
        ) : (
          /* ── Confirmation state ── */
          <>
            <DialogHeader>
              <DialogTitle>Confirm Your Booking</DialogTitle>
              <DialogDescription>
                Review the details below before confirming.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-2">
              {/* Teacher row */}
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary text-primary-foreground text-sm font-bold">
                  {initials}
                </div>
                <div>
                  <p className="font-semibold text-sm">{teacher.name}</p>
                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    <Star className="size-3 fill-amber-400 text-amber-400" />
                    {teacher_profile.average_rating.toFixed(1)} · {teacher_profile.experience_years}y exp
                  </div>
                </div>
              </div>

              <Separator />

              {/* Session details */}
              <div className="space-y-2.5 text-sm">
                <div className="flex items-center gap-3">
                  <Badge>{subject.name}</Badge>
                  <Badge variant="outline">
                    {grade_from_label === grade_to_label
                      ? grade_from_label
                      : `${grade_from_label} – ${grade_to_label}`}
                  </Badge>
                </div>

                <div className="flex items-center gap-2 text-muted-foreground">
                  <CalendarDays className="size-4" />
                  <span>
                    {sessionDate.toLocaleDateString("en-ET", {
                      weekday: "long", day: "numeric", month: "long",
                    })}
                  </span>
                </div>

                <div className="flex items-center gap-2 text-muted-foreground">
                  <Clock className="size-4" />
                  <span>
                    {sessionDate.toLocaleTimeString("en-ET", { hour: "2-digit", minute: "2-digit" })}
                    {" – "}
                    {endDate.toLocaleTimeString("en-ET", { hour: "2-digit", minute: "2-digit" })}
                    <span className="ml-1.5 text-xs">({durationMins} min)</span>
                  </span>
                </div>

                <div className="flex items-center gap-2 text-muted-foreground">
                  <Users className="size-4" />
                  <span>{s.remaining_seats} seat{s.remaining_seats !== 1 ? "s" : ""} remaining</span>
                </div>
              </div>

              <Separator />

              {/* Price summary */}
              <div className="flex items-center justify-between rounded-lg bg-muted/50 px-3 py-2">
                <div className="flex items-center gap-2 text-sm">
                  <Banknote className="size-4 text-muted-foreground" />
                  <span className="text-muted-foreground">Total</span>
                </div>
                <span className="font-bold text-base">{teacher_profile.hourly_rate} ETB</span>
              </div>
            </div>

            <DialogFooter className="gap-2 sm:gap-0">
              <Button variant="outline" onClick={handleClose} disabled={confirming}>
                Cancel
              </Button>
              <Button onClick={handleConfirm} disabled={confirming}>
                {confirming ? "Confirming…" : "Confirm Booking"}
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  )
}
