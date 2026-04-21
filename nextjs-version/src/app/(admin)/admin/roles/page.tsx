"use client"

import { useEffect, useState, useCallback } from "react"
import { useAuthStore } from "@/lib/store/useAuthStore"
import { API_BASE } from "@/lib/api"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { Skeleton } from "@/components/ui/skeleton"
import { Separator } from "@/components/ui/separator"
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog"
import { Trash2, Pencil, Plus, Users, ShieldCheck } from "lucide-react"
import { toast } from "sonner"
import { useRouter } from "next/navigation"

const ALL_PERMISSIONS = [
  { key: "view_dashboard",    label: "View Dashboard",    group: "General" },
  { key: "view_users",        label: "View Users",        group: "Users" },
  { key: "view_tutors",       label: "View Tutors",       group: "Tutors" },
  { key: "verify_tutors",     label: "Verify Tutors",     group: "Tutors" },
  { key: "view_bookings",     label: "View Bookings",     group: "Bookings" },
  { key: "view_sessions",     label: "View Sessions",     group: "Sessions" },
  { key: "view_transactions", label: "View Transactions", group: "Finance" },
  { key: "view_payouts",      label: "View Payouts",      group: "Finance" },
  { key: "manage_disputes",   label: "Manage Disputes",   group: "Finance" },
  { key: "view_reports",      label: "View Reports",      group: "General" },
]

const GROUPS = [...new Set(ALL_PERMISSIONS.map(p => p.group))]

function authHeaders() {
  return { Authorization: `Bearer ${useAuthStore.getState().accessToken}`, "Content-Type": "application/json" }
}

interface CustomRole {
  id: number
  name: string
  description?: string
  permissions: string   // JSON string
  _count: { users: number }
}

const emptyForm = { name: "", description: "", permissions: [] as string[] }

export default function RolesPage() {
  const { user } = useAuthStore()
  const router   = useRouter()

  // Hard block — only ADMIN and SUPER_ADMIN can access this page
  useEffect(() => {
    if (user && user.role !== "ADMIN" && user.role !== "SUPER_ADMIN") {
      router.replace("/admin/admin-dashboard")
    }
  }, [user, router])
  const [roles, setRoles] = useState<CustomRole[]>([])
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editing, setEditing] = useState<CustomRole | null>(null)
  const [form, setForm] = useState(emptyForm)
  const [saving, setSaving] = useState(false)

  const load = useCallback(async () => {
    const res = await fetch(`${API_BASE}/roles`, { headers: authHeaders() })
    const data = await res.json()
    setRoles(data.data ?? [])
    setLoading(false)
  }, [])

  useEffect(() => { if (user) load() }, [user, load])

  const openCreate = () => { setEditing(null); setForm(emptyForm); setDialogOpen(true) }
  const openEdit   = (r: CustomRole) => {
    setEditing(r)
    setForm({ name: r.name, description: r.description ?? "", permissions: JSON.parse(r.permissions) })
    setDialogOpen(true)
  }

  const togglePerm = (key: string) => {
    setForm(f => ({
      ...f,
      permissions: f.permissions.includes(key)
        ? f.permissions.filter(p => p !== key)
        : [...f.permissions, key],
    }))
  }

  const handleSave = async () => {
    if (!form.name.trim()) { toast.error("Role name is required"); return }
    if (form.permissions.length === 0) { toast.error("Select at least one permission"); return }
    setSaving(true)
    try {
      const url    = editing ? `${API_BASE}/roles/${editing.id}` : `${API_BASE}/roles`
      const method = editing ? "PATCH" : "POST"
      const res    = await fetch(url, { method, headers: authHeaders(), body: JSON.stringify(form) })
      const data   = await res.json()
      if (!res.ok) throw new Error(data.message)
      toast.success(editing ? "Role updated" : "Role created")
      setDialogOpen(false)
      load()
    } catch (err: any) { toast.error(err.message) }
    finally { setSaving(false) }
  }

  const handleDelete = async (id: number) => {
    if (!confirm("Delete this role? Users assigned to it will lose their custom permissions.")) return
    const res  = await fetch(`${API_BASE}/roles/${id}`, { method: "DELETE", headers: authHeaders() })
    const data = await res.json()
    if (!res.ok) { toast.error(data.message); return }
    toast.success("Role deleted")
    load()
  }

  return (
    <>
      <div className="px-4 lg:px-6 flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Custom Roles</h1>
          <p className="text-muted-foreground text-sm">
            Create roles with specific permissions and assign them to staff members.
          </p>
        </div>
        <Button className="gap-2" onClick={openCreate}>
          <Plus className="size-4" /> New Role
        </Button>
      </div>

      <div className="px-4 lg:px-6">
        {loading ? (
          <div className="space-y-3">
            {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-24 rounded-xl" />)}
          </div>
        ) : roles.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-16 gap-3">
              <ShieldCheck className="size-10 text-muted-foreground/30" />
              <p className="text-muted-foreground text-sm">No custom roles yet. Create one to get started.</p>
              <Button onClick={openCreate} variant="outline">Create First Role</Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {roles.map(role => {
              const perms: string[] = JSON.parse(role.permissions)
              return (
                <Card key={role.id} className="flex flex-col">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <CardTitle className="text-base">{role.name}</CardTitle>
                        {role.description && (
                          <CardDescription className="text-xs mt-0.5">{role.description}</CardDescription>
                        )}
                      </div>
                      <div className="flex gap-1 shrink-0">
                        <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => openEdit(role)}>
                          <Pencil className="size-3.5" />
                        </Button>
                        <Button size="icon" variant="ghost" className="h-7 w-7 text-destructive hover:text-destructive" onClick={() => handleDelete(role.id)}>
                          <Trash2 className="size-3.5" />
                        </Button>
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground mt-1">
                      <Users className="size-3.5" />
                      <span>{role._count.users} user{role._count.users !== 1 ? "s" : ""} assigned</span>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-0 flex flex-wrap gap-1">
                    {perms.map(p => (
                      <Badge key={p} variant="secondary" className="text-[10px]">
                        {ALL_PERMISSIONS.find(x => x.key === p)?.label ?? p}
                      </Badge>
                    ))}
                  </CardContent>
                </Card>
              )
            })}
          </div>
        )}
      </div>

      {/* Create / Edit dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editing ? "Edit Role" : "Create New Role"}</DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Role Name</label>
              <Input placeholder="e.g. Reviewer, Support, Finance" value={form.name}
                onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Description <span className="text-muted-foreground font-normal">(optional)</span></label>
              <Input placeholder="What does this role do?" value={form.description}
                onChange={e => setForm(f => ({ ...f, description: e.target.value }))} />
            </div>

            <Separator />

            <div className="space-y-3">
              <label className="text-sm font-medium">Permissions</label>
              {GROUPS.map(group => (
                <div key={group} className="space-y-2">
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">{group}</p>
                  <div className="grid grid-cols-2 gap-2">
                    {ALL_PERMISSIONS.filter(p => p.group === group).map(p => (
                      <div key={p.key} className="flex items-center gap-2 rounded-lg border px-3 py-2 cursor-pointer hover:bg-muted/40"
                        onClick={() => togglePerm(p.key)}>
                        <Checkbox checked={form.permissions.includes(p.key)} onCheckedChange={() => togglePerm(p.key)} />
                        <span className="text-sm">{p.label}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving ? "Saving…" : editing ? "Save Changes" : "Create Role"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
