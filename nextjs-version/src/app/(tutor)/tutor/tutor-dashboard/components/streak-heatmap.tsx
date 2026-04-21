"use client"

import * as React from "react"
import { Flame, Trophy } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { cn } from "@/lib/utils"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"

interface HeatmapCalendarProps {
  data: { date: string; intensity: number }[]
  className?: string
}

export function HeatmapCalendar({ data, className }: HeatmapCalendarProps) {
  const getLevel = (intensity: number) => {
    if (intensity === 0) return "bg-muted/30"
    if (intensity === 1) return "bg-blue-200 dark:bg-blue-900/40"
    if (intensity === 2) return "bg-blue-400 dark:bg-blue-800/60"
    if (intensity === 3) return "bg-blue-600 dark:bg-blue-700/80"
    return "bg-blue-800 dark:bg-blue-500"
  }

  // Show fewer cells on mobile to prevent overflow
  const mobileData = data.slice(-70)   // last 70 days on mobile
  const desktopData = data              // all 140 on desktop

  return (
    <TooltipProvider>
      {/* Mobile: 10 cols × 7 rows = 70 cells */}
      <div className={cn("grid grid-cols-[repeat(10,minmax(0,1fr))] gap-1 sm:hidden", className)}>
        {mobileData.map((item, idx) => (
          <Tooltip key={idx}>
            <TooltipTrigger asChild>
              <div className={cn("h-4 w-full rounded-sm transition-all hover:ring-1 hover:ring-primary/50 cursor-help", getLevel(item.intensity))} />
            </TooltipTrigger>
            <TooltipContent side="top" className="text-[10px] px-2 py-1">
              <span className="font-bold">{item.date}</span>: {item.intensity * 2} sessions
            </TooltipContent>
          </Tooltip>
        ))}
      </div>
      {/* Desktop: 20 cols × 7 rows = 140 cells */}
      <div className={cn("hidden sm:grid grid-cols-[repeat(20,minmax(0,1fr))] gap-1.5", className)}>
        {desktopData.map((item, idx) => (
          <Tooltip key={idx}>
            <TooltipTrigger asChild>
              <div className={cn("h-3 w-3 rounded-sm transition-all hover:ring-2 hover:ring-primary/50 cursor-help", getLevel(item.intensity))} />
            </TooltipTrigger>
            <TooltipContent side="top" className="text-[10px] px-2 py-1">
              <span className="font-bold">{item.date}</span>: {item.intensity * 2} sessions
            </TooltipContent>
          </Tooltip>
        ))}
      </div>
    </TooltipProvider>
  )
}

interface StreakCardProps {
  currentStreak: number
  longestStreak: number
  heatmapData: { date: string; intensity: number }[]
  className?: string
}

export function StreakCard({ currentStreak, longestStreak, heatmapData, className }: StreakCardProps) {
  return (
    <Card className={cn("overflow-hidden border-border bg-card shadow-sm", className)}>
      <CardHeader className="pb-3">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <CardTitle className="text-base font-bold flex items-center gap-2">
            Activity Insights
            <span className="text-xs font-normal text-muted-foreground">(Last 140 days)</span>
          </CardTitle>
          <div className="flex items-center gap-4">
            <div className="flex flex-col items-start sm:items-end">
              <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Current Streak</span>
              <div className="flex items-center gap-1 text-orange-500 font-black">
                <Flame className="h-4 w-4 fill-current" />
                <span>{currentStreak} days</span>
              </div>
            </div>
            <div className="flex flex-col items-start sm:items-end">
              <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Best Streak</span>
              <div className="flex items-center gap-1 text-primary font-black">
                <Trophy className="h-4 w-4" />
                <span>{longestStreak} days</span>
              </div>
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col gap-4">
          <HeatmapCalendar data={heatmapData} />
          <div className="flex items-center gap-4 text-[10px] text-muted-foreground font-medium">
             <span>Less</span>
             <div className="flex gap-1">
                <div className="h-2.5 w-2.5 rounded-sm bg-muted/30" />
                <div className="h-2.5 w-2.5 rounded-sm bg-blue-200 dark:bg-blue-900/40" />
                <div className="h-2.5 w-2.5 rounded-sm bg-blue-400 dark:bg-blue-800/60" />
                <div className="h-2.5 w-2.5 rounded-sm bg-blue-600 dark:bg-blue-700/80" />
                <div className="h-2.5 w-2.5 rounded-sm bg-blue-800 dark:bg-blue-500" />
             </div>
             <span>More</span>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
