"use client"

import * as React from "react"
import {
  LayoutDashboard, CreditCard, Bell, User,
  Users, BookOpen, Wallet, ShieldAlert, Shield, ClipboardList,
  type LucideIcon,
} from "lucide-react"
import { SidebarNotification } from "@/components/sidebar-notification"
import { NavUser } from "@/components/nav-user"
import { SidebarLogo } from "./shared/sidebar-logo"
import { SidebarNavItem } from "./shared/sidebar-nav-item"
import {
  Sidebar, SidebarContent, SidebarFooter, SidebarHeader,
} from "@/components/ui/sidebar"
import { useAuthStore } from "@/lib/store/useAuthStore"
import { usePermissions, type Permission } from "@/hooks/usePermissions"

// Each nav item declares which permission is required to see it.
// null = always visible (Dashboard, Account items)
const adminNav: {
  label: string
  items: { title: string; url: string; icon: LucideIcon; permission: Permission | null }[]
}[] = [
  {
    label: "Platform",
    items: [
      { title: "Dashboard",       url: "/admin/admin-dashboard",  icon: LayoutDashboard, permission: "view_dashboard" },
      { title: "Users",           url: "/admin/users",            icon: Users,           permission: "view_users"     },
      { title: "Tutors",          url: "/admin/tutors",           icon: BookOpen,        permission: "view_tutors"    },
      { title: "Review History",  url: "/admin/tutors/history",   icon: ClipboardList,   permission: "verify_tutors"  },
    ],
  },
  {
    label: "Finance",
    items: [
      { title: "Transactions", url: "/admin/transactions",    icon: CreditCard,      permission: "view_transactions" },
      { title: "Payouts",      url: "/admin/payouts",         icon: Wallet,          permission: "view_payouts"      },
      { title: "Disputes",     url: "/admin/disputes",        icon: ShieldAlert,     permission: "manage_disputes"   },
    ],
  },
  {
    label: "Access Control",
    items: [
      { title: "Roles", url: "/admin/roles", icon: Shield, permission: null },
    ],
  },
  {
    label: "Account",
    items: [
      { title: "Notifications", url: "/admin/notifications",  icon: Bell,            permission: null },
      { title: "Profile",       url: "/admin/profile",        icon: User,            permission: null },
    ],
  },
]

export function AdminSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const { user }       = useAuthStore()
  const { can, loading } = usePermissions()

  // Full admins skip permission checks entirely
  const isFullAdmin = user?.role === "ADMIN" || user?.role === "SUPER_ADMIN"

  const filteredNav = adminNav.map(group => ({
    ...group,
    items: group.items.filter(item => {
      // "Access Control" group is only for full admins
      if (group.label === "Access Control") return isFullAdmin
      return (
        item.permission === null ||
        isFullAdmin ||
        (!loading && can(item.permission))
      )
    }),
  })).filter(group => group.items.length > 0)

  return (
    <Sidebar {...props}>
      <SidebarHeader>
        <SidebarLogo
          homeUrl="/admin/admin-dashboard"
          appName="EthioTutor"
          appSubtitle={isFullAdmin ? "Admin Panel" : "Staff Panel"}
        />
      </SidebarHeader>
      <SidebarContent>
        {filteredNav.map((group) => (
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
