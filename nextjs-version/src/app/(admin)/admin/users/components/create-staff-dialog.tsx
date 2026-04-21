"use client"

import { useState } from "react"
import { useAuthStore } from "@/lib/store/useAuthStore"
import { API_BASE } from "@/lib/api"
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
  DialogDescription, DialogFooter,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Eye, EyeOff, Copy, Check, UserPlus, RefreshCw } from "lucide-react"
import { toast } from "sonner"
import type { CustomRole } from "../page"

interface Props {
  roles: CustomRole[]
  onCreated: () => void
}

function generatePassword() {
  const chars = "ABCDEFGHJKMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789!@#"
  return Array.from({ length: 12 }, () => chars[Math.floor(Math.random() * chars.length)]).join("")
}

function authHeaders() {
  return {
    Authorization: `Bearer ${useAuthStore.getState().accessToken}`,
    "Content-Type": "application/json",
  }
}

export function CreateStaffDialog({ roles, onCreated }: Props) {
  const [open, setOpen]             = useState(false)
  const [saving, setSaving]         = useState(false)
  const [showPass, setShowPass]     = useState(false)
  const [copied, setCopied]         = useState(false)
  const [created, setCreated]       = useState<{ name: string; email: string; password: string; roleName: string | null } | null>(null)

  const [form, setForm] = useState({
    name:         "",
    email:        "",
    password:     generatePassword(),
    customRoleId: "",
  })

  const set = (k: keyof typeof form, v: string) => setForm(f => ({ ...f, [k]: v }))

  const handleCopy = () => {
    navigator.clipboard.writeText(
      `Email: ${created?.email}\nPassword: ${created?.password}`
    )
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleSubmit = async () => {
    if (!form.name.trim() || !form.email.trim() || !form.password.trim()) {
      toast.error("Name, email and password are required")
      return
    }
    setSaving(true)
    try {
      const body: any = {
        name:     form.name.trim(),
        email:    form.email.trim(),
        password: form.password,
      }
      if (form.customRoleId) body.customRoleId = Number(form.customRoleId)

      const res  = await fetch(`${API_BASE}/users/staff`, {
        method: "POST",
        headers: authHeaders(),
        body: JSON.stringify(body),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.message ?? "Failed to create staff account")

      const roleName = form.customRoleId
        ? roles.find(r => r.id === Number(form.customRoleId))?.name ?? null
        : null

      setCreated({ name: form.name, email: form.email, password: form.password, roleName })
      onCreated()
    } catch (err: any) {
      toast.error(err.message)
    } finally {
      setSaving(false)
    }
  }

  const handleClose = () => {
    setOpen(false)
    setCreated(null)
    setForm({ name: "", email: "", password: generatePassword(), customRoleId: "" })
    setShowPass(false)
  }

  const selectedRole = roles.find(r => r.id === Number(form.customRoleId))
  const permList = selectedRole
    ? (() => { try { return (JSON.parse(selectedRole.permissions) as string[]).map(p => p.replace(/_/g, " ")).join(", ") } catch { return "" } })()
    : null

  return (
    <>
      <Button className="gap-2" onClick={() => setOpen(true)}>
        <UserPlus className="size-4" /> Create Staff Account
      </Button>

      <Dialog open={open} onOpenChange={v => { if (!v) handleClose(); else setOpen(true) }}>
        <DialogContent className="max-w-md">
          {!created ? (
            <>
              <DialogHeader>
                <DialogTitle>Create Staff Account</DialogTitle>
                <DialogDescription>
                  Creates a <Badge variant="secondary" className="text-xs mx-1">Moderator</Badge>
                  account. Assign a custom role to control what they can access.
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4 py-2">
                <div className="space-y-1.5">
                  <Label>Full Name</Label>
                  <Input placeholder="e.g. Abebe Kebede" value={form.name}
                    onChange={e => set("name", e.target.value)} />
                </div>

                <div className="space-y-1.5">
                  <Label>Email Address</Label>
                  <Input type="email" placeholder="staff@ethiotutor.com" value={form.email}
                    onChange={e => set("email", e.target.value)} />
                </div>

                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <Label>Temporary Password</Label>
                    <Button type="button" variant="ghost" size="sm" className="h-6 text-xs gap-1 text-muted-foreground"
                      onClick={() => set("password", generatePassword())}>
                      <RefreshCw className="size-3" /> Regenerate
                    </Button>
                  </div>
                  <div className="relative">
                    <Input
                      type={showPass ? "text" : "password"}
                      value={form.password}
                      onChange={e => set("password", e.target.value)}
                      className="pr-10 font-mono"
                    />
                    <Button type="button" variant="ghost" size="icon"
                      className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7"
                      onClick={() => setShowPass(v => !v)}>
                      {showPass ? <EyeOff className="size-3.5" /> : <Eye className="size-3.5" />}
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Share this with the staff member. They should change it on first login.
                  </p>
                </div>

                <div className="space-y-1.5">
                  <Label>Custom Role <span className="text-muted-foreground font-normal">(optional)</span></Label>
                  <Select value={form.customRoleId} onValueChange={v => set("customRoleId", v)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a role…" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">No custom role</SelectItem>
                      {roles.map(r => (
                        <SelectItem key={r.id} value={String(r.id)}>{r.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {permList && (
                    <p className="text-xs text-muted-foreground">
                      Access: {permList}
                    </p>
                  )}
                </div>
              </div>

              <DialogFooter>
                <Button variant="outline" onClick={handleClose}>Cancel</Button>
                <Button onClick={handleSubmit} disabled={saving}>
                  {saving ? "Creating…" : "Create Account"}
                </Button>
              </DialogFooter>
            </>
          ) : (
            /* ── Success state ── */
            <>
              <DialogHeader>
                <DialogTitle>Account Created</DialogTitle>
                <DialogDescription>
                  Share these credentials with <strong>{created.name}</strong> securely.
                  They should change their password on first login.
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-3 py-2">
                <div className="rounded-lg border bg-muted/30 p-4 space-y-2 font-mono text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground text-xs">Email</span>
                    <span>{created.email}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground text-xs">Password</span>
                    <span>{created.password}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground text-xs">Role</span>
                    <span>{created.roleName ?? "Moderator (no custom role)"}</span>
                  </div>
                </div>

                <Button variant="outline" className="w-full gap-2" onClick={handleCopy}>
                  {copied ? <><Check className="size-4 text-green-600" /> Copied!</> : <><Copy className="size-4" /> Copy Credentials</>}
                </Button>

                <p className="text-xs text-amber-600 dark:text-amber-400 text-center">
                  This password will not be shown again. Copy it now.
                </p>
              </div>

              <DialogFooter>
                <Button className="w-full" onClick={handleClose}>Done</Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </>
  )
}
