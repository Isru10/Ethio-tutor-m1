"use client"

import { useEffect, useState, useCallback } from "react"
import { useAuthStore } from "@/lib/store/useAuthStore"
import { API_BASE } from "@/lib/api"
import { DataTable } from "./components/data-table"
import { CreateStaffDialog } from "./components/create-staff-dialog"
import { Skeleton } from "@/components/ui/skeleton"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Users, UserCheck, BookOpen, GraduationCap, TrendingUp, TrendingDown } from "lucide-react"
import { cn } from "@/lib/utils"
import { toast } from "sonner"

export interface UserRow {
  id: number
  name: string
  email: string
  avatar: string
  role: string           // STUDENT | TUTOR | ADMIN | MODERATOR | SUPER_ADMIN
  tier: string           // BASIC | PRO | PREMIUM
  status: string         // active | suspended | pending_verification
  joinedDate: string
  customRoleId: number | null
  customRoleName: string | null
}

export interface CustomRole {
  id: number
  name: string
  permissions: string
}

function authHeaders() {
  return {
    Authorization: `Bearer ${useAuthStore.getState().accessToken}`,
    "Content-Type": "application/json",
  }
}

function mapApiUser(u: any): UserRow {
  return {
    id:             u.user_id,
    name:           u.name,
    email:          u.email,
    avatar:         u.name.split(" ").map((n: string) => n[0]).join("").toUpperCase().slice(0, 2),
    role:           u.role,
    tier:           u.tier,
    status:         u.status,
    joinedDate:     u.created_at?.split("T")[0] ?? "",
    customRoleId:   u.customRole?.id ?? null,
    customRoleName: u.customRole?.name ?? null,
  }
}

export default function UsersPage() {
  const { user: authUser } = useAuthStore()
  const [users, setUsers]       = useState<UserRow[]>([])
  const [roles, setRoles]       = useState<CustomRole[]>([])
  const [loading, setLoading]   = useState(true)

  const load = useCallback(async () => {
    try {
      const [usersRes, rolesRes] = await Promise.all([
        fetch(`${API_BASE}/users`, { headers: authHeaders() }).then(r => r.json()),
        fetch(`${API_BASE}/roles`, { headers: authHeaders() }).then(r => r.json()),
      ])
      setUsers((usersRes.data ?? []).map(mapApiUser))
      setRoles(rolesRes.data ?? [])
    } catch {
      toast.error("Failed to load users")
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { if (authUser) load() }, [authUser, load])

  // ── Actions ──────────────────────────────────────────────────

  const handleToggleStatus = async (user: UserRow) => {
    const isSuspended = user.status === "suspended"
    try {
      if (isSuspended) {
        // Reactivate — update status directly
        const res = await fetch(`${API_BASE}/users/${user.id}`, {
          method: "PATCH",
          headers: authHeaders(),
          body: JSON.stringify({ status: "active" }),
        })
        if (!res.ok) { const d = await res.json(); throw new Error(d.message) }
        toast.success(`${user.name} reactivated`)
        setUsers(prev => prev.map(u => u.id === user.id ? { ...u, status: "active" } : u))
      } else {
        const res = await fetch(`${API_BASE}/users/${user.id}/suspend`, {
          method: "PATCH",
          headers: authHeaders(),
        })
        if (!res.ok) { const d = await res.json(); throw new Error(d.message) }
        toast.success(`${user.name} suspended`)
        setUsers(prev => prev.map(u => u.id === user.id ? { ...u, status: "suspended" } : u))
      }
    } catch (err: any) { toast.error(err.message) }
  }

  const handleDelete = async (id: number) => {
    try {
      const res = await fetch(`${API_BASE}/users/${id}`, {
        method: "DELETE",
        headers: authHeaders(),
      })
      if (!res.ok) { const d = await res.json(); throw new Error(d.message) }
      toast.success("User deleted")
      setUsers(prev => prev.filter(u => u.id !== id))
    } catch (err: any) { toast.error(err.message) }
  }

  const handleAssignRole = async (userId: number, roleId: number | null) => {
    try {
      const res = await fetch(`${API_BASE}/roles/assign/${userId}`, {
        method: "PATCH",
        headers: authHeaders(),
        body: JSON.stringify({ roleId }),
      })
      if (!res.ok) { const d = await res.json(); throw new Error(d.message) }
      const roleName = roleId ? roles.find(r => r.id === roleId)?.name ?? null : null
      toast.success(roleId ? `Role "${roleName}" assigned` : "Custom role removed")
      setUsers(prev => prev.map(u =>
        u.id === userId ? { ...u, customRoleId: roleId, customRoleName: roleName } : u
      ))
    } catch (err: any) { toast.error(err.message) }
  }

  // ── Stats ─────────────────────────────────────────────────────
  const stats = {
    total:    users.length,
    active:   users.filter(u => u.status === "active").length,
    tutors:   users.filter(u => u.role === "TUTOR").length,
    students: users.filter(u => u.role === "STUDENT").length,
  }

  const statCards = [
    { title: "Total Users",   value: stats.total,    icon: Users,          growth: null },
    { title: "Active",        value: stats.active,   icon: UserCheck,      growth: stats.total > 0 ? Math.round((stats.active / stats.total) * 100) : 0 },
    { title: "Tutors",        value: stats.tutors,   icon: BookOpen,       growth: null },
    { title: "Students",      value: stats.students, icon: GraduationCap,  growth: null },
  ]

  return (
    <div className="flex flex-col gap-6 px-4 lg:px-6">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Users</h1>
          <p className="text-muted-foreground text-sm">
            Manage all platform users — assign roles, suspend accounts, and control access.
          </p>
        </div>
        <CreateStaffDialog roles={roles} onCreated={load} />
      </div>

      {/* Stat cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {statCards.map((s) => (
          <Card key={s.title} className="border">
            <CardContent className="space-y-4 pt-6">
              <div className="flex items-center justify-between">
                <s.icon className="text-muted-foreground size-6" />
                {s.growth !== null && (
                  <Badge variant="outline" className={cn(
                    s.growth >= 50
                      ? "border-green-200 bg-green-50 text-green-700 dark:border-green-800 dark:bg-green-950/20 dark:text-green-400"
                      : "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-800 dark:bg-amber-950/20 dark:text-amber-400"
                  )}>
                    {s.growth >= 50
                      ? <TrendingUp className="me-1 size-3" />
                      : <TrendingDown className="me-1 size-3" />}
                    {s.growth}% active
                  </Badge>
                )}
              </div>
              <div className="space-y-1">
                <p className="text-muted-foreground text-sm font-medium">{s.title}</p>
                <div className="text-2xl font-bold">{loading ? "–" : s.value}</div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Table */}
      {loading ? (
        <div className="space-y-2">
          {Array.from({ length: 8 }).map((_, i) => (
            <Skeleton key={i} className="h-12 rounded" />
          ))}
        </div>
      ) : (
        <DataTable
          users={users}
          roles={roles}
          onToggleStatus={handleToggleStatus}
          onDeleteUser={handleDelete}
          onAssignRole={handleAssignRole}
        />
      )}
    </div>
  )
}
