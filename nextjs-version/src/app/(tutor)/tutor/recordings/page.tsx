"use client"

import { useEffect, useState } from "react"
import { Video, Lock, Play, Clock, Calendar, BookOpen, CheckCircle } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { Skeleton } from "@/components/ui/skeleton"
import { useAuthStore } from "@/store/authStore"
import { getStudentRecordings } from "@/lib/services/dashboardService"
import type { SessionRecording } from "@/types/database"

type RecordingRow = SessionRecording & {
  subjectName: string
  teacherName: string
  sessionDate: string
}

// Format seconds → "1h 30m"
function formatDuration(secs: number) {
  const h = Math.floor(secs / 3600)
  const m = Math.floor((secs % 3600) / 60)
  if (h > 0) return `${h}h ${m}m`
  return `${m} min`
}

// ─── Pro upgrade CTA (shown to Basic users) ──────────────────
function ProUpgradeCTA() {
  return (
    <div className="px-4 lg:px-6">
      <Card className="border-2 border-amber-300 dark:border-amber-700 bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-950/30 dark:to-orange-950/20">
        <CardContent className="flex flex-col items-center gap-5 py-14 text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-500 text-white">
            <Lock className="size-7" />
          </div>
          <div>
            <h2 className="text-xl font-bold mb-2">Session Recordings — Pro Feature</h2>
            <p className="text-muted-foreground text-sm max-w-md mx-auto leading-relaxed">
              Upgrade to the <strong>Pro plan</strong> to unlock recordings of all your past sessions.
              Rewatch lessons at your own pace, catch up on anything you missed, and study smarter.
            </p>
          </div>

          {/* Feature list */}
          <div className="flex flex-col gap-2 text-left">
            {[
              "Access recordings of all completed sessions",
              "Watch at 1x, 1.5x, or 2x speed",
              "Unlimited replay, no expiry",
              "Download for offline study",
            ].map((feat) => (
              <div key={feat} className="flex items-center gap-2 text-sm">
                <CheckCircle className="size-4 text-amber-500 shrink-0" />
                <span>{feat}</span>
              </div>
            ))}
          </div>

          <Button size="lg" className="bg-amber-500 hover:bg-amber-600 text-white border-0 gap-2 min-w-40">
            <Video className="size-4" />
            Upgrade to Pro
          </Button>
          <p className="text-xs text-muted-foreground">
            Contact your school admin to upgrade your plan.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}

// ─── Recording card ──────────────────────────────────────────
function RecordingCard({ rec }: { rec: RecordingRow }) {
  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="pt-4 space-y-3">
        {/* Header */}
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-100 dark:bg-blue-950/40 text-blue-600">
            <Video className="size-5" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-sm leading-tight truncate">{rec.subjectName}</p>
            <p className="text-xs text-muted-foreground">{rec.teacherName}</p>
          </div>
        </div>

        <Separator />

        {/* Meta */}
        <div className="space-y-1.5 text-sm text-muted-foreground">
          <div className="flex items-center gap-2">
            <Calendar className="size-3.5" />
            <span>{new Date(rec.sessionDate).toLocaleDateString("en-ET", { weekday: "short", month: "short", day: "numeric", year: "numeric" })}</span>
          </div>
          <div className="flex items-center gap-2">
            <Clock className="size-3.5" />
            <span>{formatDuration(rec.duration_seconds)}</span>
          </div>
        </div>

        {/* Play button */}
        <Button className="w-full gap-2" asChild>
          <a href={rec.storage_url} target="_blank" rel="noopener noreferrer">
            <Play className="size-4" />
            Watch Recording
          </a>
        </Button>
      </CardContent>
    </Card>
  )
}

// ─── Main Page ───────────────────────────────────────────────
export default function RecordingsPage() {
  const { user, isPro } = useAuthStore()
  const [recordings, setRecordings] = useState<RecordingRow[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user || !isPro()) {
      setLoading(false)
      return
    }
    getStudentRecordings(user.user_id, user.tenant_id).then((data) => {
      setRecordings(data)
      setLoading(false)
    })
  }, [user, isPro])

  return (
    <>
      {/* Page heading */}
      <div className="px-4 lg:px-6">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-bold tracking-tight">Recordings</h1>
          {isPro() && (
            <Badge className="bg-amber-500 hover:bg-amber-500 text-white border-0">PRO</Badge>
          )}
        </div>
        <p className="text-muted-foreground text-sm">Rewatch your completed tutoring sessions anytime.</p>
      </div>

      {/* Plan gate */}
      {!isPro() ? (
        <ProUpgradeCTA />
      ) : loading ? (
        <div className="px-4 lg:px-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-52 rounded-xl" />
          ))}
        </div>
      ) : recordings.length === 0 ? (
        <div className="px-4 lg:px-6 flex flex-col items-center justify-center gap-3 py-16 text-center">
          <BookOpen className="size-10 text-muted-foreground/40" />
          <p className="text-muted-foreground text-sm">No recordings available yet.</p>
          <p className="text-xs text-muted-foreground">Complete sessions to see recordings here.</p>
        </div>
      ) : (
        <div className="px-4 lg:px-6 space-y-4">
          <p className="text-sm text-muted-foreground">
            <span className="font-semibold text-foreground">{recordings.length}</span> recording{recordings.length !== 1 ? "s" : ""} available
          </p>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {recordings.map((rec) => (
              <RecordingCard key={rec.recording_id} rec={rec} />
            ))}
          </div>
        </div>
      )}
    </>
  )
}
