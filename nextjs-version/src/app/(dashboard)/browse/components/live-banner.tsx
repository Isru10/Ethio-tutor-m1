"use client"

import { useEffect, useState } from "react"
import { Zap, Users, BookOpen, Star } from "lucide-react"

interface LiveBannerProps {
  totalSlots: number
  liveCount?: number
}

const TICKER_ITEMS = [
  { icon: Zap,     text: "Sessions happening right now",  color: "text-green-500" },
  { icon: Users,   text: "Students learning today",       color: "text-blue-500"  },
  { icon: BookOpen,text: "Classes available this week",   color: "text-violet-500"},
  { icon: Star,    text: "Average tutor rating: 4.8",     color: "text-amber-500" },
]

export function LiveBanner({ totalSlots, liveCount = 0 }: LiveBannerProps) {
  const [tick, setTick] = useState(0)

  useEffect(() => {
    const id = setInterval(() => setTick(t => (t + 1) % TICKER_ITEMS.length), 3500)
    return () => clearInterval(id)
  }, [])

  const item = TICKER_ITEMS[tick]
  const Icon = item.icon

  return (
    <div className="flex items-center gap-3 rounded-xl border bg-card px-4 py-3 overflow-hidden">
      {/* Live indicator */}
      {liveCount > 0 && (
        <div className="flex items-center gap-1.5 shrink-0 border-r pr-3 mr-1">
          <span className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
          <span className="text-xs font-semibold text-green-600 dark:text-green-400 whitespace-nowrap">
            {liveCount} Live
          </span>
        </div>
      )}

      {/* Animated ticker */}
      <div className="flex items-center gap-2 min-w-0 flex-1">
        <Icon className={`size-3.5 shrink-0 ${item.color}`} />
        <span
          key={tick}
          className="text-xs text-muted-foreground truncate animate-in fade-in slide-in-from-bottom-1 duration-300"
        >
          <span className="font-semibold text-foreground">{totalSlots}</span> {item.text}
        </span>
      </div>
    </div>
  )
}
