"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuthStore } from "@/lib/store/useAuthStore"
import { usePermissions, type Permission } from "@/hooks/usePermissions"
import { Loader2 } from "lucide-react"

interface PermissionGuardProps {
  permission: Permission
  children: React.ReactNode
  redirectTo?: string
}

/**
 * Wraps a page and redirects to /admin/admin-dashboard if the current user
 * doesn't have the required permission.
 *
 * Full admins (ADMIN / SUPER_ADMIN) always pass through.
 *
 * Usage:
 *   export default function PayoutsPage() {
 *     return (
 *       <PermissionGuard permission="view_payouts">
 *         <PageContent />
 *       </PermissionGuard>
 *     )
 *   }
 */
export function PermissionGuard({ permission, children, redirectTo = "/admin/admin-dashboard" }: PermissionGuardProps) {
  const router          = useRouter()
  const { user }        = useAuthStore()
  const { can, loading } = usePermissions()

  const isFullAdmin = user?.role === "ADMIN" || user?.role === "SUPER_ADMIN"

  useEffect(() => {
    if (loading) return
    if (!isFullAdmin && !can(permission)) {
      router.replace(redirectTo)
    }
  }, [loading, isFullAdmin, can, permission, router, redirectTo])

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="size-6 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (!isFullAdmin && !can(permission)) return null

  return <>{children}</>
}
