"use client"

import { UnifiedSessionCard } from "@/components/cards/session-card"

export interface SessionCardData {
  booking_id: number
  status: "confirmed" | "completed" | "pending" | "cancelled"
  slot: {
    slot_id: number
    slot_date: string
    start_time: string
    end_time: string
    max_students: number
    remaining_seats: number
    description?: string | null
    grade_from?: number
    grade_to?: number
    subject: { name: string; category?: string | null }
    teacher: {
      user: { name: string; user_id: number }
      average_rating: number | string
      experience_years: number
      languages?: string
      hourly_rate?: number | string
    }
    session: { session_id: number; status: string; room_name?: string | null } | null
    bookings?: Array<{ student: { user: { name: string } }; status: string }>
  }
  transaction?: { payment_status: string; total_amount: number } | null
}

interface Props {
  booking: SessionCardData
  onClick?: () => void
}

export function SessionSlotCard({ booking: b, onClick }: Props) {
  return (
    <UnifiedSessionCard
      mode="session"
      bookingStatus={b.status}
      onClick={onClick}
      slot={{
        slot_id:         b.slot.slot_id,
        slot_date:       b.slot.slot_date,
        start_time:      b.slot.start_time,
        end_time:        b.slot.end_time,
        max_students:    b.slot.max_students,
        remaining_seats: b.slot.remaining_seats,
        description:     b.slot.description,
        grade_from:      b.slot.grade_from,
        grade_to:        b.slot.grade_to,
        subject:         b.slot.subject,
        teacher:         b.slot.teacher,
        session:         b.slot.session,
      }}
    />
  )
}
