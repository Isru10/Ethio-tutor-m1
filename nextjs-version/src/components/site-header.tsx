"use client"

import * as React from "react"
import Link from "next/link"
import { Bell, MessageSquare } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { SidebarTrigger } from "@/components/ui/sidebar"
import { CommandSearch, SearchTrigger } from "@/components/command-search"
import { Badge } from "@/components/ui/badge"
import { useAppStore } from "@/store/appStore"
import { useAuthStore } from "@/lib/store/useAuthStore"
import { API_BASE } from "@/lib/api"

const NOTIF_POLL_MS = 30_000

export function SiteHeader() {
  const [searchOpen, setSearchOpen] = React.useState(false)
  const { unreadCount, unreadChatCount, setNotifications, setUnreadChatCount } = useAppStore()
  const { user, accessToken, isAuthenticated } = useAuthStore()

  // Poll notifications from the real backend every 30 seconds
  React.useEffect(() => {
    if (!isAuthenticated || !accessToken) return

    const fetchNotifs = async () => {
      try {
        const res = await fetch(`${API_BASE}/notifications`, {
          headers: { Authorization: `Bearer ${accessToken}` },
        })
        if (!res.ok) return
        const data = await res.json()
        setNotifications(data.data ?? [])
      } catch { /* silent */ }
    }

    // Poll unread chat counts
    const fetchChatUnread = async () => {
      try {
        const res = await fetch(`${API_BASE}/chat/unread`, {
          headers: { Authorization: `Bearer ${accessToken}` },
        })
        if (!res.ok) return
        const data = await res.json()
        const counts: Record<number, number> = data.data ?? {}
        const total = Object.values(counts).reduce((sum, n) => sum + n, 0)
        setUnreadChatCount(total)
      } catch { /* silent */ }
    }

    fetchNotifs()
    fetchChatUnread()

    const interval = setInterval(() => {
      fetchNotifs()
      fetchChatUnread()
    }, NOTIF_POLL_MS)

    return () => clearInterval(interval)
  }, [isAuthenticated, accessToken, setNotifications, setUnreadChatCount])

  React.useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault()
        setSearchOpen((open) => !open)
      }
    }
    document.addEventListener("keydown", down)
    return () => document.removeEventListener("keydown", down)
  }, [])

  // Chat link depends on role
  const chatHref = user?.role === "TUTOR"
    ? "/tutor/chat"
    : user?.role === "ADMIN" || user?.role === "SUPER_ADMIN" || user?.role === "MODERATOR"
    ? "/admin/chat"
    : "/chat"

  const notifHref = user?.role === "TUTOR"
    ? "/tutor/notifications"
    : user?.role === "ADMIN" || user?.role === "SUPER_ADMIN" || user?.role === "MODERATOR"
    ? "/admin/notifications"
    : "/notifications"

  return (
    <>
      <header className="flex h-(--header-height) shrink-0 items-center gap-2 border-b transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-(--header-height)">
        <div className="flex w-full items-center gap-1 px-4 py-3 lg:gap-2 lg:px-6">
          <SidebarTrigger className="-ml-1" />
          <Separator orientation="vertical" className="mx-2 data-[orientation=vertical]:h-4" />
          <div className="flex-1 max-w-sm">
            <SearchTrigger onClick={() => setSearchOpen(true)} />
          </div>
          <div className="ml-auto flex items-center gap-1">
            {/* Chat icon with unread message badge */}
            <Button variant="ghost" size="icon" className="relative" asChild>
              <Link href={chatHref}>
                <MessageSquare className="size-4" />
                {unreadChatCount > 0 && (
                  <Badge className="absolute -top-0.5 -right-0.5 h-4 min-w-4 px-1 text-[10px] flex items-center justify-center bg-blue-600">
                    {unreadChatCount > 9 ? "9+" : unreadChatCount}
                  </Badge>
                )}
              </Link>
            </Button>

            {/* Notification bell with unread count badge */}
            <Button variant="ghost" size="icon" className="relative" asChild>
              <Link href={notifHref}>
                <Bell className="size-4" />
                {unreadCount > 0 && (
                  <Badge className="absolute -top-0.5 -right-0.5 h-4 min-w-4 px-1 text-[10px] flex items-center justify-center">
                    {unreadCount > 9 ? "9+" : unreadCount}
                  </Badge>
                )}
              </Link>
            </Button>
          </div>
        </div>
      </header>
      <CommandSearch open={searchOpen} onOpenChange={setSearchOpen} />
    </>
  )
}
