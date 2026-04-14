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
  Line,
  ResponsiveContainer,
  ComposedChart,
  Cell,
  Tooltip as RechartsTooltip
} from "recharts"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from "@/components/ui/chart"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

// Multi-axis data
const correlationData = [
  { period: "Jan", earnings: 12500, sessions: 18 },
  { period: "Feb", earnings: 18200, sessions: 24 },
  { period: "Mar", earnings: 16800, sessions: 22 },
  { period: "Apr", earnings: 24400, sessions: 32 },
  { period: "May", earnings: 26600, sessions: 35 },
  { period: "Jun", earnings: 32200, sessions: 42 },
]

const subjectProfitabilityData = [
  { subject: "Advanced Math", profit: 18400, color: "var(--color-chart-1)" },
  { subject: "Quantum Physics", profit: 14200, color: "var(--color-chart-2)" },
  { subject: "Data Science", profit: 11500, color: "var(--color-chart-3)" },
  { subject: "Web Development", profit: 9800, color: "var(--color-chart-4)" },
  { subject: "SAT Prep", profit: 7200, color: "var(--color-chart-5)" },
]

const chartConfig = {
  earnings: {
    label: "Earnings (ETB)",
    color: "#2563eb",
  },
  sessions: {
    label: "Total Sessions",
    color: "#10b981",
  },
} satisfies ChartConfig

export function EarningsCharts() {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
      <Card className="lg:col-span-2 border-border bg-card shadow-sm">
        <CardHeader className="flex flex-row items-center justify-between pb-4 border-b">
          <div className="space-y-1">
            <CardTitle className="text-base font-bold">Earnings vs. Volume</CardTitle>
            <CardDescription className="text-[10px] uppercase font-bold tracking-widest text-muted-foreground">Correlation Analysis</CardDescription>
          </div>
          <Tabs defaultValue="6m" className="w-[180px]">
             <TabsList className="grid grid-cols-2 h-8">
               <TabsTrigger value="3m" className="text-[10px] font-bold">3 Months</TabsTrigger>
               <TabsTrigger value="6m" className="text-[10px] font-bold">6 Months</TabsTrigger>
             </TabsList>
          </Tabs>
        </CardHeader>
        <CardContent className="p-6">
           <ChartContainer config={chartConfig} className="h-[350px] w-full">
             <ResponsiveContainer width="100%" height="100%">
               <ComposedChart data={correlationData} margin={{ top: 20, right: 30, left: 10, bottom: 0 }}>
                  <CartesianGrid vertical={false} strokeDasharray="3 3" className="stroke-muted/30" />
                  <XAxis 
                    dataKey="period" 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fontSize: 11, fontWeight: 700 }}
                    className="text-muted-foreground"
                  />
                  <YAxis 
                    yAxisId="left"
                    orientation="left"
                    axisLine={false} 
                    tickLine={false}
                    tick={{ fontSize: 10, fontWeight: 500 }}
                    tickFormatter={(v) => `$${v/1000}k`}
                  />
                  <YAxis 
                    yAxisId="right"
                    orientation="right"
                    axisLine={false} 
                    tickLine={false}
                    tick={{ fontSize: 10, fontWeight: 500 }}
                  />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Bar 
                    yAxisId="left" 
                    dataKey="earnings" 
                    fill="#3b82f6" 
                    radius={[4, 4, 0, 0]} 
                    barSize={40}
                  />
                  <Line
                    yAxisId="right"
                    type="monotone"
                    dataKey="sessions"
                    stroke="#10b981"
                    strokeWidth={3}
                    dot={{ r: 4, fill: "#10b981", strokeWidth: 2, stroke: "#fff" }}
                    activeDot={{ r: 6, strokeWidth: 0 }}
                  />
               </ComposedChart>
             </ResponsiveContainer>
           </ChartContainer>
        </CardContent>
      </Card>

      <Card className="border-border bg-card shadow-sm h-full flex flex-col">
        <CardHeader className="pb-4 border-b">
          <CardTitle className="text-base font-bold">Profit by Subject</CardTitle>
          <CardDescription className="text-[10px] uppercase font-bold tracking-widest text-muted-foreground">Performance Distribution</CardDescription>
        </CardHeader>
        <CardContent className="p-6 flex-1">
          <ChartContainer config={chartConfig} className="h-full min-h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={subjectProfitabilityData} layout="vertical" margin={{ left: -20 }}>
                <XAxis type="number" hide />
                <YAxis 
                  dataKey="subject" 
                  type="category" 
                  axisLine={false} 
                  tickLine={false}
                  className="text-[10px] font-black uppercase"
                  width={110}
                />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Bar dataKey="profit" radius={[0, 4, 4, 0]} barSize={20}>
                  {subjectProfitabilityData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={`var(--color-chart-${(index % 5) + 1})`} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </ChartContainer>
          <div className="mt-6 pt-6 border-t space-y-3">
             <div className="flex items-center justify-between text-[11px] font-bold uppercase tracking-tighter">
                <span className="text-muted-foreground">Top Performance</span>
                <span className="text-primary">+12.4%</span>
             </div>
             <p className="text-[10px] text-muted-foreground leading-relaxed">
               Your "Advanced Math" niche continues to be the primary revenue driver this quarter.
             </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
