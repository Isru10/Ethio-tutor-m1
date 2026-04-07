"use client"

import { useEffect, useState } from "react"
import { TeacherCard } from "./teacher-card"
import { Skeleton } from "@/components/ui/skeleton"
import { useAuthStore } from "@/store/authStore"
import {
  getTutorsWithProfiles,
  getAvailableSlots,
} from "@/lib/services/dashboardService"
import type { TutorWithProfile, SlotWithDetails } from "@/types/database"

export function TeacherCardGrid() {
  const { user } = useAuthStore()
  const [tutors, setTutors] = useState<TutorWithProfile[]>([])
  const [slots, setSlots] = useState<SlotWithDetails[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user) return
    Promise.all([
      getTutorsWithProfiles(user.tenant_id),
      getAvailableSlots(user.tenant_id),
    ]).then(([t, s]) => {
      setTutors(t)
      setSlots(s)
      setLoading(false)
    })
  }, [user])

  if (loading) {
    return (
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-64 rounded-xl" />
        ))}
      </div>
    )
  }

  // Only show tutors who have at least 1 available slot
  const tutorsWithSlots = tutors.filter((t) =>
    slots.some((s) => s.slot.teacher_id === t.user.user_id)
  )

  if (tutorsWithSlots.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <p className="text-muted-foreground text-sm">
          No available teachers right now. Check back soon!
        </p>
      </div>
    )
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {tutorsWithSlots.map((tutor) => (
        <TeacherCard
          key={tutor.user.user_id}
          tutor={tutor}
          slots={slots}
        />
      ))}
    </div>
  )
}
