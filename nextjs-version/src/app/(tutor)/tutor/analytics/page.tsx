"use client"

import { useEffect, useState, useMemo } from "react"
import { Star, Users, BookCheck, TrendingUp, Award, BarChart2, RefreshCw } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar,
} from "recharts"
import { useAuthStore } from "@/store/authStore"
import { getTutorAnalytics } from "@/lib/services/tutorService"
import type { TutorAnalytics } from "@/types/tutor"

export default function TutorAnalyticsPage() {
  const { user } = useAuthStore()
  const [data, setData] = useState<TutorAnalytics | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user) return
    getTutorAnalytics(user.user_id, user.tenant_id).then(d => {
      setData(d)
      setLoading(false)
    })
  }, [user])

  return (
    <>
      <div className="px-4 lg:px-6">
        <h1 className="text-2xl font-bold tracking-tight">Teaching Analytics</h1>
        <p className="text-muted-foreground text-sm">Insights into your teaching performance and student engagement.</p>
      </div>

      {/* KPI cards */}
      <div className="px-4 lg:px-6 grid gap-4 grid-cols-2 md:grid-cols-4">
        {[
          { label: "Sessions Completed", value: loading ? "–" : data?.totalSessions.toString() ?? "0",         icon: BookCheck,   color: "text-foreground" },
          { label: "Avg Rating",         value: loading ? "–" : (data?.avgRating.toFixed(1) ?? "0") + " ★",   icon: Star,        color: "text-amber-400" },
          { label: "Unique Students",    value: loading ? "–" : data?.uniqueStudents.toString() ?? "0",        icon: Users,       color: "text-blue-500" },
          { label: "Returning Students", value: loading ? "–" : (data?.returningRate ?? 0) + "%",              icon: RefreshCw,   color: "text-purple-500" },
        ].map(({ label, value, icon: Icon, color }) => (
          <Card key={label}>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-muted-foreground text-sm font-medium">{label}</p>
                  <p className="text-2xl font-bold mt-1">{value}</p>
                </div>
                <div className="bg-secondary rounded-lg p-3">
                  <Icon className={`size-5 ${color}`} />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="px-4 lg:px-6 grid gap-4 md:grid-cols-2">
        {/* Sessions over time - area chart */}
        <Card>
          <CardHeader className="flex flex-row items-center gap-2">
            <TrendingUp className="size-5 text-primary" />
            <div>
              <CardTitle>Sessions Over Time</CardTitle>
              <CardDescription>Monthly completed sessions</CardDescription>
            </div>
          </CardHeader>
          <CardContent>
            {loading ? <Skeleton className="h-44 w-full rounded-xl" /> : (
              <ResponsiveContainer width="100%" height={180}>
                <AreaChart data={data?.sessionsOverTime ?? []}>
                  <defs>
                    <linearGradient id="gradSess" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.25} />
                      <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                  <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip contentStyle={{ fontSize: 12 }} />
                  <Area type="monotone" dataKey="sessions" stroke="hsl(var(--primary))" fill="url(#gradSess)" strokeWidth={2} />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        {/* Top subjects - bar chart */}
        <Card>
          <CardHeader className="flex flex-row items-center gap-2">
            <BarChart2 className="size-5 text-primary" />
            <div>
              <CardTitle>Top Subjects</CardTitle>
              <CardDescription>By number of sessions taught</CardDescription>
            </div>
          </CardHeader>
          <CardContent>
            {loading ? <Skeleton className="h-44 w-full rounded-xl" /> : (
              <ResponsiveContainer width="100%" height={180}>
                <BarChart data={data?.topSubjects ?? []} barSize={24}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                  <XAxis dataKey="subject" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip contentStyle={{ fontSize: 12 }} />
                  <Bar dataKey="count" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Achievements */}
      <div className="px-4 lg:px-6">
        <Card>
          <CardHeader className="flex flex-row items-center gap-2">
            <Award className="size-5 text-amber-500" />
            <div>
              <CardTitle>Achievements</CardTitle>
              <CardDescription>Milestones you have reached on EthioTutor</CardDescription>
            </div>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-20 rounded-xl" />)}
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {(data?.achievements ?? []).map(a => (
                  <div key={a.label} className={`rounded-xl border p-4 text-center space-y-2 ${a.unlocked ? "bg-amber-50 border-amber-200 dark:bg-amber-950/20 dark:border-amber-900" : "opacity-50"}`}>
                    <div className="text-2xl">{a.emoji}</div>
                    <p className="text-sm font-semibold">{a.label}</p>
                    <p className="text-xs text-muted-foreground">{a.description}</p>
                    {a.unlocked ? (
                      <span className="inline-block text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-200 text-amber-800 dark:bg-amber-900 dark:text-amber-300">Unlocked</span>
                    ) : (
                      <span className="inline-block text-[10px] font-bold px-2 py-0.5 rounded-full bg-muted text-muted-foreground">Locked</span>
                    )}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </>
  )
}
