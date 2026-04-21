"use client"

import { useEffect, useState, useCallback, useRef } from "react"
import { useAuthStore } from "@/lib/store/useAuthStore"
import { API_BASE } from "@/lib/api"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { Textarea } from "@/components/ui/textarea"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription,
} from "@/components/ui/dialog"
import {
  CheckCircle2, XCircle, AlertCircle, Lock, RefreshCw,
  User, BookOpen, Star, Clock, Loader2,
} from "lucide-react"
import { toast } from "sonner"

function authHeaders() {
  return { Authorization: `Bearer ${useAuthStore.getState().accessToken}`, "Content-Type": "application/json" }
}

interface PendingTutor {
  teacher_profile_id: number
  bio: string | null
  qualifications: string | null
  experience_years: number
  hourly_rate: string
  languages: string
  verification_status: string
  verification_note: string | null
  locked_by: number | null
  locked_at: string | null
  user: { user_id: number; name: string; email: string; phone: string | null; created_at: string }
  teacherSubjects: { subject: { name: string } }[]
}

const STATUS_STYLES: Record<string, string> = {
  pending:      "bg-amber-100 text-amber-700 dark:bg-amber-950/30 dark:text-amber-400",
  pending_info: "bg-blue-100 text-blue-700 dark:bg-blue-950/30 dark:text-blue-400",
  approved:     "bg-green-100 text-green-700 dark:bg-green-950/30 dark:text-green-400",
  rejected:     "bg-red-100 text-red-700 dark:bg-red-950/30 dark:text-red-400",
}

export default function AdminTutorsPage() {
  const { user } = useAuthStore()
  const [tutors, setTutors]         = useState<PendingTutor[]>([])
  const [loading, setLoading]       = useState(true)
  const [selected, setSelected]     = useState<PendingTutor | null>(null)
  const [claiming, setClaiming]     = useState(false)
  const [deciding, setDeciding]     = useState(false)
  const [note, setNote]             = useState("")
  const pollRef                     = useRef<ReturnType<typeof setInterval> | null>(null)

  const load = useCallback(async () => {
    const res  = await fetch(`${API_BASE}/tutors/pending`, { headers: authHeaders() })
    const data = await res.json()
    setTutors(data.data ?? [])
    setLoading(false)
  }, [])

  // Poll every 15 seconds for real-time queue updates
  useEffect(() => {
    if (!user) return
    load()
    pollRef.current = setInterval(load, 15000)
    return () => { if (pollRef.current) clearInterval(pollRef.current) }
  }, [user, load])

  const handleClaim = async (tutor: PendingTutor) => {
    setClaiming(true)
    try {
      const res  = await fetch(`${API_BASE}/tutors/${tutor.teacher_profile_id}/claim`, {
        method: "POST", headers: authHeaders(),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.message)
      setSelected(data.data)
      setNote("")
      load()
    } catch (err: any) {
      toast.error(err.message)
    } finally {
      setClaiming(false)
    }
  }

  const handleRelease = async () => {
    if (!selected) return
    await fetch(`${API_BASE}/tutors/${selected.teacher_profile_id}/release`, {
      method: "POST", headers: authHeaders(),
    })
    setSelected(null)
    load()
  }

  const handleDecide = async (decision: "approved" | "rejected" | "pending_info") => {
    if (!selected) return
    if (decision !== "approved" && !note.trim()) {
      toast.error("Please provide a note explaining your decision.")
      return
    }
    setDeciding(true)
    try {
      const res  = await fetch(`${API_BASE}/tutors/${selected.teacher_profile_id}/decide`, {
        method: "POST",
        headers: authHeaders(),
        body: JSON.stringify({ decision, note: note.trim() || undefined }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.message)
      toast.success(
        decision === "approved" ? "Tutor approved — they can now teach!" :
        decision === "rejected" ? "Tutor rejected — they have been notified." :
        "More info requested — tutor has been notified."
      )
      setSelected(null)
      setNote("")
      load()
    } catch (err: any) {
      toast.error(err.message)
    } finally {
      setDeciding(false)
    }
  }

  const isLockedByOther = (t: PendingTutor) => {
    if (!t.locked_by || !t.locked_at) return false
    if (t.locked_by === user?.user_id) return false
    return Date.now() - new Date(t.locked_at).getTime() < 10 * 60 * 1000
  }

  const isLockedByMe = (t: PendingTutor) =>
    t.locked_by === user?.user_id &&
    t.locked_at != null &&
    Date.now() - new Date(t.locked_at).getTime() < 10 * 60 * 1000

  return (
    <>
      <div className="px-4 lg:px-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Tutor Verification Queue</h1>
          <p className="text-muted-foreground text-sm">
            Review pending tutor applications. Queue refreshes every 15 seconds.
          </p>
        </div>
        <Button variant="outline" size="sm" className="gap-2" onClick={load}>
          <RefreshCw className="size-3.5" /> Refresh
        </Button>
      </div>

      <div className="px-4 lg:px-6">
        {loading ? (
          <div className="space-y-3">
            {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-20 rounded-xl" />)}
          </div>
        ) : tutors.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-16 gap-3">
              <CheckCircle2 className="size-10 text-green-500/40" />
              <p className="text-muted-foreground text-sm">No pending applications. All caught up!</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {tutors.map(t => {
              const lockedOther = isLockedByOther(t)
              const lockedMe    = isLockedByMe(t)
              const subjects    = t.teacherSubjects.map(ts => ts.subject.name)

              return (
                <Card key={t.teacher_profile_id} className={lockedOther ? "opacity-60" : ""}>
                  <CardContent className="pt-4 pb-4">
                    <div className="flex items-center justify-between gap-4 flex-wrap">
                      <div className="flex items-center gap-3 min-w-0">
                        <Avatar className="h-10 w-10 shrink-0">
                          <AvatarFallback className="bg-primary/10 text-primary text-sm font-bold">
                            {t.user.name.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div className="min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <p className="font-semibold text-sm">{t.user.name}</p>
                            <Badge variant="secondary" className={`text-[10px] ${STATUS_STYLES[t.verification_status] ?? ""}`}>
                              {t.verification_status.replace("_", " ")}
                            </Badge>
                            {lockedOther && (
                              <Badge variant="outline" className="text-[10px] gap-1">
                                <Lock className="size-2.5" /> In review
                              </Badge>
                            )}
                            {lockedMe && (
                              <Badge variant="outline" className="text-[10px] gap-1 border-primary text-primary">
                                <Lock className="size-2.5" /> You&apos;re reviewing
                              </Badge>
                            )}
                          </div>
                          <p className="text-xs text-muted-foreground">{t.user.email}</p>
                          <div className="flex flex-wrap gap-1 mt-1">
                            {subjects.slice(0, 4).map(s => (
                              <span key={s} className="text-[10px] bg-muted px-1.5 py-0.5 rounded">{s}</span>
                            ))}
                            {subjects.length > 4 && (
                              <span className="text-[10px] bg-muted px-1.5 py-0.5 rounded">+{subjects.length - 4}</span>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground shrink-0">
                        <Clock className="size-3.5" />
                        <span>Applied {new Date(t.user.created_at).toLocaleDateString("en-ET", { day: "numeric", month: "short" })}</span>
                        <Button
                          size="sm"
                          disabled={lockedOther || claiming}
                          onClick={() => handleClaim(t)}
                          className="ml-2"
                        >
                          {claiming ? <Loader2 className="size-3.5 animate-spin" /> : null}
                          {lockedMe ? "Continue Review" : "Review"}
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        )}
      </div>

      {/* Review Panel Dialog */}
      <Dialog open={!!selected} onOpenChange={v => { if (!v) handleRelease() }}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          {selected && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <User className="size-5" /> {selected.user.name}
                </DialogTitle>
                <DialogDescription>{selected.user.email} · {selected.user.phone ?? "No phone"}</DialogDescription>
              </DialogHeader>

              <div className="space-y-4 py-2">
                {/* Profile details */}
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div className="rounded-lg border p-3 space-y-1">
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Experience</p>
                    <p className="font-medium">{selected.experience_years} years</p>
                  </div>
                  <div className="rounded-lg border p-3 space-y-1">
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Hourly Rate</p>
                    <p className="font-medium">{Number(selected.hourly_rate).toLocaleString()} ETB</p>
                  </div>
                  <div className="rounded-lg border p-3 space-y-1">
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Languages</p>
                    <p className="font-medium">{selected.languages}</p>
                  </div>
                  <div className="rounded-lg border p-3 space-y-1">
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Subjects</p>
                    <p className="font-medium">{selected.teacherSubjects.map(ts => ts.subject.name).join(", ") || "—"}</p>
                  </div>
                </div>

                <div className="rounded-lg border p-3 space-y-1">
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Qualifications</p>
                  <p className="text-sm">{selected.qualifications || "Not provided"}</p>
                </div>

                <div className="rounded-lg border p-3 space-y-1">
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Bio</p>
                  <p className="text-sm leading-relaxed">{selected.bio || "Not provided"}</p>
                </div>

                {/* Note field */}
                <div className="space-y-1.5">
                  <label className="text-sm font-medium">
                    Reviewer Note <span className="text-muted-foreground font-normal">(required for Reject / Request Info)</span>
                  </label>
                  <Textarea
                    placeholder="Explain your decision or what information is missing…"
                    value={note}
                    onChange={e => setNote(e.target.value)}
                    rows={3}
                    className="resize-none"
                  />
                </div>
              </div>

              <DialogFooter className="flex-col sm:flex-row gap-2">
                <Button variant="outline" onClick={handleRelease} className="sm:mr-auto">
                  Cancel
                </Button>
                <Button
                  variant="outline"
                  className="gap-2 border-blue-300 text-blue-700 hover:bg-blue-50"
                  disabled={deciding}
                  onClick={() => handleDecide("pending_info")}
                >
                  <AlertCircle className="size-4" /> Request Info
                </Button>
                <Button
                  variant="outline"
                  className="gap-2 border-red-300 text-red-700 hover:bg-red-50"
                  disabled={deciding}
                  onClick={() => handleDecide("rejected")}
                >
                  <XCircle className="size-4" /> Reject
                </Button>
                <Button
                  className="gap-2 bg-green-600 hover:bg-green-700 text-white"
                  disabled={deciding}
                  onClick={() => handleDecide("approved")}
                >
                  {deciding ? <Loader2 className="size-4 animate-spin" /> : <CheckCircle2 className="size-4" />}
                  Approve
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </>
  )
}
