"use client"

import { useState } from "react"
import {
  type ColumnDef, type ColumnFiltersState, type SortingState,
  type VisibilityState, flexRender, getCoreRowModel,
  getFilteredRowModel, getPaginationRowModel, getSortedRowModel, useReactTable,
} from "@tanstack/react-table"
import {
  ChevronDown, EllipsisVertical, Search, Shield, ShieldOff,
  Trash2, UserCog, ArrowUpDown, X, KeyRound, Copy, Check, Loader2,
} from "lucide-react"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import {
  DropdownMenu, DropdownMenuCheckboxItem, DropdownMenuContent,
  DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select"
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table"
import { cn } from "@/lib/utils"
import { toast } from "sonner"
import type { UserRow, CustomRole } from "../page"

interface DataTableProps {
  users: UserRow[]
  roles: CustomRole[]
  onToggleStatus: (user: UserRow) => void
  onDeleteUser: (id: number) => void
  onAssignRole: (userId: number, roleId: number | null) => void
}

const STATUS_STYLES: Record<string, string> = {
  active:               "bg-green-100 text-green-700 dark:bg-green-950/30 dark:text-green-400",
  suspended:            "bg-red-100 text-red-700 dark:bg-red-950/30 dark:text-red-400",
  pending_verification: "bg-amber-100 text-amber-700 dark:bg-amber-950/30 dark:text-amber-400",
}

const ROLE_STYLES: Record<string, string> = {
  STUDENT:     "bg-blue-100 text-blue-700 dark:bg-blue-950/30 dark:text-blue-400",
  TUTOR:       "bg-violet-100 text-violet-700 dark:bg-violet-950/30 dark:text-violet-400",
  ADMIN:       "bg-rose-100 text-rose-700 dark:bg-rose-950/30 dark:text-rose-400",
  SUPER_ADMIN: "bg-orange-100 text-orange-700 dark:bg-orange-950/30 dark:text-orange-400",
  MODERATOR:   "bg-teal-100 text-teal-700 dark:bg-teal-950/30 dark:text-teal-400",
}

const TIER_STYLES: Record<string, string> = {
  BASIC:   "bg-muted text-muted-foreground",
  PRO:     "bg-primary/10 text-primary",
  PREMIUM: "bg-amber-100 text-amber-700 dark:bg-amber-950/30 dark:text-amber-400",
}

function statusLabel(s: string) {
  if (s === "active") return "Active"
  if (s === "suspended") return "Suspended"
  return "Pending"
}

function AssignRoleDialog({
  user, roles, open, onOpenChange, onAssign,
}: {
  user: UserRow | null
  roles: CustomRole[]
  open: boolean
  onOpenChange: (v: boolean) => void
  onAssign: (userId: number, roleId: number | null) => void
}) {
  const [selected, setSelected] = useState<string>(
    user?.customRoleId ? String(user.customRoleId) : "none"
  )
  if (!user) return null

  const handleSave = () => {
    onAssign(user.id, selected === "none" ? null : Number(selected))
    onOpenChange(false)
  }

  const selectedRole = roles.find(r => r.id === Number(selected))
  const permList = selectedRole
    ? (() => { try { return (JSON.parse(selectedRole.permissions) as string[]).map(p => p.replace(/_/g, " ")).join(", ") } catch { return "—" } })()
    : null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>Assign Custom Role</DialogTitle>
          <DialogDescription>
            Control what <strong>{user.name}</strong> can access in the admin panel.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div className="flex items-center gap-3 rounded-lg border px-3 py-2.5 bg-muted/30">
            <Avatar className="h-9 w-9">
              <AvatarFallback className="text-xs font-bold">{user.avatar}</AvatarFallback>
            </Avatar>
            <div>
              <p className="text-sm font-semibold">{user.name}</p>
              <p className="text-xs text-muted-foreground">{user.email}</p>
            </div>
          </div>
          <div className="space-y-1.5">
            <Label>Custom Role</Label>
            <Select value={selected} onValueChange={setSelected}>
              <SelectTrigger>
                <SelectValue placeholder="Select a role" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">
                  <span className="text-muted-foreground">No custom role</span>
                </SelectItem>
                {roles.map(r => (
                  <SelectItem key={r.id} value={String(r.id)}>{r.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            {permList && (
              <p className="text-xs text-muted-foreground">
                Permissions: {permList}
              </p>
            )}
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={handleSave}>Save</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

// ── Reset Password Dialog ─────────────────────────────────────
function ResetPasswordDialog({
  user, open, onOpenChange,
}: {
  user: UserRow | null
  open: boolean
  onOpenChange: (v: boolean) => void
}) {
  const [loading, setLoading]   = useState(false)
  const [result, setResult]     = useState<{ newPassword: string } | null>(null)
  const [copied, setCopied]     = useState(false)

  const handleReset = async () => {
    if (!user) return
    setLoading(true)
    try {
      const { useAuthStore } = await import("@/lib/store/useAuthStore")
      const token = useAuthStore.getState().accessToken
      const API = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:5000/api/v1"
      const res = await fetch(`${API}/users/${user.id}/reset-password`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.message)
      setResult({ newPassword: data.data.newPassword })
    } catch (err: any) {
      toast.error(err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleCopy = () => {
    if (!result || !user) return
    navigator.clipboard.writeText(`Email: ${user.email}\nPassword: ${result.newPassword}`)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleClose = () => {
    setResult(null)
    setCopied(false)
    onOpenChange(false)
  }

  if (!user) return null

  return (
    <Dialog open={open} onOpenChange={v => { if (!v) handleClose() }}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <KeyRound className="size-4" /> Reset Password
          </DialogTitle>
          <DialogDescription>
            Generate a new temporary password for <strong>{user.name}</strong>.
            Share it with them securely.
          </DialogDescription>
        </DialogHeader>

        {!result ? (
          <>
            <div className="flex items-center gap-3 rounded-lg border px-3 py-2.5 bg-muted/30 text-sm">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary text-xs font-bold">
                {user.avatar}
              </div>
              <div>
                <p className="font-semibold">{user.name}</p>
                <p className="text-xs text-muted-foreground">{user.email}</p>
              </div>
            </div>
            <p className="text-xs text-muted-foreground">
              The current password will be immediately invalidated. The new temporary password will be shown once.
            </p>
            <DialogFooter>
              <Button variant="outline" onClick={handleClose}>Cancel</Button>
              <Button onClick={handleReset} disabled={loading} className="gap-2">
                {loading ? <Loader2 className="size-4 animate-spin" /> : <KeyRound className="size-4" />}
                {loading ? "Resetting…" : "Reset Password"}
              </Button>
            </DialogFooter>
          </>
        ) : (
          <>
            <div className="rounded-lg border bg-muted/30 p-4 space-y-2 font-mono text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground text-xs">Email</span>
                <span>{user.email}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground text-xs">New Password</span>
                <span className="font-bold">{result.newPassword}</span>
              </div>
            </div>
            <Button variant="outline" className="w-full gap-2" onClick={handleCopy}>
              {copied ? <><Check className="size-4 text-green-600" /> Copied!</> : <><Copy className="size-4" /> Copy Credentials</>}
            </Button>
            <p className="text-xs text-amber-600 dark:text-amber-400 text-center">
              This password will not be shown again.
            </p>
            <DialogFooter>
              <Button className="w-full" onClick={handleClose}>Done</Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  )
}

export function DataTable({ users, roles, onToggleStatus, onDeleteUser, onAssignRole }: DataTableProps) {
  const [sorting, setSorting]                   = useState<SortingState>([])
  const [columnFilters, setColumnFilters]       = useState<ColumnFiltersState>([])
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({})
  const [rowSelection, setRowSelection]         = useState({})
  const [globalFilter, setGlobalFilter]         = useState("")
  const [assignTarget, setAssignTarget]         = useState<UserRow | null>(null)
  const [assignOpen, setAssignOpen]             = useState(false)
  const [resetTarget, setResetTarget]           = useState<UserRow | null>(null)
  const [resetOpen, setResetOpen]               = useState(false)

  const openAssign = (user: UserRow) => { setAssignTarget(user); setAssignOpen(true) }
  const openReset  = (user: UserRow) => { setResetTarget(user);  setResetOpen(true)  }

  const setFilter = (id: string, value: string) => {
    setColumnFilters(prev => {
      const without = prev.filter(f => f.id !== id)
      return value ? [...without, { id, value }] : without
    })
  }

  const roleFilter   = (columnFilters.find(f => f.id === "role")?.value   as string) ?? ""
  const statusFilter = (columnFilters.find(f => f.id === "status")?.value as string) ?? ""

  const columns: ColumnDef<UserRow>[] = [
    {
      id: "select",
      header: ({ table }) => (
        <Checkbox
          checked={table.getIsAllPageRowsSelected() || (table.getIsSomePageRowsSelected() && "indeterminate")}
          onCheckedChange={v => table.toggleAllPageRowsSelected(!!v)}
          aria-label="Select all"
        />
      ),
      cell: ({ row }) => (
        <Checkbox
          checked={row.getIsSelected()}
          onCheckedChange={v => row.toggleSelected(!!v)}
          aria-label="Select row"
        />
      ),
      enableSorting: false,
      enableHiding: false,
    },
    {
      accessorKey: "name",
      header: ({ column }) => (
        <Button variant="ghost" size="sm" className="-ml-3 h-8"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}>
          User <ArrowUpDown className="ml-2 size-3.5" />
        </Button>
      ),
      cell: ({ row }) => {
        const u = row.original
        return (
          <div className="flex items-center gap-3 min-w-0">
            <Avatar className="h-9 w-9 shrink-0">
              <AvatarFallback className="text-xs font-bold bg-primary/10 text-primary">
                {u.avatar}
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0">
              <p className="font-semibold text-sm truncate">{u.name}</p>
              <p className="text-xs text-muted-foreground truncate">{u.email}</p>
            </div>
          </div>
        )
      },
    },
    {
      accessorKey: "role",
      header: "Role",
      cell: ({ row }) => {
        const role = row.getValue("role") as string
        return (
          <Badge variant="secondary" className={cn("text-xs capitalize", ROLE_STYLES[role] ?? "")}>
            {role.replace("_", " ").toLowerCase()}
          </Badge>
        )
      },
    },
    {
      accessorKey: "tier",
      header: "Plan",
      cell: ({ row }) => {
        const tier = row.getValue("tier") as string
        return (
          <Badge variant="secondary" className={cn("text-xs", TIER_STYLES[tier] ?? "")}>
            {tier.charAt(0) + tier.slice(1).toLowerCase()}
          </Badge>
        )
      },
    },
    {
      id: "customRole",
      header: "Custom Role",
      cell: ({ row }) => {
        const u = row.original
        if (!u.customRoleName) return <span className="text-xs text-muted-foreground">—</span>
        return (
          <Badge variant="outline" className="text-xs gap-1">
            <Shield className="size-3" />
            {u.customRoleName}
          </Badge>
        )
      },
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => {
        const status = row.getValue("status") as string
        return (
          <Badge variant="secondary" className={cn("text-xs", STATUS_STYLES[status] ?? "")}>
            {statusLabel(status)}
          </Badge>
        )
      },
    },
    {
      accessorKey: "joinedDate",
      header: "Joined",
      cell: ({ row }) => (
        <span className="text-xs text-muted-foreground">{row.getValue("joinedDate")}</span>
      ),
    },
    {
      id: "actions",
      header: "",
      cell: ({ row }) => {
        const u = row.original
        const isSuspended = u.status === "suspended"
        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <EllipsisVertical className="size-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuLabel className="text-xs text-muted-foreground font-normal">
                {u.name}
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="cursor-pointer gap-2" onClick={() => openAssign(u)}>
                <UserCog className="size-4" /> Assign Role
              </DropdownMenuItem>
              <DropdownMenuItem className="cursor-pointer gap-2" onClick={() => onToggleStatus(u)}>
                {isSuspended
                  ? <><Shield className="size-4 text-green-600" /> Reactivate</>
                  : <><ShieldOff className="size-4 text-amber-600" /> Suspend</>}
              </DropdownMenuItem>
              {u.role === "MODERATOR" && (
                <DropdownMenuItem className="cursor-pointer gap-2" onClick={() => openReset(u)}>
                  <KeyRound className="size-4" /> Reset Password
                </DropdownMenuItem>
              )}
              <DropdownMenuSeparator />
              <DropdownMenuItem
                className="cursor-pointer gap-2 text-destructive focus:text-destructive"
                onClick={() => { if (confirm(`Delete ${u.name}? This cannot be undone.`)) onDeleteUser(u.id) }}
              >
                <Trash2 className="size-4" /> Delete User
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )
      },
    },
  ]

  const table = useReactTable({
    data: users,
    columns,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    onColumnVisibilityChange: setColumnVisibility,
    onRowSelectionChange: setRowSelection,
    onGlobalFilterChange: setGlobalFilter,
    state: { sorting, columnFilters, columnVisibility, rowSelection, globalFilter },
    initialState: { pagination: { pageSize: 10 } },
  })

  return (
    <>
      <div className="w-full space-y-4">
        {/* Toolbar */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative max-w-sm flex-1">
            <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search by name or email…"
              value={globalFilter}
              onChange={e => setGlobalFilter(e.target.value)}
              className="pl-9"
            />
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <Select value={roleFilter || "all"} onValueChange={v => setFilter("role", v === "all" ? "" : v)}>
              <SelectTrigger className="w-36 h-9">
                <SelectValue placeholder="All Roles" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Roles</SelectItem>
                <SelectItem value="STUDENT">Student</SelectItem>
                <SelectItem value="TUTOR">Tutor</SelectItem>
                <SelectItem value="ADMIN">Admin</SelectItem>
                <SelectItem value="MODERATOR">Moderator</SelectItem>
              </SelectContent>
            </Select>
            <Select value={statusFilter || "all"} onValueChange={v => setFilter("status", v === "all" ? "" : v)}>
              <SelectTrigger className="w-36 h-9">
                <SelectValue placeholder="All Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="suspended">Suspended</SelectItem>
                <SelectItem value="pending_verification">Pending</SelectItem>
              </SelectContent>
            </Select>
            {(roleFilter || statusFilter || globalFilter) && (
              <Button variant="ghost" size="sm" className="h-9 gap-1.5 text-muted-foreground"
                onClick={() => { setColumnFilters([]); setGlobalFilter("") }}>
                <X className="size-3.5" /> Clear
              </Button>
            )}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="h-9 gap-1.5">
                  Columns <ChevronDown className="size-3.5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {table.getAllColumns().filter(c => c.getCanHide()).map(c => (
                  <DropdownMenuCheckboxItem key={c.id} className="capitalize"
                    checked={c.getIsVisible()} onCheckedChange={v => c.toggleVisibility(!!v)}>
                    {c.id}
                  </DropdownMenuCheckboxItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {/* Table */}
        <div className="rounded-lg border overflow-hidden">
          <Table>
            <TableHeader className="bg-muted/40">
              {table.getHeaderGroups().map(hg => (
                <TableRow key={hg.id}>
                  {hg.headers.map(h => (
                    <TableHead key={h.id} className="text-xs font-semibold">
                      {h.isPlaceholder ? null : flexRender(h.column.columnDef.header, h.getContext())}
                    </TableHead>
                  ))}
                </TableRow>
              ))}
            </TableHeader>
            <TableBody>
              {table.getRowModel().rows.length ? (
                table.getRowModel().rows.map(row => (
                  <TableRow key={row.id} data-state={row.getIsSelected() && "selected"}
                    className="hover:bg-muted/30 transition-colors">
                    {row.getVisibleCells().map(cell => (
                      <TableCell key={cell.id}>
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={columns.length} className="h-32 text-center text-muted-foreground text-sm">
                    No users found.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>

        {/* Pagination */}
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            {table.getFilteredSelectedRowModel().rows.length > 0
              ? `${table.getFilteredSelectedRowModel().rows.length} of `
              : ""}
            {table.getFilteredRowModel().rows.length} user(s)
          </p>
          <div className="flex items-center gap-2">
            <Select value={String(table.getState().pagination.pageSize)}
              onValueChange={v => table.setPageSize(Number(v))}>
              <SelectTrigger className="w-24 h-8">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {[10, 20, 50].map(n => (
                  <SelectItem key={n} value={String(n)}>{n} / page</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button variant="outline" size="sm" onClick={() => table.previousPage()} disabled={!table.getCanPreviousPage()}>
              Previous
            </Button>
            <span className="text-sm text-muted-foreground">
              {table.getState().pagination.pageIndex + 1} / {table.getPageCount()}
            </span>
            <Button variant="outline" size="sm" onClick={() => table.nextPage()} disabled={!table.getCanNextPage()}>
              Next
            </Button>
          </div>
        </div>
      </div>

      <AssignRoleDialog
        user={assignTarget}
        roles={roles}
        open={assignOpen}
        onOpenChange={setAssignOpen}
        onAssign={onAssignRole}
      />
      <ResetPasswordDialog
        user={resetTarget}
        open={resetOpen}
        onOpenChange={setResetOpen}
      />
    </>
  )
}
