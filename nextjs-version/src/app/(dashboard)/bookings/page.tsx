"use client"

import { useEffect, useState, useMemo } from "react"
import { useRouter } from "next/navigation"
import { ArrowUp, BookCheck, Clock, CheckCircle2, Video, Loader2 } from "lucide-react"
import {
  Card, CardContent, CardHeader, CardTitle, CardDescription
} from "@/components/ui/card"
import { useAuthStore } from "@/store/authStore"
import { bookingService } from "@/lib/services/bookingService"
import { joinSessionApi } from "@/lib/services/sessionService"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table"
import { Input } from "@/components/ui/input"

// Real booking shape from backend
type Booking = {
  booking_id: number;
  status: "pending" | "confirmed" | "completed" | "cancelled";
  created_at: string;
  slot: {
    slot_date: string;
    start_time: string;
    end_time: string;
    subject: { name: string };
    teacher: { user: { name: string } };
    session: { session_id: number; status: string } | null;
  };
  transaction?: { total_amount: number } | null;
}

const STATUS_STYLES = {
  confirmed:  "border-blue-400 bg-blue-50 text-blue-700 dark:bg-blue-950/30 dark:text-blue-400",
  pending:    "border-amber-400 bg-amber-50 text-amber-700 dark:bg-amber-950/30 dark:text-amber-400",
  completed:  "border-green-400 bg-green-50 text-green-700 dark:bg-green-950/30 dark:text-green-400",
  cancelled:  "border-rose-400 bg-rose-50 text-rose-700 dark:bg-rose-950/30 dark:text-rose-400",
}

export default function BookingsPage() {
  const { user } = useAuthStore()
  const router = useRouter()
  const [bookings, setBookings] = useState<Booking[]>([])
  const [loading, setLoading] = useState(true)
  const [joiningId, setJoiningId] = useState<number | null>(null)
  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState<string[]>([])

  useEffect(() => {
    if (!user) return
    bookingService.getMyBookings()
      .then((data) => { setBookings(data); setLoading(false) })
      .catch(() => setLoading(false))
  }, [user])

  const stats = useMemo(() => ({
    total:     bookings.length,
    confirmed: bookings.filter(b => b.status === "confirmed").length,
    completed: bookings.filter(b => b.status === "completed").length,
    pending:   bookings.filter(b => b.status === "pending").length,
  }), [bookings])

  const filtered = useMemo(() => {
    let rows = bookings
    if (search) {
      const q = search.toLowerCase()
      rows = rows.filter(b =>
        b.slot.subject.name.toLowerCase().includes(q) ||
        b.slot.teacher.user.name.toLowerCase().includes(q)
      )
    }
    if (statusFilter.length > 0) {
      rows = rows.filter(b => statusFilter.includes(b.status))
    }
    return rows
  }, [bookings, search, statusFilter])

  const handleCancel = async (bookingId: number) => {
    try {
      await bookingService.cancelBooking(bookingId)
      setBookings(prev => prev.map(b =>
        b.booking_id === bookingId ? { ...b, status: "cancelled" } : b
      ))
    } catch (err: any) { alert(err.message) }
  }

  const handleJoin = async (sessionId: number) => {
    try {
      setJoiningId(sessionId)
      const res = await joinSessionApi(sessionId.toString())
      router.push(`/room/${res.sessionId}`)
    } catch (err: any) {
      alert(err.message || "Session hasn't started yet. Wait for the tutor to start it.")
      setJoiningId(null)
    }
  }

  const toggleStatusFilter = (s: string) => {
    setStatusFilter(prev => prev.includes(s) ? prev.filter(v => v !== s) : [...prev, s])
  }

  return (
    <>
      <div className="px-4 lg:px-6">
        <h1 className="text-2xl font-bold tracking-tight">My Bookings</h1>
        <p className="text-muted-foreground text-sm">View and manage all your class bookings.</p>
      </div>

      {/* Stats */}
      <div className="px-4 lg:px-6 grid gap-4 grid-cols-2 md:grid-cols-4">
        {[
          { label: "Total",     value: stats.total,     icon: BookCheck,    color: "text-foreground"  },
          { label: "Confirmed", value: stats.confirmed,  icon: CheckCircle2, color: "text-blue-500"    },
          { label: "Completed", value: stats.completed,  icon: CheckCircle2, color: "text-green-500"   },
          { label: "Pending",   value: stats.pending,    icon: Clock,        color: "text-amber-500"   },
        ].map(({ label, value, icon: Icon, color }) => (
          <Card key={label}>
            <CardContent className="pt-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-muted-foreground text-sm font-medium">{label}</p>
                  <div className="mt-1 flex items-baseline gap-2">
                    <span className="text-2xl font-bold">{loading ? "–" : value}</span>
                    {!loading && stats.total > 0 && (
                      <span className={`flex items-center gap-0.5 text-xs ${color}`}>
                        <ArrowUp className="size-3" />
                        {Math.round((value / stats.total) * 100)}%
                      </span>
                    )}
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
            <CardTitle>Booking History</CardTitle>
            <CardDescription>All your class bookings with status. Click "Join Session" when the tutor goes live.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Toolbar */}
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <Input
                placeholder="Search teacher or subject…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="h-8 max-w-xs"
              />
              <div className="flex gap-1.5 flex-wrap">
                {(["confirmed", "pending", "completed", "cancelled"] as const).map((s) => (
                  <Badge
                    key={s}
                    variant={statusFilter.includes(s) ? "default" : "outline"}
                    className="cursor-pointer capitalize text-xs"
                    onClick={() => toggleStatusFilter(s)}
                  >
                    {s}
                  </Badge>
                ))}
              </div>
            </div>

            {loading ? (
              <div className="space-y-2">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Skeleton key={i} className="h-12 w-full rounded" />
                ))}
              </div>
            ) : (
              <div className="rounded-md border overflow-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>ID</TableHead>
                      <TableHead>Subject</TableHead>
                      <TableHead>Teacher</TableHead>
                      <TableHead>Date & Time</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Action</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filtered.length ? filtered.map((b) => {
                      const isLive = b.slot.session?.status === "live"
                      const sessionId = b.slot.session?.session_id
                      const isJoining = joiningId === sessionId
                      const style = STATUS_STYLES[b.status] ?? STATUS_STYLES.cancelled
                      return (
                        <TableRow key={b.booking_id}>
                          <TableCell className="font-mono text-xs text-muted-foreground">#{b.booking_id}</TableCell>
                          <TableCell><Badge variant="default" className="text-xs">{b.slot.subject.name}</Badge></TableCell>
                          <TableCell className="font-medium text-sm">{b.slot.teacher.user.name}</TableCell>
                          <TableCell>
                            <div className="text-sm font-medium">{new Date(b.slot.slot_date).toLocaleDateString()}</div>
                            <div className="text-xs text-muted-foreground">{b.slot.start_time} – {b.slot.end_time}</div>
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline" className={`text-xs font-medium capitalize ${style}`}>
                              {b.status}
                              {isLive && b.status === "confirmed" && (
                                <span className="ml-1.5 inline-block h-1.5 w-1.5 rounded-full bg-green-500 animate-pulse" />
                              )}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div className="flex gap-2 items-center">
                              {/* JOIN BUTTON — only when session is live */}
                              {sessionId && isLive && (
                                <Button
                                  size="sm"
                                  className="h-7 text-xs bg-green-600 hover:bg-green-700 text-white gap-1.5"
                                  disabled={isJoining}
                                  onClick={() => handleJoin(sessionId)}
                                >
                                  {isJoining ? <Loader2 className="size-3 animate-spin" /> : <Video className="size-3" />}
                                  {isJoining ? "Joining…" : "Join Session"}
                                </Button>
                              )}
                              {/* WAITING STATE — confirmed but session not started */}
                              {b.status === "confirmed" && !sessionId && (
                                <span className="text-xs text-muted-foreground">Waiting for tutor…</span>
                              )}
                              {/* CANCEL — only for pending/confirmed */}
                              {(b.status === "pending" || b.status === "confirmed") && (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="h-7 text-xs text-rose-600 border-rose-300"
                                  onClick={() => handleCancel(b.booking_id)}
                                >
                                  Cancel
                                </Button>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      )
                    }) : (
                      <TableRow>
                        <TableCell colSpan={6} className="h-24 text-center text-muted-foreground text-sm">
                          No bookings found.
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </>
  )
}
