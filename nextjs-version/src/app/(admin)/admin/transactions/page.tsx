"use client"

import { useEffect, useState, useMemo } from "react"
import { ArrowUp, Wallet, CheckCircle2, Clock, TrendingDown } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table"
import {
  useReactTable, getCoreRowModel, getSortedRowModel,
  getFilteredRowModel, getPaginationRowModel,
  flexRender, type SortingState, type ColumnFiltersState, type ColumnDef,
} from "@tanstack/react-table"
import { useAuthStore } from "@/lib/store/useAuthStore"
import { API_BASE } from "@/lib/api"
import { cn } from "@/lib/utils"

interface TxRow {
  transaction_id: number
  date: string
  subject: string
  teacher_name: string
  amount: number
  commission: number
  teacher_earnings: number
  status: string
}

const statusConfig = {
  paid:    { label: "Paid",    class: "border-green-400 bg-green-50 text-green-700 dark:bg-green-950/30 dark:text-green-400" },
  pending: { label: "Pending", class: "border-amber-400 bg-amber-50 text-amber-700 dark:bg-amber-950/30 dark:text-amber-400" },
  failed:  { label: "Failed",  class: "border-rose-400  bg-rose-50  text-rose-700  dark:bg-rose-950/30  dark:text-rose-400"  },
}

export default function TransactionsPage() {
  const { user } = useAuthStore()
  const [rows, setRows] = useState<TxRow[]>([])
  const [loading, setLoading] = useState(true)
  const [sorting, setSorting] = useState<SortingState>([])
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([])
  const [globalFilter, setGlobalFilter] = useState("")

  useEffect(() => {
    if (!user) return
    fetch(`${API_BASE}/transactions/admin/all`, {
      headers: { Authorization: `Bearer ${useAuthStore.getState().accessToken}` },
    })
      .then(r => r.json())
      .then(res => {
        const data: any[] = res.data ?? []
        setRows(data.map(tx => ({
          transaction_id:   tx.transaction_id,
          date:             tx.created_at?.split("T")[0] ?? "",
          subject:          tx.booking?.slot?.subject?.name ?? "Session",
          teacher_name:     tx.teacher?.user?.name ?? "Tutor",
          amount:           Number(tx.total_amount ?? 0),
          commission:       Number(tx.platform_commission ?? 0),
          teacher_earnings: Number(tx.teacher_earnings ?? 0),
          status:           tx.payment_status ?? "pending",
        })))
      })
      .finally(() => setLoading(false))
  }, [user])

  const totalSpent = useMemo(() => rows.reduce((acc, r) => acc + (r.status === "paid" ? r.amount : 0), 0), [rows])
  const stats = {
    total:   rows.length,
    paid:    rows.filter((r) => r.status === "paid").length,
    pending: rows.filter((r) => r.status === "pending").length,
  }

  const columns: ColumnDef<TxRow>[] = [
    {
      accessorKey: "transaction_id",
      header: "ID",
      cell: ({ row }) => <span className="font-mono text-xs text-muted-foreground">#{row.getValue("transaction_id")}</span>,
    },
    {
      accessorKey: "date",
      header: "Date",
      cell: ({ row }) => <span className="text-sm">{row.getValue("date")}</span>,
    },
    {
      accessorKey: "subject",
      header: "Subject",
      cell: ({ row }) => <Badge variant="default" className="text-xs">{row.getValue("subject")}</Badge>,
    },
    {
      accessorKey: "teacher_name",
      header: "Teacher",
      cell: ({ row }) => <span className="font-medium text-sm">{row.getValue("teacher_name")}</span>,
    },
    {
      accessorKey: "amount",
      header: "Amount",
      cell: ({ row }) => (
        <span className="font-semibold text-sm">{(row.getValue("amount") as number).toLocaleString()} ETB</span>
      ),
    },
    {
      accessorKey: "commission",
      header: "Platform Fee",
      cell: ({ row }) => (
        <span className="text-xs text-muted-foreground">{(row.getValue("commission") as number).toLocaleString()} ETB</span>
      ),
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => {
        const s = row.getValue("status") as keyof typeof statusConfig
        const cfg = statusConfig[s] ?? statusConfig.failed
        return <Badge variant="outline" className={cn("text-xs font-medium", cfg.class)}>{cfg.label}</Badge>
      },
    },
  ]

  const table = useReactTable({
    data: rows,
    columns,
    state: { sorting, columnFilters, globalFilter },
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onGlobalFilterChange: setGlobalFilter,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    initialState: { pagination: { pageSize: 10 } },
  })

  return (
    <>
      <div className="px-4 lg:px-6">
        <h1 className="text-2xl font-bold tracking-tight">Payments</h1>
        <p className="text-muted-foreground text-sm">Your full payment history for all sessions.</p>
      </div>

      {/* Stat cards */}
      <div className="px-4 lg:px-6 grid gap-4 grid-cols-2 md:grid-cols-4">
        {[
          { label: "Total Spent",   value: `${totalSpent.toLocaleString()} ETB`, icon: Wallet,      color: "text-amber-500", suffix: "" },
          { label: "Transactions",  value: stats.total,                           icon: CheckCircle2, color: "text-foreground", suffix: "" },
          { label: "Paid",          value: stats.paid,                            icon: CheckCircle2, color: "text-green-500",  suffix: "" },
          { label: "Pending",       value: stats.pending,                         icon: Clock,        color: "text-amber-500",  suffix: "" },
        ].map(({ label, value, icon: Icon, color }) => (
          <Card key={label}>
            <CardContent>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-muted-foreground text-sm font-medium">{label}</p>
                  <div className="mt-1">
                    <span className="text-2xl font-bold">{loading ? "–" : value}</span>
                  </div>
                </div>
                <div className="bg-secondary rounded-lg p-3">
                  <Icon className={`size-5 ${color}`} />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Table */}
      <div className="px-4 lg:px-6">
        <Card>
          <CardHeader>
            <CardTitle>Transaction History</CardTitle>
            <CardDescription>All payments made for your tutoring sessions.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Toolbar */}
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <Input
                placeholder="Search teacher or subject…"
                value={globalFilter}
                onChange={(e) => setGlobalFilter(e.target.value)}
                className="h-8 max-w-xs"
              />
              <div className="flex gap-1.5">
                {(["paid", "pending"] as const).map((s) => {
                  const active = columnFilters.some(
                    (f) => f.id === "status" && (f.value as string[]).includes(s)
                  )
                  return (
                    <Badge
                      key={s} variant={active ? "default" : "outline"}
                      className="cursor-pointer capitalize text-xs"
                      onClick={() => {
                        const existing = (columnFilters.find((f) => f.id === "status")?.value as string[] | undefined) ?? []
                        const next = active ? existing.filter((v) => v !== s) : [...existing, s]
                        setColumnFilters(
                          next.length
                            ? [{ id: "status", value: next }]
                            : columnFilters.filter((f) => f.id !== "status")
                        )
                      }}
                    >
                      {s}
                    </Badge>
                  )
                })}
              </div>
            </div>

            {loading ? (
              <div className="space-y-2">
                {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-10 w-full rounded" />)}
              </div>
            ) : (
              <div className="rounded-md border overflow-auto">
                <Table>
                  <TableHeader>
                    {table.getHeaderGroups().map((hg) => (
                      <TableRow key={hg.id}>
                        {hg.headers.map((h) => (
                          <TableHead key={h.id}>{h.isPlaceholder ? null : flexRender(h.column.columnDef.header, h.getContext())}</TableHead>
                        ))}
                      </TableRow>
                    ))}
                  </TableHeader>
                  <TableBody>
                    {table.getRowModel().rows.length ? (
                      table.getRowModel().rows.map((row) => (
                        <TableRow key={row.id}>
                          {row.getVisibleCells().map((cell) => (
                            <TableCell key={cell.id}>{flexRender(cell.column.columnDef.cell, cell.getContext())}</TableCell>
                          ))}
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={columns.length} className="h-24 text-center text-muted-foreground text-sm">
                          No transactions found.
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            )}

            <div className="flex items-center justify-between text-sm text-muted-foreground">
              <span>{table.getFilteredRowModel().rows.length} transaction(s)</span>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={() => table.previousPage()} disabled={!table.getCanPreviousPage()}>Previous</Button>
                <Button variant="outline" size="sm" onClick={() => table.nextPage()} disabled={!table.getCanNextPage()}>Next</Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </>
  )
}
