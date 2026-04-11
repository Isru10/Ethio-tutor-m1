"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { ArrowLeft, Users, Clock, CheckCircle2, XCircle, Loader2, Video } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { useAuthStore } from "@/lib/store/useAuthStore"
import { bookingService } from "@/lib/services/bookingService"
import { startSessionApi } from "@/lib/services/sessionService"
import { API_BASE } from "@/lib/api"

const STATUS_STYLES: Record<string, string> = {
  confirmed: "bg-blue-100 text-blue-700 dark:bg-blue-950/30 dark:text-blue-400",
  pending:   "bg-amber-100 text-amber-700 dark:bg-amber-950/30 dark:text-amber-400",
  completed: "bg-green-100 text-green-700 dark:bg-green-950/30 dark:text-green-400",
  cancelled: "bg-rose-100 text-rose-700 dark:bg-rose-950/30 dark:text-rose-400",
}

export default function SlotDetailPage() {
  const { slotId } = useParams<{ slotId: string }>()
  const router = useRouter()
  const { user } = useAuthStore()

  const [bookings, setBookings] = useState<any[]>([])
  const [slotInfo, setSlotInfo] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [starting, setStarting] = useState(false)

  useEffect(() => {
    if (!user) return
    bookingService.getTutorBookings()
      .then((all: any[]) => {
        const forSlot = all.filter((b: any) => {
          const sid = b.slot?.slot_id ?? b.slot_id
          return String(sid) === String(slotId)
        })
        if (forSlot.length > 0) setSlotInfo(forSlot[0].slot)
        setBookings(forSlot)
      })
      .finally(() => setLoading(false))
  }, [user, slotId])

  const handleStart = async () => {
    const firstConfirmed = bookings.find(b => b.status === "confirmed")
    if (!firstConfirmed) return
    try {
      setStarting(true)
      const res = await startSessionApi(firstConfirmed.booking_id)
      router.push(`/room/${res.sessionId}?token=${encodeURIComponent(res.token)}&url=${encodeURIComponent(res.liveKitUrl)}`)
    } catch (err: any) {
      alert(err.message)
      setStarting(false)
    }
  }

  const sessionStatus = slotInfo?.session?.status
  const hasConfirmed  = bookings.some(b => b.status === "confirmed")
  const dateOnly      = slotInfo?.slot_date?.split("T")[0] ?? ""
  const start         = slotInfo?.start_time?.slice(0, 5) ?? ""
  const end           = slotInfo?.end_time?.slice(0, 5) ?? ""

  return (
    <>
      <div className="px-4 lg:px-6 flex items-center gap-3">
        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => router.back()}>
          <ArrowLeft className="size-4" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            {loading ? "Loading…" : slotInfo?.subject?.name ?? "Session"} — Enrolled Students
          </h1>
          {slotInfo && (
            <p className="text-muted-foreground text-sm">
              {dateOnly} · {start} – {end}
            </p>
          )}
        </div>
      </div>

      {/* Session action */}
      {!loading && slotInfo && (
        <div className="px-4 lg:px-6">
          <Card>
            <CardContent className="pt-4 pb-4 flex items-center justify-between gap-4 flex-wrap">
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2 text-sm">
                  <Users className="size-4 text-muted-foreground" />
                  <span>{bookings.filter(b => b.status !== "cancelled").length} / {slotInfo.max_students} students enrolled</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Clock className="size-4 text-muted-foreground" />
                  <span>{start} – {end}</span>
                </div>
              </div>
              <div className="flex gap-2">
                {sessionStatus === "live" && (
                  <Button
                    size="sm"
                    className="gap-1.5 bg-blue-600 hover:bg-blue-700 text-white"
                    onClick={() => router.push(`/room/${slotInfo.session.session_id}`)}
                  >
                    <Video className="size-3.5" /> Rejoin Session
                  </Button>
                )}
                {sessionStatus !== "live" && sessionStatus !== "completed" && hasConfirmed && (
                  <Button
                    size="sm"
                    className="gap-1.5 bg-green-600 hover:bg-green-700 text-white"
                    disabled={starting}
                    onClick={handleStart}
                  >
                    {starting ? <Loader2 className="size-3.5 animate-spin" /> : <Video className="size-3.5" />}
                    {starting ? "Launching…" : "Start Session"}
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Students table */}
      <div className="px-4 lg:px-6">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Enrolled Students</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="space-y-2">
                {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-12 rounded" />)}
              </div>
            ) : bookings.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-10">No students enrolled yet.</p>
            ) : (
              <div className="space-y-2">
                {bookings.map(b => (
                  <div key={b.booking_id} className="flex items-center justify-between rounded-lg border px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 text-primary text-sm font-bold">
                        {b.student?.user?.name?.charAt(0)?.toUpperCase() ?? "S"}
                      </div>
                      <div>
                        <p className="font-medium text-sm">{b.student?.user?.name ?? "Student"}</p>
                        <p className="text-xs text-muted-foreground">
                          Booked {new Date(b.created_at).toLocaleDateString("en-ET", { day: "numeric", month: "short" })}
                          {b.student_grade ? ` · Grade ${b.student_grade}` : ""}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {b.transaction && (
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${b.transaction.payment_status === "paid" ? "bg-green-100 text-green-700" : "bg-amber-100 text-amber-700"}`}>
                          {b.transaction.payment_status === "paid" ? "Paid" : "Unpaid"}
                        </span>
                      )}
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium capitalize ${STATUS_STYLES[b.status] ?? ""}`}>
                        {b.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </>
  )
}
