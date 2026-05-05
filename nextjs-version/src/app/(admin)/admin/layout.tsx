"use client";

import React, { useEffect } from "react";
import { useRouter } from "next/navigation";
import { AdminSidebar } from "@/components/sidebar/admin-sidebar";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { useSidebarConfig } from "@/hooks/use-sidebar-config";
import { useAuthStore } from "@/lib/store/useAuthStore";
import { useRefreshUser } from "@/hooks/useRefreshUser";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [themeCustomizerOpen, setThemeCustomizerOpen] = React.useState(false);
  const { config } = useSidebarConfig();
  const { user } = useAuthStore();
  const router = useRouter();

  // Sync user state from backend — handles role/status changes
  useRefreshUser();

  // Client-side role guard — second layer after middleware
  useEffect(() => {
    if (!user) return;
    const isAdmin = ["ADMIN", "SUPER_ADMIN", "MODERATOR"].includes(user.role);
    if (!isAdmin) {
      // Students and tutors have no business here
      const home = user.role === "TUTOR"
        ? (user.status === "active" ? "/tutor/tutor-dashboard" : "/onboarding")
        : "/dashboard";
      router.replace(home);
    }
  }, [user, router]);

  return (
    <SidebarProvider
      style={{
        "--sidebar-width": "16rem",
        "--sidebar-width-icon": "3rem",
        "--header-height": "calc(var(--spacing) * 14)",
      } as React.CSSProperties}
      className={config.collapsible === "none" ? "sidebar-none-mode" : ""}
    >
      {config.side === "left" ? (
        <>
          <AdminSidebar
            variant={config.variant}
            collapsible={config.collapsible}
            side={config.side}
          />
          <SidebarInset>
            <SiteHeader />
            <div className="flex flex-1 flex-col">
              <div className="@container/main flex flex-1 flex-col gap-2">
                <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
                  {children}
                </div>
              </div>
            </div>
            <SiteFooter />
          </SidebarInset>
        </>
      ) : (
        <>

          <SidebarInset>
            <SiteHeader />
            <div className="flex flex-1 flex-col">
              <div className="@container/main flex flex-1 flex-col gap-2">
                <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
                  {children}
                </div>
              </div>
            </div>
            <SiteFooter />
          </SidebarInset>
          <AdminSidebar
            variant={config.variant}
            collapsible={config.collapsible}
            side={config.side}
          />
        </>
      )}

      {/* Theme Customizer */}
      {/* <ThemeCustomizerTrigger onClick={() => setThemeCustomizerOpen(true)} />
      <ThemeCustomizer
        open={themeCustomizerOpen}
        onOpenChange={setThemeCustomizerOpen}
      /> */}
      {/* <UpgradeToProButton /> */}
    </SidebarProvider>
  );
}
