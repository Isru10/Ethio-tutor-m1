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
  Cell
} from "recharts"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from "@/components/ui/chart"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { cn } from "@/lib/utils"

// Example Data
const timeSpentData = [
  { day: "Mon", hours: 4.5, sessions: 3 },
  { day: "Tue", hours: 6.2, sessions: 5 },
  { day: "Wed", hours: 5.8, sessions: 4 },
  { day: "Thu", hours: 7.4, sessions: 6 },
  { day: "Fri", hours: 8.1, sessions: 7 },
  { day: "Sat", hours: 3.2, sessions: 2 },
  { day: "Sun", hours: 2.5, sessions: 2 },
]

const subjectDistributionData = [
  { subject: "Mathematics", value: 45, color: "var(--color-chart-1)" },
  { subject: "Physics", value: 25, color: "var(--color-chart-2)" },
  { subject: "Computer Science", value: 15, color: "var(--color-chart-3)" },
  { subject: "English", value: 10, color: "var(--color-chart-4)" },
  { subject: "Others", value: 5, color: "var(--color-chart-5)" },
]

const chartConfig = {
  hours: {
    label: "Hours Spent",
    color: "#2563eb", // blue-600
  },
  value: {
    label: "Total Sessions",
    color: "#2563eb",
  },
} satisfies ChartConfig

export function AnalyticsCharts({ className }: { className?: string }) {
  return (
    <Card className={cn("border-border bg-card shadow-sm", className)}>
      <CardHeader className="flex flex-row items-center justify-between pb-2 border-b">
        <div>
          <CardTitle className="text-base font-bold">Advanced Analytics</CardTitle>
          <CardDescription className="text-[10px] uppercase font-bold tracking-widest mt-1">Teaching Insights & Distribution</CardDescription>
        </div>
      </CardHeader>
      <CardContent className="p-6">
        <Tabs defaultValue="time" className="w-full space-y-6">
          <TabsList className="grid w-[400px] grid-cols-2 h-9">
            <TabsTrigger value="time" className="text-xs font-bold">Time Investment</TabsTrigger>
            <TabsTrigger value="distribution" className="text-xs font-bold">Subject Distribution</TabsTrigger>
          </TabsList>
          
          <TabsContent value="time" className="space-y-4">
             <div className="flex items-center justify-between text-xs font-medium text-muted-foreground px-1">
               <span>Daily Hours (Last 7 Days)</span>
               <span className="text-primary font-bold">Avg. 5.4h / day</span>
             </div>
             <ChartContainer config={chartConfig} className="h-[300px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={timeSpentData} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorHours" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#2563eb" stopOpacity={0.6} />
                        <stop offset="95%" stopColor="#2563eb" stopOpacity={0.1} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid vertical={false} strokeDasharray="3 3" className="stroke-muted/30" />
                    <XAxis 
                      dataKey="day" 
                      axisLine={false} 
                      tickLine={false} 
                      tick={{ fontSize: 11, fontWeight: 500 }}
                      className="text-muted-foreground"
                    />
                    <YAxis 
                      hide
                    />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <Area
                      type="monotone"
                      dataKey="hours"
                      stroke="#2563eb"
                      strokeWidth={3}
                      fill="url(#colorHours)"
                      animationDuration={1500}
                    />
                  </AreaChart>
                </ResponsiveContainer>
             </ChartContainer>
          </TabsContent>

          <TabsContent value="distribution" className="space-y-4">
             <div className="flex items-center justify-between text-xs font-medium text-muted-foreground px-1">
               <span>Engagement by Category (%)</span>
               <span className="text-primary font-bold">Top: Mathematics</span>
             </div>
             <ChartContainer config={chartConfig} className="h-[300px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={subjectDistributionData} layout="vertical" margin={{ left: -20, right: 20 }}>
                    <CartesianGrid horizontal={false} strokeDasharray="3 3" className="stroke-muted/30" />
                    <XAxis type="number" hide />
                    <YAxis 
                      dataKey="subject" 
                      type="category" 
                      axisLine={false} 
                      tickLine={false}
                      className="text-xs font-bold"
                      width={120}
                    />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <Bar dataKey="value" radius={[0, 4, 4, 0]} barSize={24}>
                       {subjectDistributionData.map((entry, index) => (
                         <Cell key={`cell-${index}`} fill={`var(--color-chart-${(index % 5) + 1})`} />
                       ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
             </ChartContainer>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  )
}
