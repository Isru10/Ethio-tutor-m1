"use client"

import { useEffect, useCallback } from "react"
import { Bell, BellOff, CheckCheck, BookOpen, Calendar, CreditCard, Star, MessageSquare } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { useAuthStore } from "@/store/authStore"
import { useAppStore } from "@/store/appStore"
import { API_BASE } from "@/lib/api"
import { cn } from "@/lib/utils"

function getIcon(title: string) {
  if (title.includes("message") || title.includes("Message") || title.includes("chat")) return MessageSquare
  if (title.includes("Booking") || title.includes("Book")) return BookOpen
  if (title.includes("Session") || title.includes("Reminder")) return Calendar
  if (title.includes("Payment") || title.includes("Transaction")) return CreditCard
  if (title.includes("Review")) return Star
  return Bell
}

function authHeaders(token: string | null) {
  return { Authorization: `Bearer ${token}`, "Content-Type": "application/json" }
}

export default function NotificationsPage() {
  const { user, accessToken } = useAuthStore()
  const { notifications, unreadCount, setNotifications, markAllRead, markOneRead } = useAppStore()

  const loadNotifications = useCallback(async () => {
    if (!accessToken) return
    try {
      const res = await fetch(`${API_BASE}/notifications`, { headers: authHeaders(accessToken) })
      if (!res.ok) return
      const data = await res.json()
      setNotifications(data.data ?? [])
    } catch { /* silent */ }
  }, [accessToken, setNotifications])

  useEffect(() => {
    loadNotifications()
  }, [loadNotifications])

  const handleMarkOneRead = async (id: number) => {
    markOneRead(id) // optimistic
    try {
      await fetch(`${API_BASE}/notifications/${id}/read`, {
        method: "PATCH",
        headers: authHeaders(accessToken),
      })
    } catch { /* silent — local state already updated */ }
  }

  const handleMarkAllRead = async () => {
    markAllRead() // optimistic
    // Mark each unread one on the backend
    const unread = notifications.filter(n => !n.is_read)
    await Promise.allSettled(
      unread.map(n =>
        fetch(`${API_BASE}/notifications/${n.notification_id}/read`, {
          method: "PATCH",
          headers: authHeaders(accessToken),
        })
      )
    )
  }

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
            {unreadCount > 0 ? `${unreadCount} unread notification${unreadCount > 1 ? "s" : ""}` : "All caught up!"}
          </p>
        </div>
        {unreadCount > 0 && (
          <Button variant="outline" size="sm" className="gap-2" onClick={handleMarkAllRead}>
            <CheckCheck className="size-4" /> Mark all read
          </Button>
        )}
      </div>

      <div className="px-4 lg:px-6">
        <div className="rounded-xl border divide-y overflow-hidden">
          {notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-3 py-20 text-center">
              <BellOff className="size-10 text-muted-foreground/40" />
              <p className="text-muted-foreground text-sm font-medium">No notifications yet.</p>
            </div>
          ) : (
            notifications.map((n) => {
              const Icon = getIcon(n.title)
              return (
                <div
                  key={n.notification_id}
                  className={cn(
                    "flex items-start gap-4 px-5 py-4 transition-colors",
                    !n.is_read ? "bg-primary/5 hover:bg-primary/10" : "bg-background hover:bg-muted/40"
                  )}
                >
                  <div className={cn(
                    "flex h-9 w-9 shrink-0 items-center justify-center rounded-full",
                    !n.is_read ? "bg-primary/15 text-primary" : "bg-muted text-muted-foreground"
                  )}>
                    <Icon className="size-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className={cn("text-sm font-medium leading-tight", !n.is_read && "text-foreground")}>
                          {n.title}
                        </p>
                        <p className="text-muted-foreground text-sm mt-0.5 leading-relaxed">{n.message}</p>
                      </div>
                      <div className="flex flex-col items-end gap-2 shrink-0">
                        <span className="text-xs text-muted-foreground whitespace-nowrap">
                          {formatDate(n.created_at)}
                        </span>
                        {!n.is_read && (
                          <div className="flex items-center gap-2">
                            <span className="h-2 w-2 rounded-full bg-primary" />
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-6 text-xs px-2"
                              onClick={() => handleMarkOneRead(n.notification_id)}
                            >
                              Mark read
                            </Button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )
            })
          )}
        </div>
      </div>
    </>
  )
}
