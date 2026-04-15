"use client"

import * as React from "react"
import { 
  Users, 
  BookOpen, 
  Star, 
  Wallet, 
  Calendar,
  Clock,
  TrendingUp,
  Award
} from "lucide-react"
import { useAuthStore } from "@/lib/store/useAuthStore"
import { KpiCard, TimeSpentCard } from "./components/kpi-cards"
import { StreakCard } from "./components/streak-heatmap"
import { RecentSessionsList, TrendingSessions } from "./components/session-sections"
import { AnalyticsCharts } from "./components/analytics-charts"

// Mock Data Generation for Heatmap (140 days)
const generateHeatmapData = () => {
  const data = []
  const today = new Date()
  for (let i = 139; i >= 0; i--) {
    const date = new Date(today)
    date.setDate(today.getDate() - i)
    data.push({
      date: date.toISOString().split("T")[0],
      intensity: Math.floor(Math.random() * 5), // 0 to 4
    })
  }
  return data
}

const recentSessions = [
  { id: "s1", studentName: "Abebe Bekele", topic: "Advanced Calculus", date: "Today, 2:00 PM", duration: "1h 30m", status: "upcoming" as const },
  { id: "s2", studentName: "Sara Johnson", topic: "Physics: Newtons Laws", date: "Yesterday", duration: "1h 00m", status: "completed" as const },
  { id: "s3", studentName: "Michael Chen", topic: "Intro to Python", date: "2 days ago", duration: "2h 00m", status: "completed" as const },
  { id: "s4", studentName: "Hanna Tesfaye", topic: "English: Academic Writing", date: "3 days ago", duration: "1h 15m", status: "completed" as const },
  { id: "s5", studentName: "David Miller", topic: "Chemistry: Thermodynamics", date: "4 days ago", duration: "1h 30m", status: "completed" as const },
]

const trendingSessions = [
  { id: "t1", title: "Machine Learning Basics", category: "Computer Science", bookings: 124, rating: 4.9, isHot: true },
  { id: "t2", title: "SAT Math Prep", category: "Mathematics", bookings: 89, rating: 4.8, isHot: true },
  { id: "t3", title: "Amharic for Beginners", category: "Languages", bookings: 56, rating: 5.0, isHot: false },
  { id: "t4", title: "Quantum Mechanics", category: "Physics", bookings: 42, rating: 4.7, isHot: false },
]

export default function TutorDashboard2Page() {
  const { user } = useAuthStore()
  const [mounted, setMounted] = React.useState(false)
  const heatmapData = React.useMemo(() => generateHeatmapData(), [])

  React.useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return <div className="px-4 lg:px-6 py-20 text-center">Loading insights...</div>
  }

  return (
    <div className="px-4 lg:px-6 space-y-8 pb-12">
      {/* Welcome Header */}
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-3xl font-bold tracking-tight">
            Tutor Insight Hub
          </h1>
          <p className="text-muted-foreground font-medium">
            Welcome back, <span className="text-foreground">{user?.name}</span>. Your teaching impact is growing.
          </p>
        </div>
        <div className="flex items-center gap-3">
           <div className="flex flex-col items-end px-4 border-r">
              <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Global Rank</span>
              <span className="text-lg font-black text-primary">#12 / 450</span>
           </div>
           <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary border border-primary/20">
              <Award className="h-6 w-6" />
           </div>
        </div>
      </header>

      {/* KPI Grid */}
      <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard 
          title="Active Students" 
          value="42" 
          icon={Users} 
          trend={{ value: "12%", isUp: true, label: "from last month" }}
        />
        <KpiCard 
          title="Avg. Rating" 
          value="4.92" 
          icon={Star} 
          trend={{ value: "0.2", isUp: true, label: "personal best" }}
        />
        <KpiCard 
          title="Total Earnings" 
          value="ETB 14,250" 
          icon={Wallet} 
          trend={{ value: "18%", isUp: true, label: "vs target" }}
        />
        <KpiCard 
          title="Pending Bookings" 
          value="7" 
          icon={Calendar} 
          trend={{ value: "3", isUp: false, label: "waiting approval" }}
        />
      </section>

      {/* Analytics & Streak Section */}
      <section className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        <div className="lg:col-span-2 space-y-8">
          <StreakCard 
            currentStreak={12} 
            longestStreak={28} 
            heatmapData={heatmapData}
          />
          <AnalyticsCharts className="h-full" />
        </div>
        
        <div className="space-y-8">
          <div className="space-y-4">
            <h3 className="text-sm font-bold uppercase tracking-widest text-muted-foreground px-1">Engagement Time</h3>
            <TimeSpentCard today="4h 20m" week="32h 15m" month="128h 40m" />
          </div>
          <TrendingSessions items={trendingSessions} />
        </div>
      </section>

      {/* Recent Activity List */}
      <section>
        <RecentSessionsList sessions={recentSessions} />
      </section>
    </div>
  )
}
