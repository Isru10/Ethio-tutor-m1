"use client";

import React, { useEffect } from "react";
import { useRouter } from "next/navigation";
import { OnboardingSidebar } from "@/components/sidebar/onboarding-sidebar";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { ThemeCustomizer, ThemeCustomizerTrigger } from "@/components/theme-customizer";
import { useSidebarConfig } from "@/hooks/use-sidebar-config";
import { useAuthStore } from "@/lib/store/useAuthStore";
import { useRefreshUser } from "@/hooks/useRefreshUser";

export default function OnboardingLayout({ children }: { children: React.ReactNode }) {
  const [themeCustomizerOpen, setThemeCustomizerOpen] = React.useState(false);
  const { config } = useSidebarConfig();
  const { user }   = useAuthStore();
  const router     = useRouter();

  // Always sync user status from backend — approved tutors get redirected automatically
  useRefreshUser();

  useEffect(() => {
    if (!user) return;
    // Non-tutors have no business here
    if (user.role !== "TUTOR") { router.replace("/dashboard"); return; }
    // Approved tutors go to their dashboard
    if (user.status === "active") { router.replace("/tutor/tutor-dashboard"); }
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
      <OnboardingSidebar
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
      <ThemeCustomizerTrigger onClick={() => setThemeCustomizerOpen(true)} />
      <ThemeCustomizer open={themeCustomizerOpen} onOpenChange={setThemeCustomizerOpen} />
    </SidebarProvider>
  );
}
