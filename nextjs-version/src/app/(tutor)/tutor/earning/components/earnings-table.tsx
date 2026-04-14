"use client"

import * as React from "react"
import { 
  createColumnHelper, 
  flexRender, 
  getCoreRowModel, 
  useReactTable, 
  getSortedRowModel,
  SortingState,
  getPaginationRowModel
} from "@tanstack/react-table"
import { ArrowUpDown, ChevronLeft, ChevronRight, Search, Download } from "lucide-react"
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"

export type Earning = {
  id: string
  subject: string
  sessionTitle: string
  studentName: string
  date: string
  duration: number
  amount: number
  status: "paid" | "pending"
}

const mockData: Earning[] = [
  { id: "1", subject: "Math", sessionTitle: "Algebra Basics", studentName: "Abebe B.", date: "2024-04-12", duration: 60, amount: 450, status: "paid" },
  { id: "2", subject: "Physics", sessionTitle: "Quantum Mechanics", studentName: "Sara J.", date: "2024-04-10", duration: 90, amount: 850, status: "paid" },
  { id: "3", subject: "Math", sessionTitle: "Calculus III", studentName: "Michael C.", date: "2024-04-09", duration: 60, amount: 500, status: "pending" },
  { id: "4", subject: "Computer Science", sessionTitle: "Python Intro", studentName: "Hanna T.", date: "2024-04-08", duration: 120, amount: 1200, status: "paid" },
  { id: "5", subject: "Math", sessionTitle: "Trigonometry", studentName: "David M.", date: "2024-04-07", duration: 60, amount: 450, status: "paid" },
  { id: "6", subject: "English", sessionTitle: "Essay Writing", studentName: "Sara J.", date: "2024-04-05", duration: 60, amount: 400, status: "paid" },
]

const columnHelper = createColumnHelper<Earning>()

const columns = [
  columnHelper.accessor("date", {
    header: ({ column }) => (
      <Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === "asc")} className="p-0 hover:bg-transparent text-[10px] font-black uppercase tracking-widest">
        Date <ArrowUpDown className="ml-2 h-3 w-3" />
      </Button>
    ),
    cell: info => <span className="text-xs font-bold text-muted-foreground">{info.getValue()}</span>,
  }),
  columnHelper.accessor("sessionTitle", {
    header: "Session Activity",
    cell: info => (
      <div className="flex flex-col">
        <span className="text-sm font-bold leading-none">{info.getValue()}</span>
        <span className="text-[10px] text-muted-foreground font-medium mt-1 uppercase tracking-tight">{info.row.original.subject}</span>
      </div>
    ),
  }),
  columnHelper.accessor("studentName", {
    header: "Student",
    cell: info => <span className="text-xs font-medium">{info.getValue()}</span>,
  }),
  columnHelper.accessor("amount", {
    header: ({ column }) => (
      <Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === "asc")} className="p-0 hover:bg-transparent text-[10px] font-black uppercase tracking-widest">
        Earnings <ArrowUpDown className="ml-2 h-3 w-3" />
      </Button>
    ),
    cell: info => <span className="text-sm font-bold text-primary">${info.getValue()}</span>,
  }),
  columnHelper.accessor("status", {
    header: "Status",
    cell: info => (
      <Badge variant="outline" className={cn(
        "text-[9px] font-black uppercase tracking-widest italic h-5",
        info.getValue() === "paid" ? "bg-green-500/10 text-green-600 border-green-500/10" : "bg-amber-500/10 text-amber-600 border-amber-500/10"
      )}>
        {info.getValue()}
      </Badge>
    ),
  }),
]

export function EarningsTable() {
  const [sorting, setSorting] = React.useState<SortingState>([])

  const table = useReactTable({
    data: mockData,
    columns,
    state: { sorting },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    initialState: { pagination: { pageSize: 5 } },
  })

  return (
    <Card className="border-border bg-card shadow-sm overflow-hidden">
      <CardHeader className="border-b bg-accent/5 px-6 py-4 flex flex-row items-center justify-between">
        <CardTitle className="text-base font-bold">Financial Activity</CardTitle>
        <div className="flex items-center gap-2">
           <Button variant="outline" size="sm" className="h-8 text-[10px] font-bold uppercase gap-2">
              <Download className="h-3 w-3" /> Export CSV
           </Button>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <Table>
          <TableHeader className="bg-muted/30">
            {table.getHeaderGroups().map(headerGroup => (
              <TableRow key={headerGroup.id} className="hover:bg-transparent border-b">
                {headerGroup.headers.map(header => (
                  <TableHead key={header.id} className="h-10 text-[10px] font-black uppercase tracking-widest px-6">
                    {flexRender(header.column.columnDef.header, header.getContext())}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows.map(row => (
              <TableRow key={row.id} className="hover:bg-accent/30 transition-colors border-b last:border-0 group">
                {row.getVisibleCells().map(cell => (
                  <TableCell key={cell.id} className="px-6 py-4">
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
        <div className="flex items-center justify-between px-6 py-4 bg-accent/5">
          <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest">
            Showing {table.getRowModel().rows.length} of {mockData.length} records
          </p>
          <div className="flex items-center gap-2">
            <Button 
              variant="outline" 
              size="sm" 
              className="h-8 w-8 p-0"
              onClick={() => table.previousPage()}
              disabled={!table.getCanPreviousPage()}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button 
              variant="outline" 
              size="sm" 
              className="h-8 w-8 p-0"
              onClick={() => table.nextPage()}
              disabled={!table.getCanNextPage()}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
