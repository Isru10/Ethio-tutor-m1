"use client"

import * as React from "react"
import { type LucideIcon, ArrowUpRight, ArrowDownRight } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { cn } from "@/lib/utils"

interface KpiCardProps {
  title: string
  value: string | number
  icon: LucideIcon
  className?: string
  trend?: {
    value: string
    isUp: boolean
    label?: string
  }
}

export function KpiCard({ title, value, icon: Icon, className, trend }: KpiCardProps) {
  return (
    <Card className={cn("overflow-hidden border-border bg-card shadow-sm transition-all hover:shadow-md hover:scale-[1.02]", className)}>
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">{title}</p>
            <div className="flex items-baseline gap-2">
              <h3 className="text-2xl font-bold tracking-tight">{value}</h3>
              {trend && (
                <div className={cn(
                  "flex items-center text-xs font-bold px-1.5 py-0.5 rounded-full",
                  trend.isUp ? "bg-green-500/10 text-green-600 dark:text-green-400" : "bg-red-500/10 text-red-600 dark:text-red-400"
                )}>
                  {trend.isUp ? <ArrowUpRight className="h-3 w-3 mr-0.5" /> : <ArrowDownRight className="h-3 w-3 mr-0.5" />}
                  {trend.value}
                </div>
              )}
            </div>
            {trend?.label && (
              <p className="text-[10px] text-muted-foreground">{trend.label}</p>
            )}
          </div>
          <div className="rounded-xl bg-accent/50 p-3 text-accent-foreground ring-1 ring-border/20">
            <Icon className="h-5 w-5" />
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

interface TimeSpentCardProps {
  today: string
  week: string
  month: string
  className?: string
}

export function TimeSpentCard({ today, week, month, className }: TimeSpentCardProps) {
  return (
    <Card className={cn("overflow-hidden border-border bg-card shadow-sm", className)}>
      <CardContent className="p-0">
        <div className="grid grid-cols-3 divide-x divide-border">
          <div className="p-6 space-y-1 flex flex-col items-center justify-center text-center">
             <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Today</span>
             <span className="text-xl font-bold">{today}</span>
          </div>
          <div className="p-6 space-y-1 flex flex-col items-center justify-center text-center bg-accent/10">
             <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">This Week</span>
             <span className="text-xl font-bold">{week}</span>
          </div>
          <div className="p-6 space-y-1 flex flex-col items-center justify-center text-center">
             <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">This Month</span>
             <span className="text-xl font-bold">{month}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
