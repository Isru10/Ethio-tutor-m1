"use client"

import { useEffect, useState, useCallback } from "react"
import { useAuthStore } from "@/lib/store/useAuthStore"
import { API_BASE } from "@/lib/api"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Clock, ShieldCheck, ShieldX, AlertCircle,
  Bell, RefreshCw, CheckCircle2,
} from "lucide-react"
import Link from "next/link"

function authHeaders() {
  return { Authorization: `Bearer ${useAuthStore.getState().accessToken}` }
}

interface Notification {
  notification_id: number
  title: string
  message: string
  is_read: boolean
  created_at: string
}

const STATUS_CONFIG = {
  pending: {
    icon: Clock,
    color: "text-amber-500",
    bg:    "bg-amber-100 dark:bg-amber-950/30",
    label: "Under Review",
    desc:  "Your profile has been submitted and is currently being reviewed by our team. This usually takes 1–2 business days.",
  },
  pending_info: {
    icon: AlertCircle,
    color: "text-blue-500",
    bg:    "bg-blue-100 dark:bg-blue-950/30",
    label: "More Info Required",
    desc:  "Our reviewer has requested additional information. Please check your notifications for details and update your profile.",
  },
  approved: {
    icon: ShieldCheck,
    color: "text-green-500",
    bg:    "bg-green-100 dark:bg-green-950/30",
    label: "Approved",
    desc:  "Your profile has been approved! You can now create sessions and start teaching.",
  },
  rejected: {
    icon: ShieldX,
    color: "text-red-500",
    bg:    "bg-red-100 dark:bg-red-950/30",
    label: "Not Approved",
    desc:  "Your profile was not approved. Please check your notifications for the reason and contact support if you have questions.",
  },
}

export default function OnboardingHomePage() {
  const { user }          = useAuthStore()
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [loading, setLoading]             = useState(true)
  const [verificationStatus, setVerificationStatus] = useState<string>("pending")

  const load = useCallback(async () => {
    if (!user) return
    const [notifRes, profileRes] = await Promise.all([
      fetch(`${API_BASE}/notifications`, { headers: authHeaders() }).then(r => r.json()),
      fetch(`${API_BASE}/tutors/${user.user_id}`, { headers: authHeaders() }).then(r => r.json()).catch(() => null),
    ])
    setNotifications((notifRes.data ?? []).slice(0, 5))
    if (profileRes?.data?.verification_status) {
      setVerificationStatus(profileRes.data.verification_status)
    }
    setLoading(false)
  }, [user])

  useEffect(() => { load() }, [load])

  const status = STATUS_CONFIG[verificationStatus as keyof typeof STATUS_CONFIG] ?? STATUS_CONFIG.pending
  const StatusIcon = status.icon
  const unread = notifications.filter(n => !n.is_read).length

  return (
    <div className="px-4 lg:px-6 space-y-6 max-w-2xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">
          Welcome, {user?.name?.split(" ")[0]} 👋
        </h1>
        <p className="text-muted-foreground text-sm mt-0.5">
          Your tutor profile is being processed. Here&apos;s your current status.
        </p>
      </div>

      {/* Verification status card */}
      {loading ? (
        <Skeleton className="h-36 rounded-xl" />
      ) : (
        <Card className="border-2">
          <CardContent className="pt-6 pb-6">
            <div className="flex items-start gap-4">
              <div className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl ${status.bg}`}>
                <StatusIcon className={`size-7 ${status.color}`} />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <h2 className="font-bold text-lg">Profile Status</h2>
                  <Badge variant="secondary" className={`text-xs ${status.bg} ${status.color} border-0`}>
                    {status.label}
                  </Badge>
                </div>
                <p className="text-muted-foreground text-sm leading-relaxed">{status.desc}</p>
                {verificationStatus === "pending_info" && (
                  <Button size="sm" className="mt-3 gap-2" asChild>
                    <Link href="/tutor/profile">Update Profile</Link>
                  </Button>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* What happens next */}
      <Card>
        <CardContent className="pt-5 pb-5">
          <h3 className="font-semibold text-sm mb-4">What happens next?</h3>
          <div className="space-y-3">
            {[
              { step: 1, label: "Profile submitted",       done: true },
              { step: 2, label: "Under review by our team", done: verificationStatus !== "pending" },
              { step: 3, label: "Profile approved",         done: verificationStatus === "approved" },
              { step: 4, label: "Start teaching",           done: false },
            ].map(s => (
              <div key={s.step} className="flex items-center gap-3">
                <div className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-bold ${s.done ? "bg-green-500 text-white" : "bg-muted text-muted-foreground"}`}>
                  {s.done ? <CheckCircle2 className="size-3.5" /> : s.step}
                </div>
                <span className={`text-sm ${s.done ? "text-foreground font-medium" : "text-muted-foreground"}`}>
                  {s.label}
                </span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Recent notifications */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-sm flex items-center gap-2">
            <Bell className="size-4" /> Recent Notifications
            {unread > 0 && <Badge className="text-[10px] h-4 px-1.5">{unread}</Badge>}
          </h3>
          <div className="flex gap-2">
            <Button variant="ghost" size="sm" className="h-7 gap-1.5 text-xs" onClick={load}>
              <RefreshCw className="size-3" /> Refresh
            </Button>
            <Link href="/onboarding/notifications" className="text-xs text-primary hover:underline underline-offset-4">
              View all →
            </Link>
          </div>
        </div>
        {loading ? (
          <div className="space-y-2">
            {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-12 rounded-lg" />)}
          </div>
        ) : notifications.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-6">No notifications yet.</p>
        ) : (
          <div className="rounded-xl border divide-y overflow-hidden">
            {notifications.map(n => (
              <div key={n.notification_id} className={`flex items-start gap-3 px-4 py-3 text-sm ${!n.is_read ? "bg-primary/5" : ""}`}>
                {!n.is_read && <span className="mt-1.5 h-2 w-2 rounded-full bg-primary shrink-0" />}
                <div className={!n.is_read ? "" : "ml-5"}>
                  <p className="font-medium">{n.title}</p>
                  <p className="text-muted-foreground text-xs mt-0.5 line-clamp-2">{n.message}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
