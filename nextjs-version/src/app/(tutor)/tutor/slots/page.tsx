"use client"

import { useEffect, useState, useMemo } from "react"
import { Plus, CalendarDays, Users, Clock, Trash2, Loader2 } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from "@/components/ui/dialog"
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select"
import {
  useReactTable, getCoreRowModel, getSortedRowModel,
  getFilteredRowModel, getPaginationRowModel,
  flexRender, type SortingState, createColumnHelper,
} from "@tanstack/react-table"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { useAuthStore } from "@/store/authStore"
import { slotService, type CreateSlotPayload } from "@/lib/services/slotService"

type Slot = {
  slot_id: number;
  slot_date: string;
  start_time: string;
  end_time: string;
  grade_from: number;
  grade_to: number;
  max_students: number;
  remaining_seats: number;
  status: string;
  subject: { name: string };
  bookings: Array<{ status: string }>;
}

const defaultForm: Omit<CreateSlotPayload, "subject_id"> & { subject_id: string } = {
  subject_id: "",
  slot_date: "",
  start_time: "",
  end_time: "",
  grade_from: 1,
  grade_to: 12,
  max_students: 5,
}

export default function TutorSlotsPage() {
  const { user } = useAuthStore()
  const [rows, setRows] = useState<Slot[]>([])
  const [subjects, setSubjects] = useState<Array<{ subject_id: number; name: string }>>([])
  const [loading, setLoading] = useState(true)
  const [sorting, setSorting] = useState<SortingState>([])
  const [globalFilter, setGlobalFilter] = useState("")
  const [createOpen, setCreateOpen] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<Slot | null>(null)
  const [form, setForm] = useState(defaultForm)
  const [saving, setSaving] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)

  const fetchSlots = () =>
    slotService.getMySlots().then(setRows).catch(console.error)

  useEffect(() => {
    if (!user) return
    Promise.all([slotService.getSubjects(), slotService.getMySlots()])
      .then(([subs, slots]) => { setSubjects(subs); setRows(slots) })
      .finally(() => setLoading(false))
  }, [user])

  const stats = useMemo(() => ({
    total: rows.length,
    available: rows.filter(r => r.status === "available").length,
    full: rows.filter(r => r.status === "full").length,
    completed: rows.filter(r => r.status === "completed").length,
  }), [rows])

  const handleCreate = async () => {
    if (!form.subject_id || !form.slot_date || !form.start_time || !form.end_time) {
      setFormError("Please fill all required fields.")
      return
    }
    try {
      setSaving(true)
      setFormError(null)
      await slotService.createSlot({ ...form, subject_id: Number(form.subject_id) })
      await fetchSlots()
      setCreateOpen(false)
      setForm(defaultForm)
    } catch (err: any) {
      setFormError(err.message)
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (slotId: number) => {
    try {
      await slotService.deleteSlot(slotId)
      setRows(prev => prev.filter(r => r.slot_id !== slotId))
      setDeleteTarget(null)
    } catch (err: any) {
      alert(err.message)
    }
  }

  const col = createColumnHelper<Slot>()
  const columns = useMemo(() => [
    col.accessor(r => r.subject.name, { id: "subject", header: "Subject" }),
    col.accessor(r => new Date(r.slot_date).toLocaleDateString(), { id: "date", header: "Date" }),
    col.accessor(r => `${r.start_time} – ${r.end_time}`, { id: "time", header: "Time" }),
    col.accessor(r => `Grade ${r.grade_from}–${r.grade_to}`, { id: "grades", header: "Grades" }),
    col.accessor(r => `${r.remaining_seats}/${r.max_students}`, { id: "seats", header: "Seats" }),
    col.accessor("status", {
      header: "Status",
      cell: i => {
        const v = i.getValue()
        const cls = v === "available" ? "bg-green-100 text-green-700 dark:bg-green-950/30 dark:text-green-400"
          : v === "full" ? "bg-red-100 text-red-700"
          : "bg-muted text-muted-foreground"
        return <span className={`px-2 py-0.5 rounded-full text-xs font-semibold capitalize ${cls}`}>{v}</span>
      },
    }),
    col.display({
      id: "actions",
      header: "Actions",
      cell: i => (
        <Button size="sm" variant="ghost" className="h-7 gap-1 text-xs text-destructive hover:text-destructive"
          onClick={() => setDeleteTarget(i.row.original)}>
          <Trash2 className="size-3" /> Delete
        </Button>
      ),
    }),
  ], [])

  const table = useReactTable({
    data: rows, columns,
    state: { sorting, globalFilter },
    onSortingChange: setSorting,
    onGlobalFilterChange: setGlobalFilter,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    initialState: { pagination: { pageSize: 10 } },
  })

  return (
    <>
      <div className="px-4 lg:px-6 flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Manage Slots</h1>
          <p className="text-muted-foreground text-sm">Create teaching time slots so students can book you.</p>
        </div>
        <Button className="gap-2 shrink-0" onClick={() => setCreateOpen(true)}>
          <Plus className="size-4" /> New Slot
        </Button>
      </div>

      <div className="px-4 lg:px-6 grid gap-4 grid-cols-2 md:grid-cols-4">
        {[
          { label: "Total Slots",   value: stats.total,     icon: CalendarDays, color: "text-foreground" },
          { label: "Available",     value: stats.available, icon: Clock,        color: "text-green-500" },
          { label: "Full",          value: stats.full,      icon: Users,        color: "text-red-500" },
          { label: "Completed",     value: stats.completed, icon: CalendarDays, color: "text-muted-foreground" },
        ].map(({ label, value, icon: Icon, color }) => (
          <Card key={label}>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-muted-foreground text-sm font-medium">{label}</p>
                  <p className="text-2xl font-bold mt-1">{loading ? "–" : value}</p>
                </div>
                <div className="bg-secondary rounded-lg p-3">
                  <Icon className={`size-5 ${color}`} />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="px-4 lg:px-6">
        <Card>
          <CardHeader>
            <CardTitle>My Time Slots</CardTitle>
            <CardDescription>All your teaching slots and their booking status.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Input
              placeholder="Search subject or date…"
              value={globalFilter}
              onChange={e => setGlobalFilter(e.target.value)}
              className="h-8 max-w-xs"
            />
            {loading ? (
              <div className="space-y-2">{Array.from({ length: 8 }).map((_, i) => <Skeleton key={i} className="h-10 w-full rounded" />)}</div>
            ) : (
              <div className="rounded-md border overflow-auto">
                <Table>
                  <TableHeader>
                    {table.getHeaderGroups().map(hg => (
                      <TableRow key={hg.id}>
                        {hg.headers.map(h => <TableHead key={h.id}>{h.isPlaceholder ? null : flexRender(h.column.columnDef.header, h.getContext())}</TableHead>)}
                      </TableRow>
                    ))}
                  </TableHeader>
                  <TableBody>
                    {table.getRowModel().rows.length ? (
                      table.getRowModel().rows.map(row => (
                        <TableRow key={row.id}>
                          {row.getVisibleCells().map(cell => <TableCell key={cell.id}>{flexRender(cell.column.columnDef.cell, cell.getContext())}</TableCell>)}
                        </TableRow>
                      ))
                    ) : (
                      <TableRow><TableCell colSpan={columns.length} className="h-24 text-center text-muted-foreground text-sm">No slots yet. Click "New Slot" to create one.</TableCell></TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            )}
            <div className="flex items-center justify-between text-sm text-muted-foreground">
              <span>{table.getFilteredRowModel().rows.length} slot(s)</span>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={() => table.previousPage()} disabled={!table.getCanPreviousPage()}>Previous</Button>
                <Button variant="outline" size="sm" onClick={() => table.nextPage()} disabled={!table.getCanNextPage()}>Next</Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* ── Create Slot Dialog ── */}
      <Dialog open={createOpen} onOpenChange={open => { setCreateOpen(open); if (!open) { setForm(defaultForm); setFormError(null) } }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2"><Plus className="size-5 text-primary" /> Create New Slot</DialogTitle>
            <DialogDescription>Set up a teaching slot. Students will be able to find and book it.</DialogDescription>
          </DialogHeader>
          {formError && <p className="text-sm text-destructive bg-destructive/10 rounded px-3 py-2">{formError}</p>}
          <div className="space-y-3">
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">Subject *</Label>
              <Select value={form.subject_id} onValueChange={v => setForm(f => ({ ...f, subject_id: v }))}>
                <SelectTrigger><SelectValue placeholder="Select subject" /></SelectTrigger>
                <SelectContent>
                  {subjects.map(s => <SelectItem key={s.subject_id} value={String(s.subject_id)}>{s.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground">Grade From</Label>
                <Input type="number" min={1} max={12} value={form.grade_from} onChange={e => setForm(f => ({ ...f, grade_from: Number(e.target.value) }))} className="h-8" />
              </div>
              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground">Grade To</Label>
                <Input type="number" min={1} max={12} value={form.grade_to} onChange={e => setForm(f => ({ ...f, grade_to: Number(e.target.value) }))} className="h-8" />
              </div>
            </div>
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">Date *</Label>
              <Input type="date" value={form.slot_date} onChange={e => setForm(f => ({ ...f, slot_date: e.target.value }))} className="h-8" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground">Start Time *</Label>
                <Input type="time" value={form.start_time} onChange={e => setForm(f => ({ ...f, start_time: e.target.value }))} className="h-8" />
              </div>
              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground">End Time *</Label>
                <Input type="time" value={form.end_time} onChange={e => setForm(f => ({ ...f, end_time: e.target.value }))} className="h-8" />
              </div>
            </div>
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">Max Students</Label>
              <Input type="number" min={1} max={10} value={form.max_students} onChange={e => setForm(f => ({ ...f, max_students: Number(e.target.value) }))} className="h-8" />
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setCreateOpen(false)} disabled={saving}>Cancel</Button>
            <Button onClick={handleCreate} disabled={saving}>
              {saving ? <Loader2 className="size-4 animate-spin mr-1" /> : null}
              Create Slot
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Delete Confirm Dialog ── */}
      <Dialog open={!!deleteTarget} onOpenChange={() => setDeleteTarget(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Delete Slot</DialogTitle>
            <DialogDescription>
              This will permanently delete the <strong>{deleteTarget?.subject.name}</strong> slot on {deleteTarget ? new Date(deleteTarget.slot_date).toLocaleDateString() : ""}. Cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteTarget(null)}>Cancel</Button>
            <Button variant="destructive" onClick={() => deleteTarget && handleDelete(deleteTarget.slot_id)}>Delete</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
