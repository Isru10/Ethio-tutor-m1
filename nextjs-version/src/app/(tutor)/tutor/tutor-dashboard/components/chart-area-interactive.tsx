"use client"

import * as React from "react"
import { Area, AreaChart, CartesianGrid, XAxis } from "recharts"

import { useIsMobile } from "@/hooks/use-mobile"
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  type ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  ToggleGroup,
  ToggleGroupItem,
} from "@/components/ui/toggle-group"

export const description = "An interactive area chart"

const chartData = [
  { date: "2024-04-01", earnings: 222, bookings: 150 },
  { date: "2024-04-02", earnings: 97, bookings: 180 },
  { date: "2024-04-03", earnings: 167, bookings: 120 },
  { date: "2024-04-04", earnings: 242, bookings: 260 },
  { date: "2024-04-05", earnings: 373, bookings: 290 },
  { date: "2024-04-06", earnings: 301, bookings: 340 },
  { date: "2024-04-07", earnings: 245, bookings: 180 },
  { date: "2024-04-08", earnings: 409, bookings: 320 },
  { date: "2024-04-09", earnings: 59, bookings: 110 },
  { date: "2024-04-10", earnings: 261, bookings: 190 },
  { date: "2024-04-11", earnings: 327, bookings: 350 },
  { date: "2024-04-12", earnings: 292, bookings: 210 },
  { date: "2024-04-13", earnings: 342, bookings: 380 },
  { date: "2024-04-14", earnings: 137, bookings: 220 },
  { date: "2024-04-15", earnings: 120, bookings: 170 },
  { date: "2024-04-16", earnings: 138, bookings: 190 },
  { date: "2024-04-17", earnings: 446, bookings: 360 },
  { date: "2024-04-18", earnings: 364, bookings: 410 },
  { date: "2024-04-19", earnings: 243, bookings: 180 },
  { date: "2024-04-20", earnings: 89, bookings: 150 },
  { date: "2024-04-21", earnings: 137, bookings: 200 },
  { date: "2024-04-22", earnings: 224, bookings: 170 },
  { date: "2024-04-23", earnings: 138, bookings: 230 },
  { date: "2024-04-24", earnings: 387, bookings: 290 },
  { date: "2024-04-25", earnings: 215, bookings: 250 },
  { date: "2024-04-26", earnings: 75, bookings: 130 },
  { date: "2024-04-27", earnings: 383, bookings: 420 },
  { date: "2024-04-28", earnings: 122, bookings: 180 },
  { date: "2024-04-29", earnings: 315, bookings: 240 },
  { date: "2024-04-30", earnings: 454, bookings: 380 },
  { date: "2024-05-01", earnings: 165, bookings: 220 },
  { date: "2024-05-02", earnings: 293, bookings: 310 },
  { date: "2024-05-03", earnings: 247, bookings: 190 },
  { date: "2024-05-04", earnings: 385, bookings: 420 },
  { date: "2024-05-05", earnings: 481, bookings: 390 },
  { date: "2024-05-06", earnings: 498, bookings: 520 },
  { date: "2024-05-07", earnings: 388, bookings: 300 },
  { date: "2024-05-08", earnings: 149, bookings: 210 },
  { date: "2024-05-09", earnings: 227, bookings: 180 },
  { date: "2024-05-10", earnings: 293, bookings: 330 },
  { date: "2024-05-11", earnings: 335, bookings: 270 },
  { date: "2024-05-12", earnings: 197, bookings: 240 },
  { date: "2024-05-13", earnings: 197, bookings: 160 },
  { date: "2024-05-14", earnings: 448, bookings: 490 },
  { date: "2024-05-15", earnings: 473, bookings: 380 },
  { date: "2024-05-16", earnings: 338, bookings: 400 },
  { date: "2024-05-17", earnings: 499, bookings: 420 },
  { date: "2024-05-18", earnings: 315, bookings: 350 },
  { date: "2024-05-19", earnings: 235, bookings: 180 },
  { date: "2024-05-20", earnings: 177, bookings: 230 },
  { date: "2024-05-21", earnings: 82, bookings: 140 },
  { date: "2024-05-22", earnings: 81, bookings: 120 },
  { date: "2024-05-23", earnings: 252, bookings: 290 },
  { date: "2024-05-24", earnings: 294, bookings: 220 },
  { date: "2024-05-25", earnings: 201, bookings: 250 },
  { date: "2024-05-26", earnings: 213, bookings: 170 },
  { date: "2024-05-27", earnings: 420, bookings: 460 },
  { date: "2024-05-28", earnings: 233, bookings: 190 },
  { date: "2024-05-29", earnings: 78, bookings: 130 },
  { date: "2024-05-30", earnings: 340, bookings: 280 },
  { date: "2024-05-31", earnings: 178, bookings: 230 },
  { date: "2024-06-01", earnings: 178, bookings: 200 },
  { date: "2024-06-02", earnings: 470, bookings: 410 },
  { date: "2024-06-03", earnings: 103, bookings: 160 },
  { date: "2024-06-04", earnings: 439, bookings: 380 },
  { date: "2024-06-05", earnings: 88, bookings: 140 },
  { date: "2024-06-06", earnings: 294, bookings: 250 },
  { date: "2024-06-07", earnings: 323, bookings: 370 },
  { date: "2024-06-08", earnings: 385, bookings: 320 },
  { date: "2024-06-09", earnings: 438, bookings: 480 },
  { date: "2024-06-10", earnings: 155, bookings: 200 },
  { date: "2024-06-11", earnings: 92, bookings: 150 },
  { date: "2024-06-12", earnings: 492, bookings: 420 },
  { date: "2024-06-13", earnings: 81, bookings: 130 },
  { date: "2024-06-14", earnings: 426, bookings: 380 },
  { date: "2024-06-15", earnings: 307, bookings: 350 },
  { date: "2024-06-16", earnings: 371, bookings: 310 },
  { date: "2024-06-17", earnings: 475, bookings: 520 },
  { date: "2024-06-18", earnings: 107, bookings: 170 },
  { date: "2024-06-19", earnings: 341, bookings: 290 },
  { date: "2024-06-20", earnings: 408, bookings: 450 },
  { date: "2024-06-21", earnings: 169, bookings: 210 },
  { date: "2024-06-22", earnings: 317, bookings: 270 },
  { date: "2024-06-23", earnings: 480, bookings: 530 },
  { date: "2024-06-24", earnings: 132, bookings: 180 },
  { date: "2024-06-25", earnings: 141, bookings: 190 },
  { date: "2024-06-26", earnings: 434, bookings: 380 },
  { date: "2024-06-27", earnings: 448, bookings: 490 },
  { date: "2024-06-28", earnings: 149, bookings: 200 },
  { date: "2024-06-29", earnings: 103, bookings: 160 },
  { date: "2024-06-30", earnings: 446, bookings: 400 },
]

const chartConfig = {
  visitors: {
    label: "Visitors",
  },
  earnings: {
    label: "earnings",
    color: "var(--primary)",
  },
  bookings: {
    label: "bookings",
    color: "var(--primary)",
  },
} satisfies ChartConfig

export function ChartAreaInteractive() {
  const isMobile = useIsMobile()
  const [timeRange, setTimeRange] = React.useState("90d")

  React.useEffect(() => {
    if (isMobile) {
      setTimeRange("7d")
    }
  }, [isMobile])

  const filteredData = chartData.filter((item) => {
    const date = new Date(item.date)
    const referenceDate = new Date("2024-06-30")
    let daysToSubtract = 90
    if (timeRange === "30d") {
      daysToSubtract = 30
    } else if (timeRange === "7d") {
      daysToSubtract = 7
    }
    const startDate = new Date(referenceDate)
    startDate.setDate(startDate.getDate() - daysToSubtract)
    return date >= startDate
  })

  return (
    <Card className="@container/card">
      <CardHeader>
        <CardTitle>Total Earnings Vs Bookings</CardTitle>
        <CardDescription>
          <span className="hidden @[540px]/card:block">
            Total 
          </span>
          <span className="@[540px]/card:hidden">Last 3 months</span>
        </CardDescription>
        <CardAction>
          <ToggleGroup
            type="single"
            value={timeRange}
            onValueChange={setTimeRange}
            variant="outline"
            className="hidden *:data-[slot=toggle-group-item]:!px-4 @[767px]/card:flex"
          >
            <ToggleGroupItem value="90d">Last 3 months</ToggleGroupItem>
            <ToggleGroupItem value="30d">Last 30 days</ToggleGroupItem>
            <ToggleGroupItem value="7d">Last 7 days</ToggleGroupItem>
          </ToggleGroup>
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger
              className="flex w-40 **:data-[slot=select-value]:block **:data-[slot=select-value]:truncate @[767px]/card:hidden"
              size="sm"
              aria-label="Select a value"
            >
              <SelectValue placeholder="Last 3 months" />
            </SelectTrigger>
            <SelectContent className="rounded-xl">
              <SelectItem value="90d" className="rounded-lg">
                Last 3 months
              </SelectItem>
              <SelectItem value="30d" className="rounded-lg">
                Last 30 days
              </SelectItem>
              <SelectItem value="7d" className="rounded-lg">
                Last 7 days
              </SelectItem>
            </SelectContent>
          </Select>
        </CardAction>
      </CardHeader>
      <CardContent className="px-2 pt-4 sm:px-6 sm:pt-6">
        <ChartContainer
          config={chartConfig}
          className="aspect-auto h-[250px] w-full"
        >
          <AreaChart data={filteredData}>
            <defs>
              <linearGradient id="fillearnings" x1="0" y1="0" x2="0" y2="1">
                <stop
                  offset="5%"
                  stopColor="var(--color-earnings)"
                  stopOpacity={1.0}
                />
                <stop
                  offset="95%"
                  stopColor="var(--color-earnings)"
                  stopOpacity={0.1}
                />
              </linearGradient>
              <linearGradient id="fillbookings" x1="0" y1="0" x2="0" y2="1">
                <stop
                  offset="5%"
                  stopColor="var(--color-bookings)"
                  stopOpacity={0.8}
                />
                <stop
                  offset="95%"
                  stopColor="var(--color-bookings)"
                  stopOpacity={0.1}
                />
              </linearGradient>
            </defs>
            <CartesianGrid vertical={false} />
            <XAxis
              dataKey="date"
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              minTickGap={32}
              tickFormatter={(value) => {
                const date = new Date(value)
                return date.toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                })
              }}
            />
            <ChartTooltip
              cursor={false}
              content={
                <ChartTooltipContent
                  labelFormatter={(value) => {
                    return new Date(value as string | number | Date).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                    })
                  }}
                  indicator="dot"
                />
              }
            />
            <Area
              dataKey="bookings"
              type="natural"
              fill="url(#fillbookings)"
              stroke="var(--color-bookings)"
              stackId="a"
            />
            <Area
              dataKey="earnings"
              type="natural"
              fill="url(#fillearnings)"
              stroke="var(--color-earnings)"
              stackId="a"
            />
          </AreaChart>
        </ChartContainer>
      </CardContent>
    </Card>
  )
}