"use client"

import type { ColumnDef } from "@tanstack/react-table"
import { ArrowUpDown, MoreHorizontal, XCircle } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu, DropdownMenuContent,
  DropdownMenuItem, DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import type { BookingRow } from "../data/schema"
import { cn } from "@/lib/utils"

// Status badge styles — mirrors tasks priority colours pattern
const statusConfig = {
  confirmed:  { label: "Confirmed",  class: "border-blue-400 bg-blue-50 text-blue-700 dark:bg-blue-950/30 dark:text-blue-400" },
  pending:    { label: "Pending",    class: "border-amber-400 bg-amber-50 text-amber-700 dark:bg-amber-950/30 dark:text-amber-400" },
  completed:  { label: "Completed",  class: "border-green-400 bg-green-50 text-green-700 dark:bg-green-950/30 dark:text-green-400" },
  cancelled:  { label: "Cancelled",  class: "border-rose-400 bg-rose-50 text-rose-700 dark:bg-rose-950/30 dark:text-rose-400" },
}

export const bookingColumns = (
  onCancel: (bookingId: number) => void
): ColumnDef<BookingRow>[] => [
  {
    accessorKey: "booking_id",
    header: "ID",
    cell: ({ row }) => (
      <span className="font-mono text-xs text-muted-foreground">
        #{row.getValue("booking_id")}
      </span>
    ),
    enableHiding: false,
  },
  {
    accessorKey: "subject",
    header: ({ column }) => (
      <Button
        variant="ghost" size="sm" className="-ml-3 h-8"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
      >
        Subject <ArrowUpDown className="ml-2 size-3.5" />
      </Button>
    ),
    cell: ({ row }) => (
      <Badge variant="default" className="text-xs">{row.getValue("subject")}</Badge>
    ),
    filterFn: (row, id, value: string[]) => value.includes(row.getValue(id)),
  },
  {
    accessorKey: "teacher_name",
    header: "Teacher",
    cell: ({ row }) => (
      <span className="font-medium text-sm">{row.getValue("teacher_name")}</span>
    ),
  },
  {
    accessorKey: "grade",
    header: "Grade",
    cell: ({ row }) => (
      <span className="text-sm text-muted-foreground">{row.getValue("grade")}</span>
    ),
  },
  {
    accessorKey: "date",
    header: ({ column }) => (
      <Button
        variant="ghost" size="sm" className="-ml-3 h-8"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
      >
        Date <ArrowUpDown className="ml-2 size-3.5" />
      </Button>
    ),
    cell: ({ row }) => (
      <div className="text-sm">
        <div className="font-medium">{row.getValue("date")}</div>
        <div className="text-muted-foreground text-xs">{row.original.time}</div>
      </div>
    ),
  },
  {
    accessorKey: "amount",
    header: "Amount",
    cell: ({ row }) => (
      <span className="font-semibold text-sm">
        {(row.getValue("amount") as number).toLocaleString()} ETB
      </span>
    ),
  },
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ row }) => {
      const status = row.getValue("status") as keyof typeof statusConfig
      const cfg = statusConfig[status]
      return (
        <Badge variant="outline" className={cn("text-xs font-medium", cfg.class)}>
          {cfg.label}
        </Badge>
      )
    },
    filterFn: (row, id, value: string[]) => value.includes(row.getValue(id)),
  },
  {
    id: "actions",
    cell: ({ row }) => {
      const booking = row.original
      const canCancel = booking.status === "pending" || booking.status === "confirmed"
      return (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="size-7">
              <MoreHorizontal className="size-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel className="text-xs text-muted-foreground">
              Booking #{booking.booking_id}
            </DropdownMenuLabel>
            {canCancel && (
              <DropdownMenuItem
                className="text-rose-600 focus:text-rose-600 cursor-pointer"
                onClick={() => onCancel(booking.booking_id)}
              >
                <XCircle className="mr-2 size-4" />
                Cancel Booking
              </DropdownMenuItem>
            )}
            {!canCancel && (
              <DropdownMenuItem disabled className="text-xs">
                No actions available
              </DropdownMenuItem>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      )
    },
  },
]
