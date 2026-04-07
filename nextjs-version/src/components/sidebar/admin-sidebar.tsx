"use client"

import * as React from "react"
import {
  LayoutDashboard,
  Calendar,
  Video,
  CreditCard,
  Bell,
  User,
  Users,
  BookOpen,
  LayoutPanelLeft,
  Settings,
  HelpCircle,
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

// ─── ADMIN nav — EthioTutor platform management ──────────────
const adminNav = [
  {
    label: "Platform",
    items: [
      { title: "Overview",      url: "/admin/dashboard-2", icon: LayoutDashboard },
      { title: "All Students",  url: "/admin/users",           icon: Users },
      { title: "All Tutors",    url: "/admin/users",           icon: BookOpen },
      { title: "Bookings",      url: "/admin/bookings",        icon: Calendar },
      { title: "Sessions",      url: "/admin/sessions",        icon: Video },
      { title: "Transactions",  url: "/admin/transactions",    icon: CreditCard },
    ],
  },
  {
    label: "Tools",
    items: [
      { title: "Calendar",      url: "/admin/calendar",       icon: Calendar },
      { title: "Mail",          url: "/admin/mail",            icon: LayoutPanelLeft },
      { title: "Chat",          url: "/admin/chat",            icon: LayoutPanelLeft },
      { title: "Notifications", url: "/admin/notifications",  icon: Bell },
    ],
  },
  {
    label: "Configuration",
    items: [
      {
        title: "Settings", url: "#", icon: Settings,
        items: [
          { title: "Account",       url: "/admin/settings/account" },
          { title: "Appearance",    url: "/admin/settings/appearance" },
          { title: "Billing",       url: "/admin/settings/billing" },
          { title: "Notifications", url: "/admin/settings/notifications" },
        ],
      },
      { title: "Profile",  url: "/admin/profile", icon: User },
      { title: "FAQs",     url: "/admin/faqs",    icon: HelpCircle },
    ],
  },
]

export function AdminSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  return (
    <Sidebar {...props}>
      <SidebarHeader>
        <SidebarLogo 
          homeUrl="/admin/admin-dashboard" 
          appName="EthioTutor Admin" 
          appSubtitle="Admin Dashboard" 
        />
      </SidebarHeader>
      <SidebarContent>
        {adminNav.map((group) => (
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
