"use client"

import * as React from "react"
import { type LucideIcon, ArrowUpRight, ArrowDownRight, CircleDollarSign } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { cn } from "@/lib/utils"

interface KpiCardProps {
  title: string
  value: string
  icon: LucideIcon
  className?: string
  trend?: {
    value: string
    isUp: boolean
  }
  description?: string
}

export function KpiCard({ title, value, icon: Icon, className, trend, description }: KpiCardProps) {
  return (
    <Card className={cn("overflow-hidden border-border bg-card shadow-sm transition-all hover:shadow-md", className)}>
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">{title}</p>
            <div className="flex items-baseline gap-2">
              <h3 className="text-2xl font-bold tracking-tight">{value}</h3>
              {trend && (
                <div className={cn(
                  "flex items-center text-[10px] font-black px-2 py-0.5 rounded-full",
                  trend.isUp ? "bg-green-500/10 text-green-600 dark:text-green-400" : "bg-red-500/10 text-red-600 dark:text-red-400"
                )}>
                  {trend.isUp ? <ArrowUpRight className="h-3 w-3 mr-0.5" /> : <ArrowDownRight className="h-3 w-3 mr-0.5" />}
                  {trend.value}
                </div>
              )}
            </div>
            {description && (
              <p className="text-[10px] text-muted-foreground font-medium">{description}</p>
            )}
          </div>
          <div className="rounded-2xl bg-primary/10 p-3.5 text-primary border border-primary/20 shadow-inner">
            <Icon className="h-5 w-5" />
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

export function EarningsBalanceCard({ total, pending, withdrawn }: { total: string, pending: string, withdrawn: string }) {
  return (
    <Card className="overflow-hidden border-primary/20 bg-primary/5 shadow-xl border-2">
      <div className="grid grid-cols-1 md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-primary/10">
        <div className="p-6 space-y-1.5">
           <div className="flex items-center gap-2 text-primary">
              <CircleDollarSign className="h-4 w-4" />
              <span className="text-[10px] font-bold uppercase tracking-widest">Total Revenue</span>
           </div>
           <p className="text-4xl font-black tracking-tighter">{total}</p>
           <p className="text-[10px] text-muted-foreground font-bold">Lifetime earnings on platform</p>
        </div>
        <div className="p-6 space-y-1.5 bg-background/50">
           <div className="flex items-center gap-2 text-amber-500">
              <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Available to Withdraw</span>
           </div>
           <p className="text-2xl font-bold">{pending}</p>
           <div className="w-full bg-muted h-1.5 rounded-full mt-2 overflow-hidden">
              <div className="bg-amber-500 h-full w-[65%]" />
           </div>
        </div>
        <div className="p-6 space-y-1.5">
           <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Already Withdrawn</span>
           <p className="text-2xl font-bold">{withdrawn}</p>
           <p className="text-[10px] text-muted-foreground font-medium italic">Sent to your primary account</p>
        </div>
      </div>
    </Card>
  )
}
