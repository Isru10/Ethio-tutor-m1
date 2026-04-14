"use client"

import * as React from "react"
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  ResponsiveContainer,
  LineChart,
  Line,
  Cell
} from "recharts"
import { 
  TrendingUp, 
  Users, 
  Lock, 
  ArrowUpRight,
  Search,
  BookMarked
} from "lucide-react"
import { 
  PageHeader, 
  SectionContainer, 
  AnalyticsCard, 
  ProgressStepper, 
  CallToAction 
} from "@/components/onboarding/onboarding-components"
import { 
  ChartContainer, 
  ChartTooltip, 
  ChartTooltipContent,
  type ChartConfig
} from "@/components/ui/chart"
import { Badge } from "@/components/ui/badge"

const onboardingSteps = [
  { title: "Training", status: "complete" as const },
  { title: "Our Values", status: "complete" as const },
  { title: "Niches", status: "current" as const },
  { title: "Review", status: "upcoming" as const },
]

const demandData = [
  { subject: "Mathematics", demand: 85, competition: "Medium" },
  { subject: "Physics", demand: 72, competition: "Low" },
  { subject: "English Literature", demand: 68, competition: "High" },
  { subject: "Computer Science", demand: 94, competition: "Medium" },
  { subject: "Music", demand: 45, competition: "Low" },
  { subject: "Chemistry", demand: 78, competition: "Medium" },
]

const trendData = [
  { month: "Jan", students: 1200 },
  { month: "Feb", students: 1500 },
  { month: "Mar", students: 1800 },
  { month: "Apr", students: 2200 },
  { month: "May", students: 2600 },
  { month: "Jun", students: 3100 },
]

const chartConfig = {
  demand: {
    label: "Market Demand",
    color: "hsl(var(--primary))",
  },
} satisfies ChartConfig

const trendConfig = {
  students: {
    label: "Total Students",
    color: "hsl(var(--primary))",
  },
} satisfies ChartConfig

export default function PreferredNichesPage() {
  return (
    <SectionContainer>
      <ProgressStepper steps={onboardingSteps} />
      
      <PageHeader 
        title="High-Demand Niches" 
        description="Our platform analytics show where student demand is highest. Use these insights to specialize and grow your business faster."
      />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <AnalyticsCard 
          title="Subject Demand Overview" 
          subtitle="Relative student demand across popular subjects"
          className="lg:col-span-1"
        >
          <ChartContainer config={chartConfig} className="h-[300px] w-full mt-4">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={demandData}>
                <CartesianGrid vertical={false} strokeDasharray="3 3" className="stroke-muted" />
                <XAxis 
                  dataKey="subject" 
                  tickLine={false} 
                  axisLine={false} 
                  tick={{ fontSize: 10 }}
                  interval={0}
                />
                <YAxis hide />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Bar dataKey="demand" radius={[4, 4, 0, 0]}>
                  {demandData.map((entry, index) => (
                    <Cell 
                      key={`cell-${index}`} 
                      fill={`var(--color-chart-${(index % 5) + 1})`} 
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </ChartContainer>
          <div className="mt-4 flex flex-wrap gap-2">
            <Badge variant="outline" className="bg-primary/5 text-primary border-primary/20">
              <ArrowUpRight className="h-3 w-3 mr-1" /> Computer Science is up 24%
            </Badge>
            <Badge variant="outline" className="bg-green-500/5 text-green-600 border-green-500/20">
              <Users className="h-3 w-3 mr-1" /> High demand for Physics tutors
            </Badge>
          </div>
        </AnalyticsCard>

        <AnalyticsCard 
          title="Growth Projection" 
          subtitle="Estimated platform student growth over time"
          trend={{ label: "MoM", value: "+18%", isUp: true }}
          className="lg:col-span-1"
        >
          <ChartContainer config={trendConfig} className="h-[300px] w-full mt-4">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={trendData}>
                <CartesianGrid vertical={false} strokeDasharray="3 3" className="stroke-muted" />
                <XAxis 
                  dataKey="month" 
                  tickLine={false} 
                  axisLine={false} 
                  tickMargin={10}
                />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Line 
                  type="monotone" 
                  dataKey="students" 
                  stroke="hsl(var(--primary))" 
                  strokeWidth={3} 
                  dot={{ r: 4, fill: "hsl(var(--primary))", strokeWidth: 0 }}
                  activeDot={{ r: 6, strokeWidth: 0 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </ChartContainer>
          <p className="mt-4 text-xs text-muted-foreground italic">
            * Based on internal platform historical data and search trends.
          </p>
        </AnalyticsCard>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
        <AnalyticsCard title="Top Subject" value="Computer Science" subtitle="94% Demand Score" />
        <AnalyticsCard title="Easiest Entry" value="Physics" subtitle="Low Competition" />
        <AnalyticsCard title="Trending" value="Creative Writing" subtitle="+45% Interest" />
      </div>

      <CallToAction 
        title="Still have questions?" 
        description="We've compiled the most common questions from our tutor community to help you hit the ground running."
        buttonText="Next: FAQ"
        href="/faq"
        className="mt-16"
      />
    </SectionContainer>
  )
}
