"use client"

import * as React from "react"
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  XAxis,
  YAxis,
  ResponsiveContainer,
  Cell,
  Tooltip
} from "recharts"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from "@/components/ui/chart"
import { SESSIONS_BY_DATE, SESSIONS_PER_TEACHER } from "@/lib/mock-data"

const sessionsConfig = {
  count: {
    label: "Sessions",
    color: "hsl(var(--primary))",
  },
} satisfies ChartConfig

const teacherConfig = {
  count: {
    label: "Session Count",
    color: "hsl(var(--primary))",
  },
} satisfies ChartConfig

export function Charts() {
  return (
    <div className="grid gap-6 lg:grid-cols-2">
      {/* Sessions Over Time */}
      <Card className="border-none shadow-sm bg-card">
        <CardHeader className="pb-2">
          <CardTitle className="text-lg font-bold">Sessions Over Time</CardTitle>
          <CardDescription className="text-xs uppercase font-bold tracking-widest text-muted-foreground">
            Activity level in the last 15 days
          </CardDescription>
        </CardHeader>
        <CardContent className="p-6 pt-2">
          <ChartContainer config={sessionsConfig} className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={SESSIONS_BY_DATE} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorSessions" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid vertical={false} strokeDasharray="3 3" className="stroke-muted/30" />
                <XAxis
                  dataKey="date"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }}
                  tickFormatter={(value) => value.split("-")[2]}
                />
                <YAxis
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }}
                />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Area
                  type="monotone"
                  dataKey="count"
                  stroke="#2563eb"
                  strokeWidth={3}
                  fill="url(#colorSessions)"
                  animationDuration={1500}
                />
              </AreaChart>
            </ResponsiveContainer>
          </ChartContainer>
        </CardContent>
      </Card>

      {/* Sessions Per Teacher */}
      <Card className="border-none shadow-sm bg-card">
        <CardHeader className="pb-2">
          <CardTitle className="text-lg font-bold">Sessions Per Teacher</CardTitle>
          <CardDescription className="text-xs uppercase font-bold tracking-widest text-muted-foreground">
            Distribution by educator
          </CardDescription>
        </CardHeader>
        <CardContent className="p-6 pt-2">
          <ChartContainer config={teacherConfig} className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={SESSIONS_PER_TEACHER} layout="vertical" margin={{ left: 40, right: 20 }}>
                <CartesianGrid horizontal={false} strokeDasharray="3 3" className="stroke-muted/30" />
                <XAxis type="number" hide />
                <YAxis
                  dataKey="name"
                  type="category"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 10, fontWeight: 600 }}
                  width={100}
                />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Bar dataKey="count" radius={[0, 4, 4, 0]} barSize={20}>
                  {SESSIONS_PER_TEACHER.map((entry, index) => (
                    <Cell 
                      key={`cell-${index}`} 
                      fill={`var(--color-chart-${(index % 5) + 1})`} 
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </ChartContainer>
        </CardContent>
      </Card>
    </div>
  )
}
