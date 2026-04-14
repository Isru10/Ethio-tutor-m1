"use client";

import { useEffect, useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import {
  BookCheck,
  TrendingUp,
  Clock,
  CheckCircle2,
  Users,
  ChevronRight,
  Video,
  Loader2,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useAuthStore } from "@/lib/store/useAuthStore";
import { bookingService } from "@/lib/services/bookingService";
import { startSessionApi } from "@/lib/services/sessionService";

type RawBooking = {
  booking_id: number;
  status: "pending" | "confirmed" | "completed" | "cancelled";
  created_at: string;
  slot: {
    slot_id: number;
    slot_date: string;
    start_time: string;
    end_time: string;
    max_students: number;
    subject: { name: string };
    session: { session_id: number; status: string; start_time?: string } | null;
  };
  student: { user: { name: string } };
};

// Group bookings by slot_id
type SlotGroup = {
  slot_id: number;
  subject: string;
  slot_date: string;
  start_time: string;
  end_time: string;
  max_students: number;
  session: { session_id: number; status: string; start_time?: string } | null;
  bookings: RawBooking[];
  confirmedCount: number;
  pendingCount: number;
  completedCount: number;
  overallStatus: "pending" | "confirmed" | "completed" | "live";
  // first confirmed booking_id for starting session
  startableBookingId: number | null;
};

const STATUS_STYLES: Record<string, string> = {
  confirmed:
    "border-blue-400 bg-blue-50 text-blue-700 dark:bg-blue-950/30 dark:text-blue-400",
  pending:
    "border-amber-400 bg-amber-50 text-amber-700 dark:bg-amber-950/30 dark:text-amber-400",
  completed:
    "border-green-400 bg-green-50 text-green-700 dark:bg-green-950/30 dark:text-green-400",
  live: "border-green-500 bg-green-100 text-green-800 dark:bg-green-950/40 dark:text-green-300",
  cancelled:
    "border-rose-400 bg-rose-50 text-rose-700 dark:bg-rose-950/30 dark:text-rose-400",
};

export default function TutorBookingsPage() {
  const { user } = useAuthStore();
  const router = useRouter();
  const [rawBookings, setRawBookings] = useState<RawBooking[]>([]);
  const [loading, setLoading] = useState(true);
  const [startingSlotId, setStartingSlotId] = useState<number | null>(null);

  useEffect(() => {
    if (!user) return;
    bookingService
      .getTutorBookings()
      .then((data) => {
        setRawBookings(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [user]);

  // Group by slot
  const slotGroups = useMemo<SlotGroup[]>(() => {
    const map = new Map<number, SlotGroup>();
    for (const b of rawBookings) {
      const sid = b.slot.slot_id;
      if (!map.has(sid)) {
        map.set(sid, {
          slot_id: sid,
          subject: b.slot.subject.name,
          slot_date: b.slot.slot_date,
          start_time: b.slot.start_time,
          end_time: b.slot.end_time,
          max_students: b.slot.max_students,
          session: b.slot.session,
          bookings: [],
          confirmedCount: 0,
          pendingCount: 0,
          completedCount: 0,
          overallStatus: "pending",
          startableBookingId: null,
        });
      }
      const g = map.get(sid)!;
      g.bookings.push(b);
      if (b.status === "confirmed") {
        g.confirmedCount++;
        if (!g.startableBookingId) g.startableBookingId = b.booking_id;
      }
      if (b.status === "pending") g.pendingCount++;
      if (b.status === "completed") g.completedCount++;
    }

    // Determine overall status per slot
    for (const g of map.values()) {
      if (g.session?.status === "live") g.overallStatus = "live";
      else if (g.completedCount > 0) g.overallStatus = "completed";
      else if (g.confirmedCount > 0) g.overallStatus = "confirmed";
      else g.overallStatus = "pending";
    }

    return Array.from(map.values()).sort(
      (a, b) =>
        new Date(b.slot_date).getTime() - new Date(a.slot_date).getTime(),
    );
  }, [rawBookings]);

  const stats = useMemo(
    () => ({
      total: slotGroups.length,
      pending: slotGroups.filter((g) => g.overallStatus === "pending").length,
      confirmed: slotGroups.filter(
        (g) => g.overallStatus === "confirmed" || g.overallStatus === "live",
      ).length,
      completed: slotGroups.filter((g) => g.overallStatus === "completed")
        .length,
    }),
    [slotGroups],
  );

  const handleStartSession = async (bookingId: number, slotId: number) => {
    try {
      setStartingSlotId(slotId);
      const res = await startSessionApi(bookingId);
      router.push(
        `/room/${res.sessionId}?token=${encodeURIComponent(res.token)}&url=${encodeURIComponent(res.liveKitUrl)}`,
      );
    } catch (err: any) {
      alert(err.message || "Failed to start session");
      setStartingSlotId(null);
    }
  };

  return (
    <>
      <div className="px-4 lg:px-6">
        <h1 className="text-2xl font-bold tracking-tight">My Bookings</h1>
        <p className="text-muted-foreground text-sm">
          Each row is a session slot. Click a row to see enrolled students.
        </p>
      </div>

      {/* Stats */}
      <div className="px-4 lg:px-6 grid gap-4 grid-cols-2 md:grid-cols-4">
        {[
          {
            label: "Total Slots",
            value: stats.total,
            icon: BookCheck,
            color: "text-foreground",
          },
          {
            label: "Pending",
            value: stats.pending,
            icon: Clock,
            color: "text-amber-500",
          },
          {
            label: "Confirmed",
            value: stats.confirmed,
            icon: CheckCircle2,
            color: "text-blue-500",
          },
          {
            label: "Completed",
            value: stats.completed,
            icon: TrendingUp,
            color: "text-green-500",
          },
        ].map(({ label, value, icon: Icon, color }) => (
          <Card key={label}>
            <CardContent className="pt-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-muted-foreground text-sm font-medium">
                    {label}
                  </p>
                  <p className="text-2xl font-bold mt-1">
                    {loading ? "–" : value}
                  </p>
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
            <CardTitle>Session Slots</CardTitle>
            <CardDescription>
              Click any row to view enrolled students for that session.
            </CardDescription>
          </CardHeader>
          <CardContent>
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
                      <TableHead>Subject</TableHead>
                      <TableHead>Date & Time</TableHead>
                      <TableHead>Students</TableHead>
                      <TableHead>Duration</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {slotGroups.length ? (
                      slotGroups.map((g) => {
                        const isStarting = startingSlotId === g.slot_id;
                        const dateOnly = g.slot_date.split("T")[0];
                        const start = g.start_time.slice(0, 5);
                        const end = g.end_time.slice(0, 5);
                        const startDt = new Date(`${dateOnly}T${start}`);
                        const endDt = new Date(`${dateOnly}T${end}`);
                        const durationMins = Math.round(
                          (endDt.getTime() - startDt.getTime()) / 60000,
                        );
                        const totalStudents = g.bookings.filter(
                          (b) => b.status !== "cancelled",
                        ).length;

                        // Actual taught duration if session has started
                        let taughtLabel = `${durationMins} min`;
                        if (
                          g.session?.start_time &&
                          g.overallStatus === "completed"
                        ) {
                          const actualEnd = new Date();
                          const actualStart = new Date(g.session.start_time);
                          const actual = Math.round(
                            (actualEnd.getTime() - actualStart.getTime()) /
                              60000,
                          );
                          taughtLabel = `${actual} min taught`;
                        }

                        return (
                          <TableRow
                            key={g.slot_id}
                            className="cursor-pointer hover:bg-muted/50"
                            onClick={() =>
                              router.push(`/tutor/bookings/${g.slot_id}`)
                            }
                          >
                            <TableCell>
                              <div className="flex items-center gap-2">
                                <Badge variant="default" className="text-xs">
                                  {g.subject}
                                </Badge>
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="text-sm font-medium">
                                {startDt.toLocaleDateString("en-ET", {
                                  weekday: "short",
                                  day: "numeric",
                                  month: "short",
                                })}
                              </div>
                              <div className="text-xs text-muted-foreground">
                                {start} – {end}
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-1.5 text-sm">
                                <Users className="size-3.5 text-muted-foreground" />
                                <span className="font-semibold">
                                  {totalStudents}
                                </span>
                                <span className="text-muted-foreground">
                                  / {g.max_students}
                                </span>
                              </div>
                              {g.pendingCount > 0 && (
                                <p className="text-xs text-amber-600 mt-0.5">
                                  {g.pendingCount} pending payment
                                </p>
                              )}
                            </TableCell>
                            <TableCell>
                              <span className="text-sm text-muted-foreground">
                                {taughtLabel}
                              </span>
                            </TableCell>
                            <TableCell onClick={(e) => e.stopPropagation()}>
                              <Badge
                                variant="outline"
                                className={`text-xs font-medium capitalize ${STATUS_STYLES[g.overallStatus] ?? ""}`}
                              >
                                {g.overallStatus === "live" && (
                                  <span className="mr-1.5 inline-block h-1.5 w-1.5 rounded-full bg-green-500 animate-pulse" />
                                )}
                                {g.overallStatus}
                              </Badge>
                            </TableCell>
                            <TableCell onClick={(e) => e.stopPropagation()}>
                              {g.overallStatus === "confirmed" &&
                                g.startableBookingId && (
                                  <Button
                                    size="sm"
                                    className="h-7 text-xs gap-1.5 bg-green-600 hover:bg-green-700 text-white"
                                    disabled={isStarting}
                                    onClick={() =>
                                      handleStartSession(
                                        g.startableBookingId!,
                                        g.slot_id,
                                      )
                                    }
                                  >
                                    {isStarting ? (
                                      <Loader2 className="size-3 animate-spin" />
                                    ) : (
                                      <Video className="size-3" />
                                    )}
                                    {isStarting ? "Launching…" : "Start"}
                                  </Button>
                                )}
                              {g.overallStatus === "live" && (
                                <Button
                                  size="sm"
                                  className="h-7 text-xs gap-1.5 bg-blue-600 hover:bg-blue-700 text-white"
                                  onClick={() =>
                                    router.push(
                                      `/room/${g.session?.session_id}`,
                                    )
                                  }
                                >
                                  <Video className="size-3" /> Rejoin
                                </Button>
                              )}
                              {(g.overallStatus === "pending" ||
                                g.overallStatus === "completed") && (
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  className="h-7 text-xs gap-1 text-muted-foreground"
                                  onClick={() =>
                                    router.push(`/tutor/bookings/${g.slot_id}`)
                                  }
                                >
                                  View <ChevronRight className="size-3" />
                                </Button>
                              )}
                            </TableCell>
                          </TableRow>
                        );
                      })
                    ) : (
                      <TableRow>
                        <TableCell
                          colSpan={6}
                          className="h-24 text-center text-muted-foreground text-sm"
                        >
                          No bookings yet.
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
  );
}
