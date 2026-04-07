"use client"

import { useEffect, useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { BookOpen, Calendar, Wallet, Bell } from "lucide-react"
import { useAuthStore } from "@/store/authStore"
import { getStudentDashboardStats } from "@/lib/services/dashboardService"
import type { StudentDashboardStats } from "@/types/database"

const STAT_CONFIG = [
  { key: "totalBookings"       , label: "Total Bookings",      icon: BookOpen, color: "text-blue-500"   },
  { key: "upcomingSessions"    , label: "Upcoming Sessions",   icon: Calendar, color: "text-green-500"  },
  { key: "totalSpent"          , label: "Total Spent (ETB)",   icon: Wallet,   color: "text-amber-500"  },
  { key: "unreadNotifications" , label: "Notifications",       icon: Bell,     color: "text-rose-500"   },
] as const

export function StudentStatCards() {
  const { user } = useAuthStore()
  const [stats, setStats] = useState<StudentDashboardStats | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user) return
    getStudentDashboardStats(user.user_id, user.tenant_id).then((data) => {
      setStats(data)
      setLoading(false)
    })
  }, [user])

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {STAT_CONFIG.map(({ key, label, icon: Icon, color }) => (
        <Card key={key} className="border">
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between">
              <Icon className={`size-5 ${color}`} />
              <span className="text-xs text-muted-foreground font-medium">{label}</span>
            </div>
            <div className="text-3xl font-bold tabular-nums">
              {loading ? (
                <span className="text-muted-foreground text-lg animate-pulse">—</span>
              ) : (
                key === "totalSpent"
                  ? `${stats?.[key]?.toLocaleString() ?? 0} ETB`
                  : stats?.[key] ?? 0
              )}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
