"use client"

import { useEffect, useState, useMemo } from "react"
import { useRouter } from "next/navigation"
import {
  Users, BookCheck, TrendingUp, Clock,
  Video, Loader2, CheckCircle2
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { Input } from "@/components/ui/input"
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table"
import { useAuthStore } from "@/store/authStore"
import { bookingService } from "@/lib/services/bookingService"
import { startSessionApi } from "@/lib/services/sessionService"

// Shape from GET /bookings/tutor
type TutorBookingRow = {
  booking_id: number;
  status: "pending" | "confirmed" | "completed" | "cancelled";
  created_at: string;
  slot: {
    slot_date: string;
    start_time: string;
    subject: { name: string };
    session: { session_id: number; status: string } | null;
  };
  student: { user: { name: string } };
}

const STATUS_STYLES = {
  confirmed:  "border-blue-400 bg-blue-50 text-blue-700 dark:bg-blue-950/30 dark:text-blue-400",
  pending:    "border-amber-400 bg-amber-50 text-amber-700 dark:bg-amber-950/30 dark:text-amber-400",
  completed:  "border-green-400 bg-green-50 text-green-700 dark:bg-green-950/30 dark:text-green-400",
  cancelled:  "border-rose-400 bg-rose-50 text-rose-700 dark:bg-rose-950/30 dark:text-rose-400",
}

export default function TutorBookingsPage() {
  const { user } = useAuthStore()
  const router = useRouter()
  const [rows, setRows] = useState<TutorBookingRow[]>([])
  const [loading, setLoading] = useState(true)
  const [startingBookingId, setStartingBookingId] = useState<number | null>(null)
  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState<string[]>([])

  useEffect(() => {
    if (!user) return
    bookingService.getTutorBookings()
      .then((data) => { setRows(data); setLoading(false) })
      .catch((err) => { console.error(err); setLoading(false) })
  }, [user])

  const stats = useMemo(() => ({
    total:     rows.length,
    confirmed: rows.filter(r => r.status === "confirmed").length,
    completed: rows.filter(r => r.status === "completed").length,
    pending:   rows.filter(r => r.status === "pending").length,
  }), [rows])

  const filtered = useMemo(() => {
    let data = rows
    if (search) {
      const q = search.toLowerCase()
      data = data.filter(r =>
        r.student.user.name.toLowerCase().includes(q) ||
        r.slot.subject.name.toLowerCase().includes(q)
      )
    }
    if (statusFilter.length > 0) {
      data = data.filter(r => statusFilter.includes(r.status))
    }
    return data
  }, [rows, search, statusFilter])

  const handleConfirm = async (bookingId: number) => {
    try {
      await bookingService.confirmBooking(bookingId)
      setRows(prev => prev.map(r => r.booking_id === bookingId ? { ...r, status: "confirmed" } : r))
    } catch (err: any) { alert(err.message) }
  }

  const handleCancel = async (bookingId: number) => {
    try {
      await bookingService.cancelBooking(bookingId)
      setRows(prev => prev.map(r => r.booking_id === bookingId ? { ...r, status: "cancelled" } : r))
    } catch (err: any) { alert(err.message) }
  }

  const handleStartSession = async (bookingId: number) => {
    try {
      setStartingBookingId(bookingId)
      const res = await startSessionApi(bookingId)
      // Pass host token in URL so room page doesn't call the student-only /join endpoint
      router.push(`/room/${res.sessionId}?token=${encodeURIComponent(res.token)}&url=${encodeURIComponent(res.liveKitUrl)}`)
    } catch (err: any) {
      alert(err.message || "Failed to start session")
      setStartingBookingId(null)
    }
  }

  const toggleStatus = (s: string) =>
    setStatusFilter(prev => prev.includes(s) ? prev.filter(v => v !== s) : [...prev, s])

  return (
    <>
      <div className="px-4 lg:px-6">
        <h1 className="text-2xl font-bold tracking-tight">My Bookings</h1>
        <p className="text-muted-foreground text-sm">
          Manage student bookings for your slots. Confirm them and start a live session.
        </p>
      </div>

      {/* Stats */}
      <div className="px-4 lg:px-6 grid gap-4 grid-cols-2 md:grid-cols-4">
        {[
          { label: "Total",     value: stats.total,     icon: BookCheck,   color: "text-foreground" },
          { label: "Pending",   value: stats.pending,   icon: Clock,       color: "text-amber-500"  },
          { label: "Confirmed", value: stats.confirmed, icon: CheckCircle2,color: "text-blue-500"   },
          { label: "Completed", value: stats.completed, icon: TrendingUp,  color: "text-green-500"  },
        ].map(({ label, value, icon: Icon, color }) => (
          <Card key={label}>
            <CardContent className="pt-5">
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

      {/* Table */}
      <div className="px-4 lg:px-6">
        <Card>
          <CardHeader>
            <CardTitle>Booking Records</CardTitle>
            <CardDescription>
              Confirm pending bookings to schedule them, then click <strong>"Start Session"</strong> when ready to go live.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Toolbar */}
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <Input
                placeholder="Search student or subject…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="h-8 max-w-xs"
              />
              <div className="flex gap-1.5 flex-wrap">
                {(["pending", "confirmed", "completed", "cancelled"] as const).map((s) => (
                  <Badge
                    key={s}
                    variant={statusFilter.includes(s) ? "default" : "outline"}
                    className="cursor-pointer capitalize text-xs"
                    onClick={() => toggleStatus(s)}
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
                      <TableHead>Student</TableHead>
                      <TableHead>Subject</TableHead>
                      <TableHead>Date & Time</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filtered.length ? filtered.map((row) => {
                      const isStarting = startingBookingId === row.booking_id
                      const style = STATUS_STYLES[row.status] ?? STATUS_STYLES.cancelled
                      const isLive = row.slot.session?.status === "live"
                      return (
                        <TableRow key={row.booking_id}>
                          <TableCell className="font-mono text-xs text-muted-foreground">#{row.booking_id}</TableCell>
                          <TableCell className="font-medium text-sm">{row.student.user.name}</TableCell>
                          <TableCell>
                            <Badge variant="default" className="text-xs">{row.slot.subject.name}</Badge>
                          </TableCell>
                          <TableCell>
                            <div className="text-sm font-medium">{new Date(row.slot.slot_date).toLocaleDateString()}</div>
                            <div className="text-xs text-muted-foreground">{row.slot.start_time}</div>
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline" className={`text-xs font-medium capitalize ${style}`}>
                              {row.status}
                              {isLive && <span className="ml-1.5 inline-block h-1.5 w-1.5 rounded-full bg-green-500 animate-pulse" />}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div className="flex gap-2 items-center flex-wrap">
                              {/* PENDING: Confirm or Cancel */}
                              {row.status === "pending" && (
                                <>
                                  <Button
                                    size="sm" variant="default" className="h-7 text-xs"
                                    onClick={() => handleConfirm(row.booking_id)}
                                  >
                                    Confirm
                                  </Button>
                                  <Button
                                    size="sm" variant="outline"
                                    className="h-7 text-xs text-rose-600 border-rose-300"
                                    onClick={() => handleCancel(row.booking_id)}
                                  >
                                    Cancel
                                  </Button>
                                </>
                              )}

                              {/* CONFIRMED: Start Session */}
                              {row.status === "confirmed" && (
                                <Button
                                  size="sm"
                                  className="h-7 text-xs gap-1.5 bg-green-600 hover:bg-green-700 text-white"
                                  disabled={isStarting}
                                  onClick={() => handleStartSession(row.booking_id)}
                                >
                                  {isStarting
                                    ? <Loader2 className="size-3 animate-spin" />
                                    : <Video className="size-3" />}
                                  {isStarting ? "Launching…" : "Start Session"}
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
