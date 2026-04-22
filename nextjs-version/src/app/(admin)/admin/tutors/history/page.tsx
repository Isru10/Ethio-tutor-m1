"use client"

import { useEffect, useState, useCallback } from "react"
import { useAuthStore } from "@/lib/store/useAuthStore"
import { API_BASE } from "@/lib/api"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Skeleton } from "@/components/ui/skeleton"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { CheckCircle2, XCircle, AlertCircle, Search, BarChart2 } from "lucide-react"

function authHeaders() {
  return { Authorization: `Bearer ${useAuthStore.getState().accessToken}` }
}

interface ReviewedTutor {
  teacher_profile_id: number
  verification_status: string
  verification_note: string | null
  reviewed_at: string | null
  user: { name: string; email: string }
  teacherSubjects: { subject: { name: string } }[]
}

const STATUS_STYLES: Record<string, string> = {
  approved:     "bg-green-100 text-green-700 dark:bg-green-950/30 dark:text-green-400",
  rejected:     "bg-red-100 text-red-700 dark:bg-red-950/30 dark:text-red-400",
  pending_info: "bg-blue-100 text-blue-700 dark:bg-blue-950/30 dark:text-blue-400",
}

const STATUS_ICONS: Record<string, React.ElementType> = {
  approved:     CheckCircle2,
  rejected:     XCircle,
  pending_info: AlertCircle,
}

export default function ReviewerHistoryPage() {
  const { user }          = useAuthStore()
  const [tutors, setTutors]   = useState<ReviewedTutor[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch]   = useState("")
  const [filter, setFilter]   = useState("all")

  const load = useCallback(async () => {
    // Fetch all tutors and filter to ones reviewed by this user
    const res  = await fetch(`${API_BASE}/tutors/pending`, { headers: authHeaders() })
    // Also fetch all tutors (approved/rejected) — we need a dedicated endpoint
    // For now use the admin/all approach via users endpoint
    const allRes = await fetch(`${API_BASE}/tutors?includeAll=true`, { headers: authHeaders() })
    const data   = await allRes.json()
    // Filter to ones this reviewer handled
    const reviewed = (data.data ?? []).filter(
      (t: any) => t.reviewed_by === user?.user_id && t.reviewed_at
    )
    setTutors(reviewed)
    setLoading(false)
  }, [user])

  useEffect(() => { if (user) load() }, [user, load])

  const filtered = tutors.filter(t => {
    const matchSearch = t.user.name.toLowerCase().includes(search.toLowerCase()) ||
                        t.user.email.toLowerCase().includes(search.toLowerCase())
    const matchFilter = filter === "all" || t.verification_status === filter
    return matchSearch && matchFilter
  })

  const stats = {
    total:    tutors.length,
    approved: tutors.filter(t => t.verification_status === "approved").length,
    rejected: tutors.filter(t => t.verification_status === "rejected").length,
    info:     tutors.filter(t => t.verification_status === "pending_info").length,
  }

  return (
    <>
      <div className="px-4 lg:px-6">
        <h1 className="text-2xl font-bold tracking-tight">My Review History</h1>
        <p className="text-muted-foreground text-sm">All tutor profiles you have reviewed.</p>
      </div>

      {/* Stats */}
      <div className="px-4 lg:px-6 grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: "Total Reviewed", value: stats.total,    color: "text-foreground",  icon: BarChart2     },
          { label: "Approved",       value: stats.approved, color: "text-green-500",   icon: CheckCircle2  },
          { label: "Rejected",       value: stats.rejected, color: "text-red-500",     icon: XCircle       },
          { label: "Requested Info", value: stats.info,     color: "text-blue-500",    icon: AlertCircle   },
        ].map(s => (
          <Card key={s.label}>
            <CardContent className="pt-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground font-medium">{s.label}</p>
                  <p className="text-2xl font-bold mt-1">{loading ? "–" : s.value}</p>
                </div>
                <div className="bg-secondary rounded-lg p-2.5">
                  <s.icon className={`size-5 ${s.color}`} />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Filters */}
      <div className="px-4 lg:px-6 flex gap-3 flex-wrap">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <Input placeholder="Search by name or email…" value={search}
            onChange={e => setSearch(e.target.value)} className="pl-9" />
        </div>
        <Select value={filter} onValueChange={setFilter}>
          <SelectTrigger className="w-40 h-9">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Decisions</SelectItem>
            <SelectItem value="approved">Approved</SelectItem>
            <SelectItem value="rejected">Rejected</SelectItem>
            <SelectItem value="pending_info">Requested Info</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* List */}
      <div className="px-4 lg:px-6">
        {loading ? (
          <div className="space-y-3">
            {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-20 rounded-xl" />)}
          </div>
        ) : filtered.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-16 gap-3">
              <BarChart2 className="size-10 text-muted-foreground/30" />
              <p className="text-muted-foreground text-sm">
                {tutors.length === 0 ? "You haven't reviewed any tutors yet." : "No results match your filter."}
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {filtered.map(t => {
              const StatusIcon = STATUS_ICONS[t.verification_status] ?? CheckCircle2
              const subjects   = t.teacherSubjects.map(ts => ts.subject.name)
              return (
                <Card key={t.teacher_profile_id}>
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
                            <Badge variant="secondary" className={`text-[10px] gap-1 ${STATUS_STYLES[t.verification_status] ?? ""}`}>
                              <StatusIcon className="size-2.5" />
                              {t.verification_status.replace("_", " ")}
                            </Badge>
                          </div>
                          <p className="text-xs text-muted-foreground">{t.user.email}</p>
                          {t.verification_note && (
                            <p className="text-xs text-muted-foreground mt-0.5 italic line-clamp-1">
                              Note: {t.verification_note}
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="text-xs text-muted-foreground">
                          {t.reviewed_at ? new Date(t.reviewed_at).toLocaleDateString("en-ET", { day: "numeric", month: "short", year: "numeric" }) : "—"}
                        </p>
                        <div className="flex flex-wrap gap-1 mt-1 justify-end">
                          {subjects.slice(0, 3).map(s => (
                            <span key={s} className="text-[10px] bg-muted px-1.5 py-0.5 rounded">{s}</span>
                          ))}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        )}
      </div>
    </>
  )
}
