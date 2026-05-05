// "use client";

// import React from "react";
// import { StudentSidebar } from "@/components/sidebar/student-sidebar";
// import { SiteHeader } from "@/components/site-header";
// import { SiteFooter } from "@/components/site-footer";
// import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
// import { ThemeCustomizer, ThemeCustomizerTrigger } from "@/components/theme-customizer";
// import { UpgradeToProButton } from "@/components/upgrade-to-pro-button";
// import { useSidebarConfig } from "@/hooks/use-sidebar-config";

// export default function DashboardLayout({ children }: { children: React.ReactNode }) {
//   const [themeCustomizerOpen, setThemeCustomizerOpen] = React.useState(false);
//   const { config } = useSidebarConfig();

//   return (
//     <SidebarProvider
//       defaultOpen={true}
//       style={{
//         "--sidebar-width": "16rem",
//         "--sidebar-width-icon": "4.5rem",
//         "--header-height": "calc(var(--spacing) * 14)",
//       } as React.CSSProperties}
//       className={config.collapsible === "none" ? "sidebar-none-mode" : ""}
//     >
//       {config.side === "left" ? (
//         <>
//           <StudentSidebar
//             variant={config.variant}
//             collapsible="icon"
//             side={config.side}
//           />
//           <SidebarInset>
//             <SiteHeader />
//             <div className="flex flex-1 flex-col">
//               <div className="@container/main flex flex-1 flex-col gap-2">
//                 <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
//                   {children}
//                 </div>
//               </div>
//             </div>
//             <SiteFooter />
//           </SidebarInset>
//         </>
//       ) : (
//         <>

//           <SidebarInset>
//             <SiteHeader />
//             <div className="flex flex-1 flex-col">
//               <div className="@container/main flex flex-1 flex-col gap-2">
//                 <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
//                   {children}
//                 </div>
//               </div>
//             </div>
//             <SiteFooter />
//           </SidebarInset>
//           <StudentSidebar
//             variant={config.variant}
//             collapsible="icon"
//             side={config.side}
//           />
//         </>
//       )}

//       {/* Theme Customizer */}
//       <ThemeCustomizerTrigger onClick={() => setThemeCustomizerOpen(true)} />
//       <ThemeCustomizer
//         open={themeCustomizerOpen}
//         onOpenChange={setThemeCustomizerOpen}
//       />
//       {/* <UpgradeToProButton /> */}
//     </SidebarProvider>
//   );
// }







"use client";

import React, { useEffect } from "react";
import { useRouter } from "next/navigation";
import { StudentSidebar } from "@/components/sidebar/student-sidebar";
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
    if (user.role === "TUTOR") {
      router.replace(user.status === "active" ? "/tutor/tutor-dashboard" : "/onboarding");
    } else if (user.role === "ADMIN" || user.role === "SUPER_ADMIN" || user.role === "MODERATOR") {
      router.replace("/admin/admin-dashboard");
    }
  }, [user, router]);

  return (
    <SidebarProvider
      defaultOpen={false}
      style={{
        "--sidebar-width": "16rem",
        "--sidebar-width-icon": "3rem",
        "--header-height": "calc(var(--spacing) * 14)",
      } as React.CSSProperties}
      className={config.collapsible === "none" ? "sidebar-none-mode" : ""}
    >
      {config.side === "left" ? (
        <>
          <StudentSidebar
            variant={config.variant}
            collapsible="icon"
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
          <StudentSidebar
            variant={config.variant}
            collapsible="icon"
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