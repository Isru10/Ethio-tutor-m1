"use client"

import * as React from "react"
import {
  BookOpen, Heart, TrendingUp, HelpCircle, ArrowLeft, User, Bell,
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
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
} from "@/components/ui/sidebar"
import Link from "next/link"

const onboardingNav = [
  {
    label: "Status",
    items: [
      { title: "My Status",        url: "/onboarding",          icon: Bell     },
      { title: "Update Profile",   url: "/onboarding/profile",  icon: User     },
      { title: "Notifications",    url: "/onboarding/notifications", icon: Bell },
    ],
  },
  {
    label: "Onboarding",
    items: [
      { title: "Onboarding Lessons", url: "/onboarding/lessons",   icon: BookOpen  },
      { title: "Our Values",         url: "/onboarding/values",    icon: Heart     },
      { title: "Preferred Niches",   url: "/onboarding/preferred", icon: TrendingUp },
      { title: "FAQ",                url: "/onboarding/faqs",      icon: HelpCircle },
    ],
  },
]

export function OnboardingSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  return (
    <Sidebar {...props}>
      <SidebarHeader>
        <SidebarLogo 
          homeUrl="/onboarding/lessons" 
          appName="EthioTutor" 
          appSubtitle="Tutor Onboarding" 
        />
      </SidebarHeader>
      <SidebarContent>
        {onboardingNav.map((group) => (
          <SidebarNavItem key={group.label} label={group.label} items={group.items} />
        ))}
        
        <SidebarMenu className="mt-auto px-2 pb-4">
          <SidebarMenuItem>
            <SidebarMenuButton asChild size="sm" className="text-muted-foreground hover:text-foreground">
              <Link href="/tutor/tutor-dashboard">
                <ArrowLeft className="h-4 w-4" />
                <span>Exit Onboarding</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarContent>
      <SidebarFooter>
        <SidebarNotification />
        <NavUser />
      </SidebarFooter>
    </Sidebar>
  )
}
