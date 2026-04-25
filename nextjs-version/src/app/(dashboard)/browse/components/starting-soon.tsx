"use client"

import { useEffect, useState } from "react"
import { Clock, Zap } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { SlotCard } from "./slot-card"
import type { SlotWithDetails } from "@/types/database"

interface StartingSoonProps {
  slots: SlotWithDetails[]
  onBook: (slotId: number) => void
}

function useNow() {
  const [now, setNow] = useState(new Date())
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 60000)
    return () => clearInterval(id)
  }, [])
  return now
}

export function StartingSoon({ slots, onBook }: StartingSoonProps) {
  const now = useNow()

  // Slots starting within the next 3 hours
  const soonSlots = slots.filter(s => {
    const dateOnly   = s.slot.slot_date.split("T")[0]
    const startTime  = s.slot.start_time.slice(0, 5)
    const start      = new Date(`${dateOnly}T${startTime}:00`)
    const diffMins   = (start.getTime() - now.getTime()) / 60000
    return diffMins >= 0 && diffMins <= 180
  }).slice(0, 3)

  if (soonSlots.length === 0) return null

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <div className="flex items-center gap-1.5">
          <Zap className="size-4 text-amber-500" />
          <h2 className="text-base font-semibold">Starting Soon</h2>
        </div>
        <Badge variant="secondary" className="text-[10px] bg-amber-100 text-amber-700 dark:bg-amber-950/30 dark:text-amber-400 gap-1">
          <Clock className="size-2.5" /> Within 3 hours
        </Badge>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {soonSlots.map(slot => (
          <SlotCard key={slot.slot.slot_id} slot={slot} onBook={onBook} />
        ))}
      </div>
    </div>
  )
}
