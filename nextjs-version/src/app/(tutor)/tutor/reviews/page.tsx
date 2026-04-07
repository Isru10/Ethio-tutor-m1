"use client"

import { useEffect, useState, useMemo } from "react"
import { Star, MessageSquare, TrendingUp, ThumbsUp } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { useAuthStore } from "@/store/authStore"
import { getTutorReviews } from "@/lib/services/tutorService"
import type { TutorReviewRow } from "@/types/tutor"

function Stars({ rating, size = "sm" }: { rating: number; size?: "sm" | "lg" }) {
  const sz = size === "lg" ? "size-5" : "size-3.5"
  return (
    <div className="flex items-center gap-0.5">
      {Array.from({ length: 5 }).map((_, i) => (
        <Star
          key={i}
          className={
            i < Math.floor(rating) ? `${sz} fill-amber-400 text-amber-400`
            : i < rating ? `${sz} fill-amber-200 text-amber-200`
            : `${sz} text-muted-foreground/30`
          }
        />
      ))}
    </div>
  )
}

export default function TutorReviewsPage() {
  const { user } = useAuthStore()
  const [rows, setRows] = useState<TutorReviewRow[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user) return
    getTutorReviews(user.user_id, user.tenant_id).then(data => {
      setRows(data)
      setLoading(false)
    })
  }, [user])

  const avgRating = useMemo(() =>
    rows.length ? rows.reduce((a, r) => a + r.rating, 0) / rows.length : 0
  , [rows])

  const distribution = useMemo(() => {
    return [5, 4, 3, 2, 1].map(n => ({
      star: n,
      count: rows.filter(r => r.rating === n).length,
      pct: rows.length ? Math.round((rows.filter(r => r.rating === n).length / rows.length) * 100) : 0,
    }))
  }, [rows])

  return (
    <>
      <div className="px-4 lg:px-6">
        <h1 className="text-2xl font-bold tracking-tight">My Reviews</h1>
        <p className="text-muted-foreground text-sm">All student feedback and ratings for your sessions.</p>
      </div>

      {/* Overview */}
      <div className="px-4 lg:px-6 grid gap-4 md:grid-cols-3">
        {/* Big rating card */}
        <Card className="flex flex-col items-center justify-center py-8 gap-3">
          <div className="text-6xl font-black text-foreground">{loading ? "–" : avgRating.toFixed(1)}</div>
          <Stars rating={avgRating} size="lg" />
          <p className="text-sm text-muted-foreground">{rows.length} review{rows.length !== 1 ? "s" : ""}</p>
        </Card>

        {/* Rating distribution */}
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle className="text-base">Rating Breakdown</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {loading ? (
              Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-6 w-full rounded" />)
            ) : (
              distribution.map(({ star, count, pct }) => (
                <div key={star} className="flex items-center gap-3 text-sm">
                  <div className="flex items-center gap-1 w-10 shrink-0">
                    <Star className="size-3.5 fill-amber-400 text-amber-400" />
                    <span>{star}</span>
                  </div>
                  <div className="flex-1 bg-muted rounded-full h-2 overflow-hidden">
                    <div
                      className="h-2 rounded-full bg-amber-400 transition-all"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                  <span className="w-8 text-right text-muted-foreground">{count}</span>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>

      {/* Stat cards */}
      <div className="px-4 lg:px-6 grid gap-4 grid-cols-3">
        {[
          { label: "Average Rating", value: loading ? "–" : avgRating.toFixed(1) + "★", icon: Star, color: "text-amber-400" },
          { label: "Total Reviews",  value: loading ? "–" : rows.length.toString(),       icon: MessageSquare, color: "text-blue-500" },
          { label: "5-Star Reviews", value: loading ? "–" : rows.filter(r => r.rating === 5).length.toString(), icon: ThumbsUp, color: "text-green-500" },
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

      {/* Review cards */}
      <div className="px-4 lg:px-6">
        <Card>
          <CardHeader>
            <CardTitle>Student Reviews</CardTitle>
            <CardDescription>Individual feedback from your students</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {loading ? (
              Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-20 w-full rounded-xl" />)
            ) : rows.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <Star className="size-10 text-muted-foreground/30 mb-3" />
                <p className="text-sm text-muted-foreground">No reviews yet. Keep teaching and they'll come!</p>
              </div>
            ) : (
              rows.map((r) => (
                <div key={r.review_id} className="rounded-xl border p-4 space-y-2 hover:bg-muted/30 transition-colors">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-2.5">
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">
                        {r.studentName.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2)}
                      </div>
                      <div>
                        <p className="font-semibold text-sm">{r.studentName}</p>
                        <p className="text-xs text-muted-foreground">{r.subject} · {new Date(r.createdAt).toLocaleDateString("en-ET", { month: "short", day: "numeric", year: "numeric" })}</p>
                      </div>
                    </div>
                    <Stars rating={r.rating} />
                  </div>
                  <p className="text-sm text-muted-foreground leading-relaxed pl-11">"{r.comment}"</p>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>
    </>
  )
}
