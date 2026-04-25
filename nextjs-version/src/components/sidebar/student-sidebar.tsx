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

const studentBasicNav = [
  {
    label: "Main",
    items: [
      { title: "Dashboard",      url: "/dashboard",    icon: LayoutDashboard },
      { title: "Browse Classes", url: "/browse",       icon: Search },
      { title: "My Bookings",    url: "/bookings",     icon: BookOpen },
      { title: "My Sessions",    url: "/sessions",     icon: Calendar },
      { title: "Payments",       url: "/transactions", icon: CreditCard },
    ],
  },
  {
    label: "Account",
    items: [
      { title: "Notifications", url: "/notifications", icon: Bell },
      { title: "My Profile",    url: "/profile",       icon: User },
      {
        title: "Settings",
        url: "#",
        icon: Settings,
        items: [
          { title: "Account",       url: "/settings/account" },
          { title: "Appearance",    url: "/settings/appearance" },
          { title: "Billing",       url: "/settings/billing" },
          { title: "Notifications", url: "/settings/notifications" },
        ],
      },
    ],
  },
]

const studentProNav = [
  {
    label: "Main",
    items: [
      { title: "Dashboard",      url: "/dashboard",    icon: LayoutDashboard },
      { title: "Browse Classes", url: "/browse",       icon: Search },
      { title: "My Bookings",    url: "/bookings",     icon: BookOpen },
      { title: "My Sessions",    url: "/sessions",     icon: Calendar },
      { title: "Recordings",     url: "/recordings",   icon: Video },
      { title: "Payments",       url: "/transactions", icon: CreditCard },
    ],
  },
  {
    label: "Account",
    items: [
      { title: "Notifications", url: "/notifications", icon: Bell },
      { title: "My Profile",    url: "/profile",       icon: User },
      {
        title: "Settings",
        url: "#",
        icon: Settings,
        items: [
          { title: "Account",       url: "/settings/account" },
          { title: "Appearance",    url: "/settings/appearance" },
          { title: "Billing",       url: "/settings/billing" },
          { title: "Notifications", url: "/settings/notifications" },
        ],
      },
    ],
  },
]

export function StudentSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const { user } = useAuthStore()
  const isPro = user?.plan === "pro"
  const navGroups = isPro ? studentProNav : studentBasicNav

  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <SidebarLogo
          homeUrl="/dashboard"
          appName="EthioTutor"
          appSubtitle={`Student · ${isPro ? "Pro" : "Basic"}`}
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
