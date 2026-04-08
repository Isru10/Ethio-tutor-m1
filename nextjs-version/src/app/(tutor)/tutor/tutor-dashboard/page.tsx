"use client"

import { useEffect, useState } from "react"
import { useAuthStore } from "@/lib/store/useAuthStore"
import { API_BASE } from "@/lib/api"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import {
  BookOpen, Users, Wallet, Star, Clock,
  TrendingUp, CalendarDays, CheckCircle2,
} from "lucide-react"

interface DashboardStats {
  totalSlots: number
  totalBookings: number
  confirmedBookings: number
  completedSessions: number
  totalStudents: number
  totalEarnings: number
  pendingEarnings: number
  averageRating: number
  recentBookings: Array<{
    booking_id: number
    status: string
    student: { user: { name: string } }
    slot: { start_time: string; subject: { name: string } }
  }>
  slotPerformance: Array<{
    slot_id: number
    start_time: string
    end_time: string
    subject: { name: string }
    bookings: Array<{ status: string }>
    max_students: number
  }>
}

function authHeaders() {
  const token = useAuthStore.getState().accessToken
  return { Authorization: `Bearer ${token}` }
}

async function fetchTutorDashboard(): Promise<DashboardStats> {
  const safeJson = async (res: Response) => {
    const text = await res.text()
    try { return JSON.parse(text) } catch { return {} }
  }

  const [bookingsRes, slotsRes, txRes] = await Promise.all([
    fetch(`${API_BASE}/bookings/tutor`, { headers: authHeaders() }).then(safeJson),
    fetch(`${API_BASE}/slots/my`, { headers: authHeaders() }).then(safeJson),
    fetch(`${API_BASE}/transactions/my`, { headers: authHeaders() }).then(safeJson),
  ])

  const bookings: any[] = bookingsRes.data ?? []
  const slots: any[] = slotsRes.data ?? []
  const transactions: any[] = txRes.data ?? []

  const uniqueStudents = new Set(bookings.map((b: any) => b.student?.user?.name)).size
  const paidTxns = transactions.filter((t: any) => t.payment_status === "paid")
  const pendingPayoutTxns = transactions.filter(
    (t: any) => t.payment_status === "paid" && t.payout_status !== "paid_out"
  )

  return {
    totalSlots:        slots.length,
    totalBookings:     bookings.length,
    confirmedBookings: bookings.filter((b: any) => b.status === "confirmed").length,
    completedSessions: bookings.filter((b: any) => b.status === "completed").length,
    totalStudents:     uniqueStudents,
    totalEarnings:     paidTxns.reduce((s: number, t: any) => s + Number(t.teacher_earnings ?? 0), 0),
    pendingEarnings:   pendingPayoutTxns.reduce((s: number, t: any) => s + Number(t.teacher_earnings ?? 0), 0),
    averageRating:     0,
    recentBookings:    bookings.slice(0, 5),
    slotPerformance:   slots.slice(0, 6),
  }
}

const STATUS_COLORS: Record<string, string> = {
  pending:   "bg-amber-100 text-amber-700 dark:bg-amber-950/30 dark:text-amber-400",
  confirmed: "bg-blue-100 text-blue-700 dark:bg-blue-950/30 dark:text-blue-400",
  completed: "bg-green-100 text-green-700 dark:bg-green-950/30 dark:text-green-400",
  cancelled: "bg-red-100 text-red-700 dark:bg-red-950/30 dark:text-red-400",
}

export default function TutorDashboardPage() {
  const { user } = useAuthStore()
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user) return
    fetchTutorDashboard()
      .then(setStats)
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [user])

  if (loading) {
    return (
      <div className="px-4 lg:px-6 space-y-6">
        <Skeleton className="h-8 w-64" />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {Array.from({ length: 8 }).map((_, i) => (
            <Skeleton key={i} className="h-24 rounded-xl" />
          ))}
        </div>
      </div>
    )
  }

  if (!stats) {
    return (
      <div className="px-4 lg:px-6 py-20 text-center">
        <p className="text-muted-foreground text-sm">Could not load dashboard. Make sure the backend is running.</p>
      </div>
    )
  }

  const s = stats

  return (
    <>
      <div className="px-4 lg:px-6">
        <h1 className="text-2xl font-bold tracking-tight">
          Welcome back, {user?.name?.split(" ")[0]}
        </h1>
        <p className="text-muted-foreground text-sm">Here&apos;s how your teaching is going.</p>
      </div>

      {/* Stats grid */}
      <div className="px-4 lg:px-6 grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: "Total Slots",        value: s.totalSlots,                                    icon: CalendarDays, color: "text-foreground"    },
          { label: "Total Bookings",     value: s.totalBookings,                                 icon: BookOpen,     color: "text-blue-500"      },
          { label: "Unique Students",    value: s.totalStudents,                                 icon: Users,        color: "text-violet-500"    },
          { label: "Sessions Done",      value: s.completedSessions,                             icon: CheckCircle2, color: "text-green-500"     },
          { label: "Total Earned (ETB)", value: s.totalEarnings.toFixed(0),                      icon: Wallet,       color: "text-emerald-500"   },
          { label: "Pending Payout",     value: s.pendingEarnings.toFixed(0),                    icon: Clock,        color: "text-amber-500"     },
          { label: "Confirmed",          value: s.confirmedBookings,                             icon: TrendingUp,   color: "text-sky-500"       },
          { label: "Avg Rating",         value: s.averageRating > 0 ? s.averageRating.toFixed(1) : "—", icon: Star, color: "text-amber-400"     },
        ].map(({ label, value, icon: Icon, color }) => (
          <Card key={label}>
            <CardContent className="pt-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-muted-foreground text-xs font-medium">{label}</p>
                  <p className="text-2xl font-bold mt-1">{value}</p>
                </div>
                <div className="bg-secondary rounded-lg p-2.5">
                  <Icon className={`size-5 ${color}`} />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="px-4 lg:px-6 grid gap-4 lg:grid-cols-2">
        {/* Recent bookings */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Recent Bookings</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {s.recentBookings.length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-6">No bookings yet</p>
            )}
            {s.recentBookings.map(b => (
              <div key={b.booking_id} className="flex items-center justify-between rounded-lg border px-3 py-2.5 text-sm">
                <div>
                  <p className="font-medium">{b.student?.user?.name ?? "Student"}</p>
                  <p className="text-xs text-muted-foreground">
                    {b.slot?.subject?.name} · {b.slot?.start_time}
                  </p>
                </div>
                <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full capitalize ${STATUS_COLORS[b.status] ?? ""}`}>
                  {b.status}
                </span>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Slot performance */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Slot Performance</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {s.slotPerformance.length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-6">No slots created yet</p>
            )}
            {s.slotPerformance.map(slot => {
              const booked = slot.bookings?.filter(
                b => ["confirmed", "completed"].includes(b.status)
              ).length ?? 0
              const fill = slot.max_students > 0
                ? Math.round((booked / slot.max_students) * 100)
                : 0
              return (
                <div key={slot.slot_id} className="space-y-1.5 rounded-lg border px-3 py-2.5">
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-medium">{slot.subject?.name}</span>
                    <span className="text-xs text-muted-foreground">{booked}/{slot.max_students} students</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="flex-1 h-1.5 rounded-full bg-muted overflow-hidden">
                      <div
                        className="h-full rounded-full bg-primary transition-all"
                        style={{ width: `${fill}%` }}
                      />
                    </div>
                    <span className="text-xs text-muted-foreground w-8 text-right">{fill}%</span>
                  </div>
                  <p className="text-xs text-muted-foreground">{slot.start_time} – {slot.end_time}</p>
                </div>
              )
            })}
          </CardContent>
        </Card>
      </div>
    </>
  )
}
