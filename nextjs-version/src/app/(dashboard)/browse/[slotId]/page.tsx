"use client"

import { useEffect, useState } from "react"
import { useParams } from "next/navigation"
import { useAuthStore } from "@/lib/store/useAuthStore"
import { Skeleton } from "@/components/ui/skeleton"
import { SlotDetail } from "./components/slot-detail"
import { getAvailableSlots } from "@/lib/services/dashboardService"
import type { SlotWithDetails } from "@/types/database"

export default function SlotDetailPage() {
  const { slotId } = useParams<{ slotId: string }>()
  const { user }   = useAuthStore()
  const [slot, setSlot]     = useState<SlotWithDetails | null>(null)
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)

  useEffect(() => {
    if (!user) return
    getAvailableSlots(user.tenant_id, {})
      .then(slots => {
        const found = slots.find(s => String(s.slot.slot_id) === String(slotId))
        if (found) setSlot(found)
        else setNotFound(true)
      })
      .finally(() => setLoading(false))
  }, [user, slotId])

  if (loading) return (
    <div className="px-4 lg:px-6 space-y-4">
      <Skeleton className="h-8 w-48" />
      <div className="grid gap-6 lg:grid-cols-[1fr_340px]">
        <div className="space-y-4">
          <Skeleton className="h-24 rounded-xl" />
          <Skeleton className="h-48 rounded-xl" />
        </div>
        <Skeleton className="h-64 rounded-xl" />
      </div>
    </div>
  )

  if (notFound || !slot) return (
    <div className="px-4 lg:px-6 py-20 text-center">
      <p className="text-muted-foreground">Session not found or no longer available.</p>
    </div>
  )

  return (
    <div className="px-4 lg:px-6 space-y-6 pb-12">
      <SlotDetail slot={slot} />
    </div>
  )
}
