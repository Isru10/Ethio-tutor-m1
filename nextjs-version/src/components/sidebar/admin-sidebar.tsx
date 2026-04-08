"use client"

import * as React from "react"
import {
  LayoutDashboard, CreditCard, Bell, User,
  Users, BookOpen, Video, Wallet, ShieldAlert,
} from "lucide-react"

import { SidebarNotification } from "@/components/sidebar-notification"
import { NavUser } from "@/components/nav-user"
import { SidebarLogo } from "./shared/sidebar-logo"
import { SidebarNavItem } from "./shared/sidebar-nav-item"
import {
  Sidebar, SidebarContent, SidebarFooter, SidebarHeader,
} from "@/components/ui/sidebar"

const adminNav = [
  {
    label: "Platform",
    items: [
      { title: "Dashboard",     url: "/admin/admin-dashboard", icon: LayoutDashboard },
      { title: "Students",      url: "/admin/users",           icon: Users },
      { title: "Tutors",        url: "/admin/tutors",          icon: BookOpen },
      { title: "Bookings",      url: "/admin/bookings",        icon: BookOpen },
      { title: "Sessions",      url: "/admin/sessions",        icon: Video },
    ],
  },
  {
    label: "Finance",
    items: [
      { title: "Transactions",  url: "/admin/transactions",    icon: CreditCard },
      { title: "Payouts",       url: "/admin/payouts",         icon: Wallet },
      { title: "Disputes",      url: "/admin/disputes",        icon: ShieldAlert },
    ],
  },
  {
    label: "Account",
    items: [
      { title: "Notifications", url: "/admin/notifications",   icon: Bell },
      { title: "Profile",       url: "/admin/profile",         icon: User },
    ],
  },
]

export function AdminSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  return (
    <Sidebar {...props}>
      <SidebarHeader>
        <SidebarLogo
          homeUrl="/admin/admin-dashboard"
          appName="EthioTutor"
          appSubtitle="Admin Panel"
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
