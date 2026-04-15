"use client";

import { useEffect, useState } from "react";
import { useAuthStore } from "@/lib/store/useAuthStore";
import { API_BASE } from "@/lib/api";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import {
  Users,
  BookOpen,
  CreditCard,
  Wallet,
  TrendingUp,
  ShieldAlert,
  CheckCircle2,
  Clock,
} from "lucide-react";
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";

// ─── Types ────────────────────────────────────────────────────
interface PlatformStats {
  total_transactions: number;
  paid_transactions: number;
  refunded_transactions: number;
  gross_revenue: number;
  platform_commission: number;
  teacher_earnings: number;
  refunded_amount: number;
}

interface AdminData {
  stats: PlatformStats;
  recentTransactions: any[];
  bookingsByStatus: { name: string; value: number; color: string }[];
  revenueByDay: { date: string; revenue: number; commission: number }[];
  topTutors: { name: string; sessions: number; earnings: number }[];
  userCounts: { students: number; tutors: number };
}

function authHeaders() {
  const token = useAuthStore.getState().accessToken;
  return { Authorization: `Bearer ${token}` };
}

async function fetchAdminData(): Promise<AdminData> {
  const [statsRes, txRes, bookingsRes, usersRes] = await Promise.all([
    fetch(`${API_BASE}/transactions/admin/stats`, {
      headers: authHeaders(),
    }).then((r) => r.json()),
    fetch(`${API_BASE}/transactions/admin/all`, {
      headers: authHeaders(),
    }).then((r) => r.json()),
    fetch(`${API_BASE}/bookings`, { headers: authHeaders() })
      .then((r) => r.json())
      .catch(() => ({ data: [] })),
    fetch(`${API_BASE}/users`, { headers: authHeaders() })
      .then((r) => r.json())
      .catch(() => ({ data: [] })),
  ]);

  const stats: PlatformStats = statsRes.data ?? {
    total_transactions: 0,
    paid_transactions: 0,
    refunded_transactions: 0,
    gross_revenue: 0,
    platform_commission: 0,
    teacher_earnings: 0,
    refunded_amount: 0,
  };

  const transactions: any[] = txRes.data ?? [];
  const users: any[] = usersRes.data ?? [];

  // Revenue by day (last 7 days from transactions)
  const dayMap = new Map<string, { revenue: number; commission: number }>();
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    dayMap.set(d.toISOString().split("T")[0], { revenue: 0, commission: 0 });
  }
  for (const tx of transactions) {
    if (tx.payment_status !== "paid") continue;
    const day = tx.created_at?.split("T")[0];
    if (dayMap.has(day)) {
      const entry = dayMap.get(day)!;
      entry.revenue += Number(tx.total_amount ?? 0);
      entry.commission += Number(tx.platform_commission ?? 0);
    }
  }
  const revenueByDay = Array.from(dayMap.entries()).map(([date, v]) => ({
    date: date.slice(5), // MM-DD
    revenue: Math.round(v.revenue),
    commission: Math.round(v.commission),
  }));

  // Booking status breakdown
  const statusCount: Record<string, number> = {
    pending: 0,
    confirmed: 0,
    completed: 0,
    cancelled: 0,
  };
  for (const tx of transactions) {
    const s = tx.booking?.status;
    if (s && statusCount[s] !== undefined) statusCount[s]++;
  }
  const bookingsByStatus = [
    { name: "Completed", value: statusCount.completed, color: "#22c55e" },
    { name: "Confirmed", value: statusCount.confirmed, color: "#3b82f6" },
    { name: "Pending", value: statusCount.pending, color: "#f59e0b" },
    { name: "Cancelled", value: statusCount.cancelled, color: "#ef4444" },
  ].filter((s) => s.value > 0);

  // Top tutors by earnings
  const tutorMap = new Map<string, { sessions: number; earnings: number }>();
  for (const tx of transactions) {
    if (tx.payment_status !== "paid") continue;
    const name = tx.teacher?.user?.name ?? "Unknown";
    const cur = tutorMap.get(name) ?? { sessions: 0, earnings: 0 };
    cur.sessions++;
    cur.earnings += Number(tx.teacher_earnings ?? 0);
    tutorMap.set(name, cur);
  }
  const topTutors = Array.from(tutorMap.entries())
    .map(([name, v]) => ({ name, ...v }))
    .sort((a, b) => b.earnings - a.earnings)
    .slice(0, 5);

  const students = users.filter((u: any) => u.role === "STUDENT").length;
  const tutors = users.filter((u: any) => u.role === "TUTOR").length;

  return {
    stats,
    recentTransactions: transactions.slice(0, 6),
    bookingsByStatus,
    revenueByDay,
    topTutors,
    userCounts: { students, tutors },
  };
}

const PAYOUT_COLORS: Record<string, string> = {
  pending: "bg-amber-100 text-amber-700",
  eligible: "bg-blue-100 text-blue-700",
  paid_out: "bg-green-100 text-green-700",
  disputed: "bg-red-100 text-red-700",
  refunded: "bg-gray-100 text-gray-600",
};

export default function AdminDashboardPage() {
  const { user } = useAuthStore();
  const [data, setData] = useState<AdminData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    fetchAdminData()
      .then(setData)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [user]);

  if (loading)
    return (
      <div className="px-4 lg:px-6 space-y-6">
        <Skeleton className="h-8 w-64" />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {Array.from({ length: 8 }).map((_, i) => (
            <Skeleton key={i} className="h-24 rounded-xl" />
          ))}
        </div>
        <div className="grid gap-4 lg:grid-cols-2">
          <Skeleton className="h-72 rounded-xl" />
          <Skeleton className="h-72 rounded-xl" />
        </div>
      </div>
    );

  if (!data)
    return (
      <div className="px-4 lg:px-6 py-20 text-center">
        <p className="text-muted-foreground text-sm">
          Could not load admin data.
        </p>
      </div>
    );

  const {
    stats,
    revenueByDay,
    bookingsByStatus,
    topTutors,
    recentTransactions,
    userCounts,
  } = data;

  return (
    <>
      <div className="px-4 lg:px-6">
        <h1 className="text-2xl font-bold tracking-tight">Platform Overview</h1>
        <p className="text-muted-foreground text-sm">
          EthioTutor admin dashboard — real-time platform metrics.
        </p>
      </div>

      {/* ── KPI Cards ── */}
      <div className="px-4 lg:px-6 grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          {
            label: "Total Students",
            value: userCounts.students,
            icon: Users,
            color: "text-blue-500",
          },
          {
            label: "Total Tutors",
            value: userCounts.tutors,
            icon: BookOpen,
            color: "text-violet-500",
          },
          {
            label: "Total Transactions",
            value: stats.total_transactions,
            icon: CreditCard,
            color: "text-foreground",
          },
          {
            label: "Paid Sessions",
            value: stats.paid_transactions,
            icon: CheckCircle2,
            color: "text-green-500",
          },
          {
            label: "Gross Revenue",
            value: `${stats.gross_revenue.toFixed(0)} ETB`,
            icon: TrendingUp,
            color: "text-emerald-500",
          },
          {
            label: "Platform Earned",
            value: `${stats.platform_commission.toFixed(0)} ETB`,
            icon: Wallet,
            color: "text-sky-500",
          },
          {
            label: "Tutor Payouts",
            value: `${stats.teacher_earnings.toFixed(0)} ETB`,
            icon: Clock,
            color: "text-amber-500",
          },
          {
            label: "Refunded",
            value: stats.refunded_transactions,
            icon: ShieldAlert,
            color: "text-red-500",
          },
        ].map(({ label, value, icon: Icon, color }) => (
          <Card key={label}>
            <CardContent className="pt-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-muted-foreground text-xs font-medium">
                    {label}
                  </p>
                  <p className="text-2xl font-bold mt-1">{value}</p>
                </div>
                <div className="bg-secondary rounded-lg p-2.5">
                  <Icon className={`size-5 ${color}`} />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* ── Charts row 1 ── */}
      <div className="px-4 lg:px-6 grid gap-4 lg:grid-cols-3">
        {/* Revenue area chart */}
        <Card className="lg:col-span-2">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Revenue (Last 7 Days)</CardTitle>
            <CardDescription>
              Gross revenue vs platform commission in ETB
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={220}>
              <AreaChart
                data={revenueByDay}
                margin={{ top: 4, right: 4, left: -20, bottom: 0 }}
              >
                <defs>
                  <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient
                    id="colorCommission"
                    x1="0"
                    y1="0"
                    x2="0"
                    y2="1"
                  >
                    <stop offset="5%" stopColor="#22c55e" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#22c55e" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="hsl(var(--border))"
                />
                <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip
                  contentStyle={{
                    background: "hsl(var(--card))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: 8,
                    fontSize: 12,
                  }}
                  formatter={(value) => [`${value ?? 0} ETB`]}
                />
                <Legend wrapperStyle={{ fontSize: 12 }} />
                <Area
                  type="monotone"
                  dataKey="revenue"
                  name="Gross Revenue"
                  stroke="#3b82f6"
                  fill="url(#colorRevenue)"
                  strokeWidth={2}
                />
                <Area
                  type="monotone"
                  dataKey="commission"
                  name="Commission"
                  stroke="#22c55e"
                  fill="url(#colorCommission)"
                  strokeWidth={2}
                />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Booking status pie */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Booking Status</CardTitle>
            <CardDescription>Distribution across all bookings</CardDescription>
          </CardHeader>
          <CardContent>
            {bookingsByStatus.length === 0 ? (
              <div className="flex items-center justify-center h-[220px] text-muted-foreground text-sm">
                No data yet
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={220}>
                <PieChart>
                  <Pie
                    data={bookingsByStatus}
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={85}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {bookingsByStatus.map((entry, i) => (
                      <Cell key={i} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      background: "hsl(var(--card))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: 8,
                      fontSize: 12,
                    }}
                  />
                  <Legend wrapperStyle={{ fontSize: 12 }} />
                </PieChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>

      {/* ── Charts row 2 ── */}
      <div className="px-4 lg:px-6 grid gap-4 lg:grid-cols-2">
        {/* Top tutors bar chart */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Top Tutors by Earnings</CardTitle>
            <CardDescription>
              ETB earned after platform commission
            </CardDescription>
          </CardHeader>
          <CardContent>
            {topTutors.length === 0 ? (
              <div className="flex items-center justify-center h-[200px] text-muted-foreground text-sm">
                No paid sessions yet
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={200}>
                <BarChart
                  data={topTutors}
                  margin={{ top: 4, right: 4, left: -20, bottom: 0 }}
                >
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="hsl(var(--border))"
                  />
                  <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip
                    contentStyle={{
                      background: "hsl(var(--card))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: 8,
                      fontSize: 12,
                    }}
                    formatter={(value) => [`${value ?? 0} ETB`]}
                  />
                  <Bar
                    dataKey="earnings"
                    name="Earnings (ETB)"
                    fill="#8b5cf6"
                    radius={[4, 4, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        {/* Recent transactions */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Recent Transactions</CardTitle>
            <CardDescription>Latest payment activity</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            {recentTransactions.length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-8">
                No transactions yet
              </p>
            )}
            {recentTransactions.map((tx: any) => (
              <div
                key={tx.transaction_id}
                className="flex items-center justify-between rounded-lg border px-3 py-2 text-sm"
              >
                <div className="min-w-0">
                  <p className="font-medium truncate">
                    {tx.student?.user?.name ?? "Student"}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {tx.booking?.slot?.subject?.name ?? "Session"}
                  </p>
                </div>
                <div className="flex flex-col items-end gap-1 shrink-0 ml-2">
                  <span className="font-semibold text-xs">
                    {Number(tx.total_amount ?? 0).toFixed(0)} ETB
                  </span>
                  <span
                    className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full capitalize ${PAYOUT_COLORS[tx.payout_status] ?? "bg-muted text-muted-foreground"}`}
                  >
                    {tx.payout_status ?? "pending"}
                  </span>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </>
  );
}
