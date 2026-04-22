"use client"

import { useEffect, useState, useCallback } from "react"
import {
  Bell, BellOff, CheckCheck, BookOpen, Calendar,
  CreditCard, Star, ShieldCheck, ShieldX, AlertCircle,
} from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { useAuthStore } from "@/lib/store/useAuthStore"
import { API_BASE } from "@/lib/api"
import { cn } from "@/lib/utils"

interface Notification {
  notification_id: number
  title: string
  message: string
  is_read: boolean
  created_at: string
}

function authHeaders() {
  return { Authorization: `Bearer ${useAuthStore.getState().accessToken}`, "Content-Type": "application/json" }
}

function getIcon(title: string) {
  if (title.includes("Approved") || title.includes("approved")) return ShieldCheck
  if (title.includes("Rejected") || title.includes("rejected")) return ShieldX
  if (title.includes("Info") || title.includes("info"))         return AlertCircle
  if (title.includes("Booking") || title.includes("Book"))      return BookOpen
  if (title.includes("Session") || title.includes("Reminder"))  return Calendar
  if (title.includes("Payment") || title.includes("Transaction")) return CreditCard
  if (title.includes("Review"))                                  return Star
  return Bell
}

function getIconStyle(title: string, isRead: boolean) {
  if (!isRead) {
    if (title.includes("Approved"))  return "bg-green-100 text-green-600 dark:bg-green-950/30 dark:text-green-400"
    if (title.includes("Rejected"))  return "bg-red-100 text-red-600 dark:bg-red-950/30 dark:text-red-400"
    if (title.includes("Info"))      return "bg-amber-100 text-amber-600 dark:bg-amber-950/30 dark:text-amber-400"
    return "bg-primary/15 text-primary"
  }
  return "bg-muted text-muted-foreground"
}

export default function TutorNotificationsPage() {
  const { user } = useAuthStore()
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [loading, setLoading]             = useState(true)

  const load = useCallback(async () => {
    const res  = await fetch(`${API_BASE}/notifications`, { headers: authHeaders() })
    const data = await res.json()
    setNotifications(data.data ?? [])
    setLoading(false)
  }, [])

  useEffect(() => { if (user) load() }, [user, load])

  const markRead = async (id: number) => {
    await fetch(`${API_BASE}/notifications/${id}/read`, { method: "PATCH", headers: authHeaders() })
    setNotifications(prev => prev.map(n => n.notification_id === id ? { ...n, is_read: true } : n))
  }

  const markAllRead = async () => {
    const unread = notifications.filter(n => !n.is_read)
    await Promise.all(unread.map(n =>
      fetch(`${API_BASE}/notifications/${n.notification_id}/read`, { method: "PATCH", headers: authHeaders() })
    ))
    setNotifications(prev => prev.map(n => ({ ...n, is_read: true })))
  }

  const unreadCount = notifications.filter(n => !n.is_read).length

  const formatDate = (iso: string) => {
    const d = new Date(iso)
    return d.toLocaleDateString("en-ET", { month: "short", day: "numeric" }) +
      " · " + d.toLocaleTimeString("en-ET", { hour: "2-digit", minute: "2-digit" })
  }

  return (
    <>
      <div className="px-4 lg:px-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Notifications</h1>
          <p className="text-muted-foreground text-sm">
            {unreadCount > 0 ? `${unreadCount} unread` : "All caught up!"}
          </p>
        </div>
        {unreadCount > 0 && (
          <Button variant="outline" size="sm" className="gap-2" onClick={markAllRead}>
            <CheckCheck className="size-4" /> Mark all read
          </Button>
        )}
      </div>

      <div className="px-4 lg:px-6">
        {loading ? (
          <div className="space-y-2">
            {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-16 rounded-xl" />)}
          </div>
        ) : notifications.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center gap-3 py-20 text-center">
              <BellOff className="size-10 text-muted-foreground/40" />
              <p className="text-muted-foreground text-sm">No notifications yet.</p>
            </CardContent>
          </Card>
        ) : (
          <div className="rounded-xl border divide-y overflow-hidden">
            {notifications.map(n => {
              const Icon = getIcon(n.title)
              return (
                <div
                  key={n.notification_id}
                  className={cn(
                    "flex items-start gap-4 px-5 py-4 transition-colors",
                    !n.is_read ? "bg-primary/5 hover:bg-primary/10" : "bg-background hover:bg-muted/40"
                  )}
                >
                  <div className={cn("flex h-9 w-9 shrink-0 items-center justify-center rounded-full", getIconStyle(n.title, n.is_read))}>
                    <Icon className="size-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className={cn("text-sm font-semibold leading-tight", !n.is_read && "text-foreground")}>
                          {n.title}
                        </p>
                        <p className="text-muted-foreground text-sm mt-0.5 leading-relaxed">{n.message}</p>
                      </div>
                      <div className="flex flex-col items-end gap-2 shrink-0">
                        <span className="text-xs text-muted-foreground whitespace-nowrap">{formatDate(n.created_at)}</span>
                        {!n.is_read && (
                          <div className="flex items-center gap-2">
                            <span className="h-2 w-2 rounded-full bg-primary" />
                            <Button variant="ghost" size="sm" className="h-6 text-xs px-2" onClick={() => markRead(n.notification_id)}>
                              Mark read
                            </Button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </>
  )
}
