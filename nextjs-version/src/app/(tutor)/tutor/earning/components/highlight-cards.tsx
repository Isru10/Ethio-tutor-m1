"use client"

import * as React from "react"
import { Trophy, Star, ArrowUpRight, Target } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { cn } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"

interface HighlightCardProps {
  title: string
  subtitle: string
  value: string
  metric: string
  icon: React.ReactNode
  accentColor?: string
  className?: string
}

function HighlightCard({ title, subtitle, value, metric, icon, accentColor, className }: HighlightCardProps) {
  return (
    <Card className={cn("overflow-hidden border-border bg-card shadow-sm group hover:border-primary/50 transition-all", className)}>
      <div className={cn("h-1.5 w-full", accentColor || "bg-primary")} />
      <CardContent className="p-6">
        <div className="flex items-start justify-between mb-4">
          <div className="space-y-1">
            <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">{subtitle}</p>
            <h3 className="text-xl font-bold tracking-tight group-hover:text-primary transition-colors">{title}</h3>
          </div>
          <div className="h-10 w-10 rounded-xl bg-accent/50 flex items-center justify-center border border-border group-hover:bg-primary/10 transition-colors">
            {icon}
          </div>
        </div>
        <div className="flex items-end justify-between mt-6 pt-6 border-t border-border/50">
          <div className="space-y-0.5">
            <span className="text-3xl font-black">{value}</span>
            <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider">{metric}</p>
          </div>
          <Badge className="bg-primary/10 text-primary border-primary/20 flex gap-1 h-6">
            <ArrowUpRight className="h-3 w-3" />
            <span className="text-[10px] font-black italic">TOP PICK</span>
          </Badge>
        </div>
      </CardContent>
    </Card>
  )
}

export function TopPerformingCards() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <HighlightCard 
        title="Advanced Mathematics"
        subtitle="Highly Profitable Niche"
        value="$4,250"
        metric="Total Net Profit"
        icon={<Target className="h-5 w-5 text-primary" />}
        accentColor="bg-blue-600"
      />
      <HighlightCard 
        title="Quantum Mechanics Masterclass"
        subtitle="Highest Single Session"
        value="$850"
        metric="One-time Session Payout"
        icon={<Trophy className="h-5 w-5 text-amber-500" />}
        accentColor="bg-amber-500"
      />
    </div>
  )
}
