"use client"

import { useRouter } from "next/navigation"
import { UnifiedSessionCard } from "@/components/cards/session-card"
import type { SlotWithDetails } from "@/types/database"

interface SlotCardProps {
  slot: SlotWithDetails
  onBook: (slotId: number) => void
}

export function SlotCard({ slot, onBook }: SlotCardProps) {
  const router = useRouter()
  const { slot: s, subject, teacher, teacher_profile, grade_from_label, grade_to_label } = slot

  return (
    <UnifiedSessionCard
      mode="browse"
      onBook={onBook}
      onClick={() => router.push(`/browse/${s.slot_id}`)}
      slot={{
        slot_id:          s.slot_id,
        slot_date:        s.slot_date,
        start_time:       s.start_time,
        end_time:         s.end_time,
        max_students:     s.max_students,
        remaining_seats:  s.remaining_seats,
        grade_from_label,
        grade_to_label,
        subject: {
          name:     subject.name,
          category: subject.category,
        },
        teacher: {
          user:             { name: teacher.name, user_id: teacher.user_id },
          average_rating:   teacher_profile.average_rating,
          experience_years: teacher_profile.experience_years,
          languages:        teacher_profile.languages,
          hourly_rate:      teacher_profile.hourly_rate,
        },
      }}
    />
  )
}
