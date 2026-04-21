"use client"

import { useEffect, useState } from "react"
import { useAuthStore } from "@/lib/store/useAuthStore"
import { API_BASE } from "@/lib/api"
import { Skeleton } from "@/components/ui/skeleton"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import {
  BookOpen, Wallet, Star, Clock, CheckCircle2,
  CalendarDays, ArrowRight, Zap, TrendingUp,
} from "lucide-react"
import { KpiCard } from "./components/kpi-cards"
import { ChartAreaInteractive } from "./components/chart-area-interactive"
import { TeacherCardGrid } from "./components/teacher-card-grid"
import Link from "next/link"

function authHeaders() {
  return { Authorization: `Bearer ${useAuthStore.getState().accessToken}` }
}

interface DashboardData {
  totalBookings: number
  completedSessions: number
  upcomingBookings: number
  totalSpent: number
  pendingPayments: number
  recentBookings: any[]
  allBookings: any[]
  allTransactions: any[]
}

async function fetchStudentDashboard(): Promise<DashboardData> {
  const safeJson = async (res: Response) => {
    const t = await res.text(); try { return JSON.parse(t) } catch { return {} }
  }
  const [bookingsRes, txRes] = await Promise.all([
    fetch(`${API_BASE}/bookings`,          { headers: authHeaders() }).then(safeJson),
    fetch(`${API_BASE}/transactions/my`,   { headers: authHeaders() }).then(safeJson),
  ])
  const bookings: any[] = bookingsRes.data ?? []
  const txns:     any[] = txRes.data       ?? []
  const paidTxns = txns.filter((t: any) => t.payment_status === "paid")

  return {
    totalBookings:     bookings.length,
    completedSessions: bookings.filter((b: any) => b.status === "completed").length,
    upcomingBookings:  bookings.filter((b: any) => b.status === "confirmed").length,
    totalSpent:        paidTxns.reduce((s: number, t: any) => s + Number(t.total_amount ?? 0), 0),
    pendingPayments:   txns.filter((t: any) => t.payment_status === "pending").length,
    recentBookings:    bookings.slice(0, 5),
    allBookings:       bookings,
    allTransactions:   txns,
  }
}

const STATUS_STYLES: Record<string, string> = {
  confirmed: "bg-blue-100 text-blue-700 dark:bg-blue-950/30 dark:text-blue-400",
  pending:   "bg-amber-100 text-amber-700 dark:bg-amber-950/30 dark:text-amber-400",
  completed: "bg-green-100 text-green-700 dark:bg-green-950/30 dark:text-green-400",
  cancelled: "bg-rose-100 text-rose-700 dark:bg-rose-950/30 dark:text-rose-400",
}

export default function StudentDashboardPage() {
  const { user } = useAuthStore()
  const [data, setData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user) return
    fetchStudentDashboard().then(setData).catch(console.error).finally(() => setLoading(false))
  }, [user])

  if (loading) return (
    <div className="px-4 lg:px-6 space-y-6">
      <Skeleton className="h-8 w-64" />
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-28 rounded-xl" />)}
      </div>
      <Skeleton className="h-64 rounded-xl" />
    </div>
  )

  if (!data) return (
    <div className="px-4 lg:px-6 py-20 text-center text-muted-foreground text-sm">
      Could not load dashboard. Make sure the backend is running.
    </div>
  )

  return (
    <div className="flex flex-col gap-6 px-4 lg:px-6 pb-8">

      {/* ── Header ── */}
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            Hey, {user?.name?.split(" ")[0]} 👋
          </h1>
          <p className="text-muted-foreground text-sm mt-0.5">
            Ready to learn something new today?
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {data.upcomingBookings > 0 && (
            <Badge className="gap-1.5 text-xs font-semibold bg-blue-600 hover:bg-blue-700">
              <Zap className="size-3" />
              {data.upcomingBookings} upcoming
            </Badge>
          )}
          <Button size="sm" asChild>
            <Link href="/browse">Browse Classes <ArrowRight className="size-3.5 ml-1" /></Link>
          </Button>
        </div>
      </div>

      {/* ── KPI Cards ── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <KpiCard title="Total Bookings"    value={data.totalBookings}     icon={BookOpen}
          trend={data.upcomingBookings > 0 ? { value: `${data.upcomingBookings} upcoming`, isUp: true } : undefined} />
        <KpiCard title="Sessions Done"     value={data.completedSessions} icon={CheckCircle2}
          trend={{ value: "completed", isUp: true, label: "All time" }} />
        <KpiCard title="Total Spent"       value={`${data.totalSpent.toFixed(0)} ETB`} icon={Wallet}
          trend={data.totalSpent > 0 ? { value: "invested in learning", isUp: true } : undefined} />
        <KpiCard title="Pending Payments"  value={data.pendingPayments}   icon={Clock}
          trend={data.pendingPayments > 0 ? { value: "awaiting payment", isUp: false } : undefined} />
      </div>

      {/* ── Learning activity chart ── */}
      <ChartAreaInteractive bookings={data.allBookings} transactions={data.allTransactions} />

      {/* ── Recent bookings + Quick actions ── */}
      <div className="grid gap-4 grid-cols-1 lg:grid-cols-[1fr_280px]">

        {/* Recent bookings */}
        <Card>
          <CardHeader className="pb-3 border-b bg-accent/10">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base font-bold">Recent Bookings</CardTitle>
              <Link href="/bookings" className="text-xs text-primary hover:underline underline-offset-4">
                View all →
              </Link>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            {data.recentBookings.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 gap-3 text-center">
                <CalendarDays className="size-8 text-muted-foreground/30" />
                <p className="text-sm text-muted-foreground">No bookings yet.</p>
                <Button size="sm" asChild variant="outline">
                  <Link href="/browse">Find a tutor</Link>
                </Button>
              </div>
            ) : (
              <div className="divide-y divide-border">
                {data.recentBookings.map((b: any) => (
                  <div key={b.booking_id} className="flex items-center justify-between px-4 py-3 hover:bg-accent/20 transition-colors">
                    <div className="flex items-center gap-3 min-w-0">
                      <Avatar className="h-9 w-9 shrink-0">
                        <AvatarFallback className="bg-primary/10 text-primary text-xs font-bold">
                          {b.slot?.subject?.name?.slice(0, 2).toUpperCase() ?? "??"}
                        </AvatarFallback>
                      </Avatar>
                      <div className="min-w-0">
                        <p className="text-sm font-semibold truncate">{b.slot?.subject?.name ?? "Session"}</p>
                        <p className="text-xs text-muted-foreground truncate">
                          {b.slot?.teacher?.user?.name ?? "Tutor"} · {b.slot?.start_time?.slice(0, 5)}
                        </p>
                      </div>
                    </div>
                    <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full capitalize shrink-0 ml-2 ${STATUS_STYLES[b.status] ?? ""}`}>
                      {b.status}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Quick actions */}
        <div className="flex flex-col gap-3">
          <Card className="bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20">
            <CardContent className="pt-5 pb-5">
              <div className="flex items-center gap-3 mb-3">
                <div className="h-10 w-10 rounded-xl bg-primary/20 flex items-center justify-center">
                  <BookOpen className="size-5 text-primary" />
                </div>
                <div>
                  <p className="font-semibold text-sm">Find a Tutor</p>
                  <p className="text-xs text-muted-foreground">Browse available sessions</p>
                </div>
              </div>
              <Button className="w-full" size="sm" asChild>
                <Link href="/browse">Browse Now</Link>
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-5 pb-5">
              <div className="flex items-center gap-3 mb-3">
                <div className="h-10 w-10 rounded-xl bg-amber-500/10 flex items-center justify-center">
                  <Star className="size-5 text-amber-500" />
                </div>
                <div>
                  <p className="font-semibold text-sm">My Sessions</p>
                  <p className="text-xs text-muted-foreground">View upcoming & past</p>
                </div>
              </div>
              <Button className="w-full" size="sm" variant="outline" asChild>
                <Link href="/bookings">View Bookings</Link>
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-5 pb-5">
              <div className="flex items-center gap-3 mb-3">
                <div className="h-10 w-10 rounded-xl bg-green-500/10 flex items-center justify-center">
                  <TrendingUp className="size-5 text-green-500" />
                </div>
                <div>
                  <p className="font-semibold text-sm">Payments</p>
                  <p className="text-xs text-muted-foreground">Track your spending</p>
                </div>
              </div>
              <Button className="w-full" size="sm" variant="outline" asChild>
                <Link href="/transactions">View History</Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>

      <Separator />

      {/* ── Available Teachers (at the bottom as requested) ── */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold">Available Teachers</h2>
            <p className="text-sm text-muted-foreground">Book a session with one of our tutors</p>
          </div>
          <Link href="/browse" className="text-sm text-primary hover:underline underline-offset-4 shrink-0">
            Browse all →
          </Link>
        </div>
        <TeacherCardGrid />
      </div>

    </div>
  )
}
