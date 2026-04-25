"use client"

import { useEffect, useRef, useState } from "react"
import { BookCheck, Star, Zap, Users, TrendingUp, Clock, Award } from "lucide-react"
import { cn } from "@/lib/utils"
import type { SlotWithDetails } from "@/types/database"

interface ActivityItem {
  id: number
  icon: React.ElementType
  color: string
  bg: string
  text: string
  sub?: string
  time: string
}

function generateActivities(slots: SlotWithDetails[]): ActivityItem[] {
  const items: ActivityItem[] = []
  let id = 0

  slots.slice(0, 4).forEach(s => {
    items.push({
      id: id++,
      icon: Zap,
      color: "text-violet-500",
      bg: "bg-violet-500/10",
      text: `New: ${s.subject.name}`,
      sub: `with ${s.teacher.name}`,
      time: "just now",
    })
  })

  const statics: Omit<ActivityItem, "id">[] = [
    { icon: BookCheck, color: "text-green-500",  bg: "bg-green-500/10",  text: "Abebe booked Maths",       sub: "Grade 10 · 2 seats left",  time: "1m ago"  },
    { icon: Star,      color: "text-amber-500",  bg: "bg-amber-500/10",  text: "Tutor rated 5 ⭐",          sub: "Physics session",          time: "3m ago"  },
    { icon: Users,     color: "text-blue-500",   bg: "bg-blue-500/10",   text: "6 students browsing",      sub: "Most popular: Maths",      time: "live"    },
    { icon: Award,     color: "text-rose-500",   bg: "bg-rose-500/10",   text: "Tigist: 10 sessions 🎉",   sub: "Milestone reached",        time: "5m ago"  },
    { icon: BookCheck, color: "text-green-500",  bg: "bg-green-500/10",  text: "Sara booked Chemistry",    sub: "Grade 11 · Starting soon", time: "7m ago"  },
    { icon: TrendingUp,color: "text-violet-500", bg: "bg-violet-500/10", text: "Top today: Mathematics",   sub: "12 sessions booked",       time: "live"    },
    { icon: Clock,     color: "text-amber-500",  bg: "bg-amber-500/10",  text: "Starting in 5 min",        sub: "Chemistry · Dr. Kebede",   time: "live"    },
    { icon: BookCheck, color: "text-green-500",  bg: "bg-green-500/10",  text: "Dawit booked Physics",     sub: "Grade 9 · 3 seats left",   time: "9m ago"  },
    { icon: Star,      color: "text-amber-500",  bg: "bg-amber-500/10",  text: "New tutor joined",         sub: "Meron Alemu · Biology",    time: "12m ago" },
    { icon: Users,     color: "text-blue-500",   bg: "bg-blue-500/10",   text: "89 active tutors today",   sub: "Across all subjects",      time: "live"    },
    { icon: Award,     color: "text-rose-500",   bg: "bg-rose-500/10",   text: "1,240 sessions done",      sub: "This month",               time: "live"    },
    { icon: BookCheck, color: "text-green-500",  bg: "bg-green-500/10",  text: "Hana booked English",      sub: "Grade 12 · Last seat!",    time: "14m ago" },
  ]

  statics.forEach(item => items.push({ ...item, id: id++ }))
  return items.sort(() => Math.random() - 0.3)
}

function ActivityCard({ item, compact = false }: { item: ActivityItem; compact?: boolean }) {
  const Icon = item.icon
  const isLive = item.time === "live"

  return (
    <div className={cn(
      "flex items-start gap-2 rounded-xl border bg-card shadow-sm shrink-0",
      compact ? "p-2.5 w-[180px]" : "p-3 w-[220px]"
    )}>
      <div className={cn("flex shrink-0 items-center justify-center rounded-full", item.bg, compact ? "h-6 w-6" : "h-7 w-7")}>
        <Icon className={cn(item.color, compact ? "size-3" : "size-3.5")} />
      </div>
      <div className="min-w-0 flex-1">
        <p className={cn("font-semibold leading-tight truncate", compact ? "text-[10px]" : "text-xs")}>{item.text}</p>
        {item.sub && <p className="text-[10px] text-muted-foreground mt-0.5 truncate">{item.sub}</p>}
        <div className="flex items-center gap-1 mt-0.5">
          {isLive && <span className="h-1.5 w-1.5 rounded-full bg-green-500 animate-pulse" />}
          <span className={cn("text-[10px] font-medium", isLive ? "text-green-600 dark:text-green-400" : "text-muted-foreground")}>
            {item.time}
          </span>
        </div>
      </div>
    </div>
  )
}

interface ActivityFeedProps {
  slots: SlotWithDetails[]
  className?: string
}

export function ActivityFeed({ slots, className }: ActivityFeedProps) {
  const items = generateActivities(slots)
  const doubled = [...items, ...items]

  return (
    <>
      {/* ── Mobile: horizontal marquee ── */}
      <div className="xl:hidden overflow-hidden w-full">
        <div className="flex gap-2.5 animate-marquee-horizontal w-max">
          {doubled.map((item, i) => (
            <ActivityCard key={`h-${item.id}-${i}`} item={item} compact />
          ))}
        </div>
      </div>

      {/* ── Desktop: vertical snake ── */}
      <div className={cn("hidden xl:block relative overflow-hidden", className)}>
        <div className="pointer-events-none absolute top-0 left-0 right-0 h-8 z-10 bg-gradient-to-b from-background to-transparent" />
        <div className="pointer-events-none absolute bottom-0 left-0 right-0 h-8 z-10 bg-gradient-to-t from-background to-transparent" />
        <div className="flex flex-col gap-2.5 animate-marquee-vertical">
          {doubled.map((item, i) => (
            <ActivityCard key={`v-${item.id}-${i}`} item={item} />
          ))}
        </div>
      </div>

      <style>{`
        @keyframes marquee-vertical {
          0%   { transform: translateY(0); }
          100% { transform: translateY(-50%); }
        }
        @keyframes marquee-horizontal {
          0%   { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
        .animate-marquee-vertical {
          animation: marquee-vertical 30s linear infinite;
        }
        .animate-marquee-vertical:hover {
          animation-play-state: paused;
        }
        .animate-marquee-horizontal {
          animation: marquee-horizontal 25s linear infinite;
        }
        .animate-marquee-horizontal:hover {
          animation-play-state: paused;
        }
      `}</style>
    </>
  )
}
