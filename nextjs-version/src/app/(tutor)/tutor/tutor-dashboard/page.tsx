"use client"

import { useEffect, useState } from "react"
import { useAuthStore } from "@/lib/store/useAuthStore"
import { API_BASE } from "@/lib/api"
import { Skeleton } from "@/components/ui/skeleton"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import {
  BookOpen, Users, Wallet, Star, Clock,
  TrendingUp, CalendarDays, CheckCircle2, Zap,
} from "lucide-react"
import { KpiCard, TimeSpentCard } from "./components/kpi-cards"
import { StreakCard } from "./components/streak-heatmap"
import { AnalyticsCharts } from "./components/analytics-charts"
import { RecentSessionsList } from "./components/session-sections"
import { ChartAreaInteractive } from "./components/chart-area-interactive"

// ─── Types ────────────────────────────────────────────────────
interface DashboardData {
  totalSlots: number
  totalBookings: number
  confirmedBookings: number
  completedSessions: number
  totalStudents: number
  totalEarnings: number
  pendingEarnings: number
  averageRating: number
  recentBookings: any[]
  slotPerformance: any[]
  allBookings: any[]
  allTransactions: any[]
}

function authHeaders() {
  return { Authorization: `Bearer ${useAuthStore.getState().accessToken}` }
}

async function fetchDashboard(): Promise<DashboardData> {
  const safeJson = async (res: Response) => {
    const t = await res.text()
    try { return JSON.parse(t) } catch { return {} }
  }
  const [bookingsRes, slotsRes, txRes] = await Promise.all([
    fetch(`${API_BASE}/bookings/tutor`, { headers: authHeaders() }).then(safeJson),
    fetch(`${API_BASE}/slots/my`,       { headers: authHeaders() }).then(safeJson),
    fetch(`${API_BASE}/transactions/my`,{ headers: authHeaders() }).then(safeJson),
  ])
  const bookings: any[] = bookingsRes.data ?? []
  const slots:    any[] = slotsRes.data    ?? []
  const txns:     any[] = txRes.data       ?? []

  const uniqueStudents = new Set(bookings.map((b: any) => b.student?.user?.name)).size
  const paidTxns       = txns.filter((t: any) => t.payment_status === "paid")
  const pendingTxns    = txns.filter((t: any) => t.payment_status === "paid" && t.payout_status !== "paid_out")

  return {
    totalSlots:        slots.length,
    totalBookings:     bookings.length,
    confirmedBookings: bookings.filter((b: any) => b.status === "confirmed").length,
    completedSessions: bookings.filter((b: any) => b.status === "completed").length,
    totalStudents:     uniqueStudents,
    totalEarnings:     paidTxns.reduce((s: number, t: any) => s + Number(t.teacher_earnings ?? 0), 0),
    pendingEarnings:   pendingTxns.reduce((s: number, t: any) => s + Number(t.teacher_earnings ?? 0), 0),
    averageRating:     0,
    recentBookings:    bookings.slice(0, 5),
    slotPerformance:   slots.slice(0, 6),
    allBookings:       bookings,
    allTransactions:   txns,
  }
}

// Build a 140-day heatmap from completed bookings
function buildHeatmap(bookings: any[]) {
  const map = new Map<string, number>()
  for (const b of bookings) {
    if (b.status !== "completed") continue
    const day = b.created_at?.split("T")[0]
    if (day) map.set(day, (map.get(day) ?? 0) + 1)
  }
  const result = []
  for (let i = 139; i >= 0; i--) {
    const d = new Date(); d.setDate(d.getDate() - i)
    const key = d.toISOString().split("T")[0]
    const count = map.get(key) ?? 0
    result.push({ date: key, intensity: Math.min(count, 4) })
  }
  return result
}

function calcStreak(heatmap: { date: string; intensity: number }[]) {
  let current = 0, longest = 0, running = 0
  for (let i = heatmap.length - 1; i >= 0; i--) {
    if (heatmap[i].intensity > 0) { running++; if (i === heatmap.length - 1 || current === running - 1) current = running }
    else { longest = Math.max(longest, running); running = 0 }
  }
  return { current, longest: Math.max(longest, running) }
}

// Map recent bookings to session list shape
function toSessionList(bookings: any[]) {
  return bookings.map((b: any) => ({
    id:          String(b.booking_id),
    studentName: b.student?.user?.name ?? "Student",
    topic:       b.slot?.subject?.name ?? "Session",
    date:        b.slot?.slot_date?.split("T")[0] ?? "",
    duration:    `${b.slot?.start_time?.slice(0, 5)} – ${b.slot?.end_time?.slice(0, 5)}`,
    status:      b.status === "completed" ? "completed" : "upcoming",
  }))
}

export default function TutorDashboardPage() {
  const { user } = useAuthStore()
  const [data, setData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user) return
    fetchDashboard().then(setData).catch(console.error).finally(() => setLoading(false))
  }, [user])

  if (loading) return (
    <div className="px-4 lg:px-6 space-y-6">
      <Skeleton className="h-8 w-64" />
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {Array.from({ length: 8 }).map((_, i) => <Skeleton key={i} className="h-28 rounded-xl" />)}
      </div>
      <Skeleton className="h-64 rounded-xl" />
    </div>
  )

  if (!data) return (
    <div className="px-4 lg:px-6 py-20 text-center text-muted-foreground text-sm">
      Could not load dashboard. Make sure the backend is running.
    </div>
  )

  const heatmap = buildHeatmap(data.recentBookings)
  const { current: currentStreak, longest: longestStreak } = calcStreak(heatmap)
  const sessions = toSessionList(data.recentBookings)

  return (
    <div className="flex flex-col gap-6 px-4 lg:px-6 pb-8">

      {/* ── Header ── */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            Welcome back, {user?.name?.split(" ")[0]} 👋
          </h1>
          <p className="text-muted-foreground text-sm mt-0.5">
            Here&apos;s how your teaching is performing today.
          </p>
        </div>
        <Badge variant="outline" className="gap-1.5 text-xs font-semibold hidden sm:flex">
          <Zap className="size-3 text-amber-500" />
          {currentStreak > 0 ? `${currentStreak}-day streak` : "Start your streak"}
        </Badge>
      </div>

      {/* ── KPI Cards ── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <KpiCard title="Total Slots"      value={data.totalSlots}        icon={CalendarDays} />
        <KpiCard title="Total Bookings"   value={data.totalBookings}     icon={BookOpen}
          trend={data.confirmedBookings > 0 ? { value: `${data.confirmedBookings} confirmed`, isUp: true } : undefined} />
        <KpiCard title="Unique Students"  value={data.totalStudents}     icon={Users} />
        <KpiCard title="Sessions Done"    value={data.completedSessions} icon={CheckCircle2}
          trend={{ value: "completed", isUp: true, label: "All time" }} />
        <KpiCard title="Total Earned"     value={`${data.totalEarnings.toFixed(0)} ETB`}   icon={Wallet}
          trend={data.totalEarnings > 0 ? { value: "85% net", isUp: true } : undefined} />
        <KpiCard title="Pending Payout"   value={`${data.pendingEarnings.toFixed(0)} ETB`} icon={Clock}
          trend={data.pendingEarnings > 0 ? { value: "awaiting release", isUp: false } : undefined} />
        <KpiCard title="Confirmed"        value={data.confirmedBookings} icon={TrendingUp} />
        <KpiCard title="Avg Rating"       value={data.averageRating > 0 ? data.averageRating.toFixed(1) : "—"} icon={Star}
          trend={data.averageRating > 0 ? { value: `${data.averageRating.toFixed(1)} / 5`, isUp: true } : undefined} />
      </div>

      {/* ── Time spent summary ── */}
      <TimeSpentCard
        today={`${data.completedSessions > 0 ? Math.min(data.completedSessions, 3) : 0}h`}
        week={`${data.completedSessions > 0 ? Math.min(data.completedSessions * 2, 12) : 0}h`}
        month={`${data.completedSessions > 0 ? Math.min(data.completedSessions * 5, 40) : 0}h`}
      />

      {/* ── Interactive area chart ── */}
      <ChartAreaInteractive />
{/* bookings={data.allBookings} transactions={data.allTransactions}  */}
      {/* ── Streak heatmap ── */}
      <StreakCard
        currentStreak={currentStreak}
        longestStreak={longestStreak}
        heatmapData={heatmap}
      />

      <Separator />

      {/* ── Analytics + Recent sessions ── */}
      <div className="grid gap-4 grid-cols-1 lg:grid-cols-[1fr_380px]">
        <AnalyticsCharts />
        <RecentSessionsList sessions={sessions as any} />
      </div>

    </div>
  )
}
