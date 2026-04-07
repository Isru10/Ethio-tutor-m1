import * as React from "react"
import Link from "next/link"
import { Logo } from "@/components/logo"
import { SidebarMenu, SidebarMenuItem, SidebarMenuButton } from "@/components/ui/sidebar"

interface SidebarLogoProps {
  appName: string
  appSubtitle: string
  homeUrl: string
}

export function SidebarLogo({ appName, appSubtitle, homeUrl }: SidebarLogoProps) {
  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <SidebarMenuButton size="lg" asChild>
          <Link href={homeUrl}>
            <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <Logo size={24} className="text-current" />
            </div>
            <div className="grid flex-1 text-left text-sm leading-tight">
              <span className="truncate font-medium">{appName}</span>
              <span className="truncate text-xs">{appSubtitle}</span>
            </div>
          </Link>
        </SidebarMenuButton>
      </SidebarMenuItem>
    </SidebarMenu>
  )
}
