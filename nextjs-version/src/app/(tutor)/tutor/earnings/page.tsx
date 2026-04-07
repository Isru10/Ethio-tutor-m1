"use client"

import { useEffect, useState, useMemo } from "react"
import { Banknote, TrendingUp, ArrowDownRight, Clock, CalendarDays } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { Badge } from "@/components/ui/badge"
import {
  useReactTable, getCoreRowModel, getSortedRowModel,
  getPaginationRowModel, flexRender, type SortingState,
  createColumnHelper,
} from "@tanstack/react-table"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { useAuthStore } from "@/store/authStore"
import { getTutorEarnings } from "@/lib/services/tutorService"
import type { TutorEarningRow } from "@/types/tutor"
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
} from "recharts"

export default function TutorEarningsPage() {
  const { user } = useAuthStore()
  const [rows, setRows] = useState<TutorEarningRow[]>([])
  const [loading, setLoading] = useState(true)
  const [sorting, setSorting] = useState<SortingState>([])

  useEffect(() => {
    if (!user) return
    getTutorEarnings(user.user_id, user.tenant_id).then((data: TutorEarningRow[]) => {
      setRows(data)
      setLoading(false)
    })
  }, [user])

  const stats = useMemo(() => ({
    totalGross: rows.reduce((a, r) => a + r.grossAmount, 0),
    totalCommission: rows.reduce((a, r) => a + r.commission, 0),
    totalNet: rows.reduce((a, r) => a + r.netAmount, 0),
    pending: rows.filter(r => r.paymentStatus === "pending").reduce((a, r) => a + r.netAmount, 0),
  }), [rows])

  // Chart: group by month
  const chartData = useMemo(() => {
    const byMonth: Record<string, number> = {}
    rows.forEach(r => {
      const month = r.date.slice(0, 7)
      byMonth[month] = (byMonth[month] || 0) + r.netAmount
    })
    return Object.entries(byMonth)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([month, amount]) => ({
        month: new Date(month + "-01").toLocaleDateString("en-ET", { month: "short", year: "2-digit" }),
        amount,
      }))
  }, [rows])

  const col = createColumnHelper<TutorEarningRow>()
  const columns = useMemo(() => [
    col.accessor("date", { header: "Date", cell: i => <span className="text-sm">{i.getValue()}</span> }),
    col.accessor("studentName", { header: "Student" }),
    col.accessor("subject", { header: "Subject" }),
    col.accessor("grossAmount", { header: "Gross (ETB)", cell: i => <span>{i.getValue().toLocaleString()}</span> }),
    col.accessor("commission", { header: "Fee (ETB)", cell: i => <span className="text-red-500">-{i.getValue().toLocaleString()}</span> }),
    col.accessor("netAmount", { header: "Net (ETB)", cell: i => <span className="font-bold text-green-600 dark:text-green-400">{i.getValue().toLocaleString()}</span> }),
    col.accessor("paymentStatus", {
      header: "Status",
      cell: i => {
        const v = i.getValue()
        return <span className={`px-2 py-0.5 rounded-full text-xs font-semibold capitalize ${v === "paid" ? "bg-green-100 text-green-700 dark:bg-green-950/30 dark:text-green-400" : "bg-amber-100 text-amber-700 dark:bg-amber-950/30 dark:text-amber-400"}`}>{v}</span>
      },
    }),
  ], [])

  const table = useReactTable({
    data: rows,
    columns,
    state: { sorting },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    initialState: { pagination: { pageSize: 10 } },
  })

  return (
    <>
      <div className="px-4 lg:px-6">
        <h1 className="text-2xl font-bold tracking-tight">Earnings & Revenue</h1>
        <p className="text-muted-foreground text-sm">Track your income, platform fees, and payouts.</p>
      </div>

      {/* Stat cards */}
      <div className="px-4 lg:px-6 grid gap-4 grid-cols-2 md:grid-cols-4">
        {[
          { label: "Total Earned",    value: `${stats.totalGross.toLocaleString()} ETB`,      icon: Banknote,      color: "text-foreground" },
          { label: "Net Payout",      value: `${stats.totalNet.toLocaleString()} ETB`,        icon: TrendingUp,    color: "text-green-500" },
          { label: "Platform Fees",   value: `${stats.totalCommission.toLocaleString()} ETB`, icon: ArrowDownRight,color: "text-red-500" },
          { label: "Pending Payout",  value: `${stats.pending.toLocaleString()} ETB`,         icon: Clock,         color: "text-amber-500" },
        ].map(({ label, value, icon: Icon, color }) => (
          <Card key={label}>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-muted-foreground text-sm font-medium">{label}</p>
                  <p className="text-xl font-bold mt-1">{loading ? "–" : value}</p>
                </div>
                <div className="bg-secondary rounded-lg p-3">
                  <Icon className={`size-5 ${color}`} />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Bar Chart */}
      <div className="px-4 lg:px-6">
        <Card>
          <CardHeader className="flex flex-row items-center gap-2">
            <CalendarDays className="size-5 text-primary" />
            <div>
              <CardTitle>Monthly Net Earnings</CardTitle>
              <CardDescription>ETB net after platform commission</CardDescription>
            </div>
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-48 w-full rounded-xl" />
            ) : (
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={chartData} barSize={28}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                  <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip
                    formatter={(v: number | undefined) => [v != null ? `${v.toLocaleString()} ETB` : '0 ETB', "Net Earnings"]}   
                    contentStyle={{ fontSize: 12 }}
                  />
                  <Bar dataKey="amount" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Payout history table */}
      <div className="px-4 lg:px-6">
        <Card>
          <CardHeader>
            <CardTitle>Payout History</CardTitle>
            <CardDescription>A complete log of all your earnings per session.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
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
                      <TableRow><TableCell colSpan={columns.length} className="h-24 text-center text-muted-foreground text-sm">No earnings found.</TableCell></TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            )}
            <div className="flex items-center justify-between text-sm text-muted-foreground">
              <span>{table.getFilteredRowModel().rows.length} record(s)</span>
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
