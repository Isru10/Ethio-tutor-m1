"use client"

import * as React from "react"
import {
  LayoutDashboard,
  BookOpen,
  Calendar,
  Video,
  CreditCard,
  Bell,
  User,
  Search,
  Settings,
  Users,
  BarChart2,
  Star,
  Wallet,
  CalendarClock,
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

// ─── TUTOR nav (basic plan) ──────────────────────────────────
const tutorBasicNav = [
  {
    label: "My Portal",
    items: [
      { title: "Dashboard",    url: "/tutor/tutor-dashboard", icon: LayoutDashboard },
      { title: "My Bookings",  url: "/tutor/bookings",        icon: BookOpen },
      { title: "My Sessions",  url: "/tutor/sessions",        icon: Calendar },
      { title: "My Students",  url: "/tutor/students",        icon: Users },
      { title: "Manage Slots", url: "/tutor/slots",           icon: CalendarClock },
      { title: "Earnings",     url: "/tutor/earnings",        icon: Wallet },
      { title: "Browse",       url: "/tutor/browse",          icon: Search },
      { title: "Transactions", url: "/tutor/transactions",    icon: CreditCard },
    ],
  },
  {
    label: "Insights",
    items: [
      { title: "My Reviews",   url: "/tutor/reviews",         icon: Star },
      { title: "Analytics",    url: "/tutor/analytics",       icon: BarChart2 },
    ],
  },
  {
    label: "Account",
    items: [
      { title: "Notifications", url: "/tutor/notifications",  icon: Bell },
      { title: "My Profile",    url: "/tutor/profile",        icon: User },
      {
        title: "Settings", url: "#", icon: Settings,
        items: [
          { title: "Account",       url: "/tutor/settings/account" },
          { title: "Appearance",    url: "/tutor/settings/appearance" },
          { title: "Billing",       url: "/tutor/settings/billing" },
          { title: "Notifications", url: "/tutor/settings/notifications" },
        ],
      },
    ],
  },
]

// ─── TUTOR nav (pro plan — adds Recordings) ──────────────────
const tutorProNav = [
  {
    label: "My Portal",
    items: [
      { title: "Dashboard",    url: "/tutor/tutor-dashboard", icon: LayoutDashboard },
      { title: "My Bookings",  url: "/tutor/bookings",        icon: BookOpen },
      { title: "My Sessions",  url: "/tutor/sessions",        icon: Calendar },
      { title: "Recordings",   url: "/tutor/recordings",      icon: Video },
      { title: "My Students",  url: "/tutor/students",        icon: Users },
      { title: "Manage Slots", url: "/tutor/slots",           icon: CalendarClock },
      { title: "Earnings",     url: "/tutor/earnings",        icon: Wallet },
      { title: "Browse",       url: "/tutor/browse",          icon: Search },
      { title: "Transactions", url: "/tutor/transactions",    icon: CreditCard },
    ],
  },
  {
    label: "Insights",
    items: [
      { title: "My Reviews",   url: "/tutor/reviews",         icon: Star },
      { title: "Analytics",    url: "/tutor/analytics",       icon: BarChart2 },
    ],
  },
  {
    label: "Account",
    items: [
      { title: "Notifications", url: "/tutor/notifications",  icon: Bell },
      { title: "My Profile",    url: "/tutor/profile",        icon: User },
      {
        title: "Settings", url: "#", icon: Settings,
        items: [
          { title: "Account",       url: "/tutor/settings/account" },
          { title: "Appearance",    url: "/tutor/settings/appearance" },
          { title: "Billing",       url: "/tutor/settings/billing" },
          { title: "Notifications", url: "/tutor/settings/notifications" },
        ],
      },
    ],
  },
]

export function TutorSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const { user } = useAuthStore()
  const isPro = user?.plan === "pro"
  const navGroups = isPro ? tutorProNav : tutorBasicNav

  return (
    <Sidebar {...props}>
      <SidebarHeader>
        <SidebarLogo 
          homeUrl="/tutor/tutor-dashboard" 
          appName="EthioTutor" 
          appSubtitle={`Tutor · ${isPro ? "Pro" : "Basic"}`} 
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
