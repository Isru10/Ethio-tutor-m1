"use client"

import { Card, CardContent } from "@/components/ui/card"
import { BookOpen, Users, Flame, CalendarDays, TrendingUp } from "lucide-react"
import { STUDENT_STATS } from "@/lib/mock-data"

const STAT_CONFIG = [
  { label: "Total Sessions", value: STUDENT_STATS.totalSessions, icon: BookOpen, color: "text-blue-500", bg: "bg-blue-100/50", suffix: "" },
  { label: "Unique Teachers", value: STUDENT_STATS.uniqueTeachers, icon: Users, color: "text-purple-500", bg: "bg-purple-100/50", suffix: "" },
  { label: "Daily Streak", value: STUDENT_STATS.streakDaily, icon: Flame, color: "text-orange-500", bg: "bg-orange-100/50", suffix: " days" },
  { label: "Monthly Streak", value: STUDENT_STATS.streakMonthly, icon: CalendarDays, color: "text-green-500", bg: "bg-green-100/50", suffix: " days" },
  { label: "Yearly Streak", value: STUDENT_STATS.streakYearly, icon: TrendingUp, color: "text-rose-500", bg: "bg-rose-100/50", suffix: " days" },
] as const

export function StatsCards() {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
      {STAT_CONFIG.map(({ label, value, icon: Icon, color, bg, suffix }) => (
        <Card key={label} className="border-none shadow-sm hover:shadow-md transition-shadow duration-200 bg-card">
          <CardContent className="p-5 flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <div className={`p-2 rounded-xl ${bg}`}>
                <Icon className={`size-5 ${color}`} />
              </div>
              <span className="text-[10px] uppercase tracking-wider font-bold text-muted-foreground">{label}</span>
            </div>
            <div className="flex items-baseline gap-1">
              <span className="text-2xl font-bold tabular-nums">{value}</span>
              {suffix && <span className="text-xs text-muted-foreground">{suffix}</span>}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
