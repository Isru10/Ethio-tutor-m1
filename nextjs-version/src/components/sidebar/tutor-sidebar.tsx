"use client"

import * as React from "react"
import {
  LayoutDashboard,
  BookOpen,
  Calendar,
  Bell,
  User,
  Users,
  Star,
  Wallet,
} from "lucide-react"

import { SidebarNotification } from "@/components/sidebar-notification"
import { NavUser } from "@/components/nav-user"
import { SidebarLogo } from "./shared/sidebar-logo"
import { SidebarNavItem } from "./shared/sidebar-nav-item"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
} from "@/components/ui/sidebar"
import { useAuthStore } from "@/lib/store/useAuthStore"

// ─── TUTOR nav ───────────────────────────────────────────────
const tutorNav = [
  {
    label: "My Portal",
    items: [
      { title: "Dashboard",     url: "/tutor/tutor-dashboard", icon: LayoutDashboard },
      { title: "My Sessions",   url: "/tutor/sessions",        icon: Calendar },
      { title: "My Bookings",   url: "/tutor/bookings",        icon: BookOpen },
      { title: "My Students",   url: "/tutor/students",        icon: Users },
      { title: "Earnings",      url: "/tutor/earnings",        icon: Wallet },
    ],
  },
  {
    label: "Insights",
    items: [
      { title: "My Reviews",    url: "/tutor/reviews",         icon: Star },
    ],
  },
  {
    label: "Account",
    items: [
      { title: "Notifications", url: "/tutor/notifications",   icon: Bell },
      { title: "My Profile",    url: "/tutor/profile",         icon: User },
    ],
  },
]

export function TutorSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const { user } = useAuthStore()
  const navGroups = tutorNav

  return (
    <Sidebar {...props}>
      <SidebarHeader>
        <SidebarLogo 
          homeUrl="/tutor/tutor-dashboard" 
          appName="EthioTutor" 
          appSubtitle={`Tutor · ${user?.plan === "pro" ? "Pro" : "Basic"}`} 
        />
      </SidebarHeader>
      <SidebarContent>
        {navGroups.map((group) => (
          <SidebarNavItem key={group.label} label={group.label} items={group.items} />
        ))}
      </SidebarContent>
      <SidebarFooter>
        <SidebarNotification />
        <NavUser />
      </SidebarFooter>
    </Sidebar>
  )
}
