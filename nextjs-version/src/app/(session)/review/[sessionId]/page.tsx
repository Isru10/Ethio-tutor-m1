"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { useAuthStore } from "@/lib/store/useAuthStore"
import { API_BASE } from "@/lib/api"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Loader2, Star, CheckCircle2, AlertTriangle, Video } from "lucide-react"
import { toast } from "sonner"
import { joinSessionApi } from "@/lib/services/sessionService"

function authHeaders() {
  return { Authorization: `Bearer ${useAuthStore.getState().accessToken}`, "Content-Type": "application/json" }
}

type Step = "rating" | "report" | "done"

export default function ReviewPage() {
  const { sessionId } = useParams<{ sessionId: string }>()
  const router = useRouter()
  const { user } = useAuthStore()

  const [step, setStep]               = useState<Step>("rating")
  const [sessionInfo, setSessionInfo] = useState<any>(null)
  const [loading, setLoading]         = useState(true)
  const [submitting, setSubmitting]   = useState(false)
  const [rejoining, setRejoining]     = useState(false)

  // Rating state
  const [rating, setRating]   = useState(0)
  const [hovered, setHovered] = useState(0)
  const [comment, setComment] = useState("")

  // Report state
  const [reportText, setReportText] = useState("")
  const [skipReport, setSkipReport] = useState(false)

  useEffect(() => {
    if (!user) return
    fetch(`${API_BASE}/sessions/${sessionId}`, { headers: authHeaders() })
      .then(r => r.json())
      .then(res => setSessionInfo(res.data))
      .catch(() => toast.error("Could not load session info"))
      .finally(() => setLoading(false))
  }, [sessionId, user])

  const isSessionLive = sessionInfo?.status === "live"

  // Find this student's completed booking for this session
  const myBooking = sessionInfo?.slot?.bookings?.find(
    (b: any) => b.student?.user?.user_id === user?.user_id
  )

  const handleRejoin = async () => {
    setRejoining(true)
    try {
      const data = await joinSessionApi(sessionId)
      router.push(`/room/${data.sessionId}`)
    } catch (err: any) {
      toast.error(err.message || "Could not rejoin session")
      setRejoining(false)
    }
  }

  const handleSubmitRating = async () => {
    if (rating === 0) { toast.error("Please select a rating"); return }
    if (!myBooking) { toast.error("No completed booking found for this session"); return }

    setSubmitting(true)
    try {
      const res = await fetch(`${API_BASE}/reviews`, {
        method: "POST",
        headers: authHeaders(),
        body: JSON.stringify({
          bookingId: myBooking.booking_id,
          teacherId: sessionInfo.teacher_id,
          rating,
          comment,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.message ?? "Failed to submit review")
      setStep("report")
    } catch (err: any) {
      if (err.message?.includes("already reviewed")) {
        setStep("report")
      } else {
        toast.error(err.message)
      }
    } finally {
      setSubmitting(false)
    }
  }

  const handleSubmitReport = async () => {
    if (!skipReport && reportText.trim().length > 0) {
      toast.success("Report submitted. Our team will review it.")
    }
    setStep("done")
  }

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-muted/30">
      <Loader2 className="size-8 animate-spin text-muted-foreground" />
    </div>
  )

  const tutorName = sessionInfo?.slot?.teacher?.user?.name ?? "your tutor"
  const subject   = sessionInfo?.slot?.subject?.name ?? "the session"

  return (
    <div className="min-h-screen bg-muted/30 flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md space-y-4">

        {/* Step indicator */}
        <div className="flex items-center justify-center gap-2 mb-2">
          {(["rating", "report", "done"] as Step[]).map((s, i) => (
            <div key={s} className="flex items-center gap-2">
              <div className={`h-2 w-2 rounded-full transition-all ${
                step === s ? "bg-primary scale-125"
                : i < (["rating","report","done"] as Step[]).indexOf(step) ? "bg-primary/40"
                : "bg-muted-foreground/20"
              }`} />
            </div>
          ))}
        </div>

        {/* ── STEP 1: Rating ── */}
        {step === "rating" && (
          <Card>
            <CardHeader className="text-center pb-2">
              <CardTitle>How was your session?</CardTitle>
              <CardDescription>Rate {tutorName}&apos;s teaching for {subject}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">

              {/* Rejoin button — only shown if session is still live */}
              {isSessionLive && (
                <div className="rounded-lg border border-blue-200 bg-blue-50 dark:bg-blue-950/20 dark:border-blue-800 p-4 flex flex-col items-center gap-3 text-center">
                  <p className="text-sm font-medium text-blue-800 dark:text-blue-300">
                    The session is still live. Did you leave by accident?
                  </p>
                  <Button
                    className="gap-2 bg-blue-600 hover:bg-blue-700 text-white w-full"
                    disabled={rejoining}
                    onClick={handleRejoin}
                  >
                    {rejoining
                      ? <Loader2 className="size-4 animate-spin" />
                      : <Video className="size-4" />
                    }
                    {rejoining ? "Rejoining…" : "Rejoin Session"}
                  </Button>
                </div>
              )}

              {/* Star rating */}
              <div className="flex justify-center gap-2">
                {[1, 2, 3, 4, 5].map(n => (
                  <button
                    key={n}
                    onMouseEnter={() => setHovered(n)}
                    onMouseLeave={() => setHovered(0)}
                    onClick={() => setRating(n)}
                    className="transition-transform hover:scale-110"
                  >
                    <Star
                      className={`size-10 transition-colors ${
                        n <= (hovered || rating)
                          ? "fill-amber-400 text-amber-400"
                          : "text-muted-foreground/30"
                      }`}
                    />
                  </button>
                ))}
              </div>
              <p className="text-center text-sm text-muted-foreground">
                {rating === 0 ? "Tap a star to rate" : ["", "Poor", "Fair", "Good", "Very Good", "Excellent"][rating]}
              </p>

              <Textarea
                placeholder="Share your experience (optional)…"
                value={comment}
                onChange={e => setComment(e.target.value)}
                rows={3}
                className="resize-none"
              />

              <div className="flex gap-2">
                <Button variant="outline" className="flex-1" onClick={() => setStep("report")}>
                  Skip
                </Button>
                <Button
                  className="flex-1"
                  disabled={submitting || rating === 0}
                  onClick={handleSubmitRating}
                >
                  {submitting && <Loader2 className="size-4 animate-spin mr-2" />}
                  Submit Rating
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* ── STEP 2: Report ── */}
        {step === "report" && (
          <Card>
            <CardHeader className="text-center pb-2">
              <CardTitle className="flex items-center justify-center gap-2">
                <AlertTriangle className="size-5 text-amber-500" />
                Any issues to report?
              </CardTitle>
              <CardDescription>Help us improve the platform. This is optional.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Textarea
                placeholder="Describe any technical issues, inappropriate behaviour, or other concerns…"
                value={reportText}
                onChange={e => { setReportText(e.target.value); setSkipReport(false) }}
                rows={4}
                className="resize-none"
              />
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => { setSkipReport(true); handleSubmitReport() }}
                >
                  No issues
                </Button>
                <Button className="flex-1" onClick={handleSubmitReport}>
                  Submit Report
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* ── STEP 3: Done ── */}
        {step === "done" && (
          <Card>
            <CardContent className="pt-10 pb-10 flex flex-col items-center gap-4 text-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-green-100 dark:bg-green-950/30">
                <CheckCircle2 className="size-9 text-green-600" />
              </div>
              <h2 className="text-xl font-bold">Thank you!</h2>
              <p className="text-muted-foreground text-sm max-w-xs">
                Your feedback helps improve the quality of teaching on EthioTutor.
              </p>
              <Button className="w-full mt-2" onClick={() => router.push("/dashboard")}>
                Back to Dashboard
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
