/**
 * tutorService.ts
 *
 * Tutor-specific mock query functions.
 * Replace with axios/fetch API calls when the Express backend is ready.
 */

import {
  users, teacherProfiles, studentProfiles, subjects, grades,
  timeSlots, bookings, transactions, reviews,
} from "@/lib/mockData"
import type {
  TutorBookingRow, TutorStudentRow, TutorEarningRow,
  TutorReviewRow, TutorSlotRow, TutorAnalytics,
} from "@/types/tutor"

const delay = (ms = 300) => new Promise((r) => setTimeout(r, ms))

// ─── Bookings (from the tutor's perspective) ─────────────────────────────────
export async function getTutorBookings(
  tutorId: number,
  tenantId: number
): Promise<TutorBookingRow[]> {
  await delay()

  // Get all slots owned by this tutor
  const mySlots = timeSlots.filter(
    (s) => s.teacher_id === tutorId && s.tenant_id === tenantId
  )
  const mySlotIds = mySlots.map((s) => s.slot_id!)

  // Get bookings for those slots
  return bookings
    .filter((b) => mySlotIds.includes(b.slot_id) && b.tenant_id === tenantId)
    .map((b) => {
      const slot = mySlots.find((s) => s.slot_id === b.slot_id)!
      const subj = subjects.find((s) => s.subject_id === slot.subject_id)
      const student = users.find((u) => u.user_id === b.student_id)
      const gradeLabel = grades.find((g) => g.grade_id === b.student_grade)?.grade_name ?? `Grade ${b.student_grade}`
      const txn = transactions.find((t) => t.booking_id === b.booking_id)
      return {
        booking_id: b.booking_id,
        student_name: student?.name ?? "Unknown",
        subject: subj?.name ?? "—",
        grade: gradeLabel,
        date: slot.slot_date,
        time: `${slot.start_time.slice(0, 5)} – ${slot.end_time.slice(0, 5)}`,
        amount: txn?.total_amount ?? 0,
        status: b.status as TutorBookingRow["status"],
      }
    })
}

// ─── Students ────────────────────────────────────────────────────────────────
export async function getTutorStudents(
  tutorId: number,
  tenantId: number
): Promise<TutorStudentRow[]> {
  await delay()

  const mySlots = timeSlots.filter(
    (s) => s.teacher_id === tutorId && s.tenant_id === tenantId
  )
  const mySlotIds = mySlots.map((s) => s.slot_id!)
  const myBookings = bookings.filter(
    (b) => mySlotIds.includes(b.slot_id) && b.tenant_id === tenantId
  )

  // Group by student
  const studentMap = new Map<number, TutorStudentRow>()
  myBookings.forEach((b) => {
    const slot = mySlots.find((s) => s.slot_id === b.slot_id)!
    const subj = subjects.find((s) => s.subject_id === slot.subject_id)
    const student = users.find((u) => u.user_id === b.student_id)
    const profile = studentProfiles.find((p) => p.user_id === b.student_id)
    const gradeLabel = grades.find((g) => g.grade_id === profile?.grade_id)?.grade_name ?? "—"
    const txn = transactions.find((t) => t.booking_id === b.booking_id)

    if (!student) return

    const existing = studentMap.get(student.user_id)
    if (existing) {
      existing.totalSessions++
      existing.totalPaid += txn?.total_amount ?? 0
      if (subj && !existing.subjects.includes(subj.name)) existing.subjects.push(subj.name)
      existing.lastSession = slot.slot_date > existing.lastSession ? slot.slot_date : existing.lastSession
    } else {
      studentMap.set(student.user_id, {
        user_id: student.user_id,
        name: student.name,
        grade: gradeLabel,
        subjects: subj ? [subj.name] : [],
        totalSessions: 1,
        lastSession: slot.slot_date,
        totalPaid: txn?.total_amount ?? 0,
        status: "active",
      })
    }
  })

  return Array.from(studentMap.values()).sort((a, b) => b.totalSessions - a.totalSessions)
}

// ─── Earnings ────────────────────────────────────────────────────────────────
export async function getTutorEarnings(
  tutorId: number,
  tenantId: number
): Promise<TutorEarningRow[]> {
  await delay()

  return transactions
    .filter((t) => t.teacher_id === tutorId && t.tenant_id === tenantId)
    .map((t) => {
      const student = users.find((u) => u.user_id === t.student_id)
      const booking = bookings.find((b) => b.booking_id === t.booking_id)
      const slot = booking ? timeSlots.find((s) => s.slot_id === booking.slot_id) : undefined
      const subj = slot ? subjects.find((s) => s.subject_id === slot.subject_id) : undefined
      return {
        transaction_id: t.transaction_id,
        date: t.created_at.slice(0, 10),
        studentName: student?.name ?? "Unknown",
        subject: subj?.name ?? "—",
        grossAmount: t.total_amount,
        commission: t.platform_commission,
        netAmount: t.teacher_earnings,
        paymentStatus: t.payment_status as "paid" | "pending",
      }
    })
    .sort((a, b) => b.date.localeCompare(a.date))
}

// ─── Reviews ─────────────────────────────────────────────────────────────────
export async function getTutorReviews(
  tutorId: number,
  tenantId: number
): Promise<TutorReviewRow[]> {
  await delay()

  return reviews
    .filter((r) => r.teacher_id === tutorId && r.tenant_id === tenantId)
    .map((r) => {
      const student = users.find((u) => u.user_id === r.student_id)
      const booking = bookings.find((b) => b.booking_id === r.booking_id)
      const slot = booking ? timeSlots.find((s) => s.slot_id === booking.slot_id) : undefined
      const subj = slot ? subjects.find((s) => s.subject_id === slot.subject_id) : undefined
      return {
        review_id: r.review_id,
        studentName: student?.name ?? "Anonymous",
        rating: r.rating,
        comment: r.comment,
        subject: subj?.name ?? "—",
        createdAt: r.created_at,
      }
    })
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
}

// ─── Slots ───────────────────────────────────────────────────────────────────
export async function getTutorSlots(
  tutorId: number,
  tenantId: number
): Promise<TutorSlotRow[]> {
  await delay()

  return timeSlots
    .filter((s) => s.teacher_id === tutorId && s.tenant_id === tenantId)
    .map((s) => {
      const subj = subjects.find((x) => x.subject_id === s.subject_id)
      return {
        slot_id: s.slot_id!,
        subject: subj?.name ?? "—",
        date: s.slot_date,
        time: `${s.start_time.slice(0, 5)} – ${s.end_time.slice(0, 5)}`,
        gradeRange: `Gr${s.grade_from} – Gr${s.grade_to}`,
        maxStudents: s.max_students,
        remainingSeats: s.remaining_seats,
        status: s.status as TutorSlotRow["status"],
      }
    })
    .sort((a, b) => b.date.localeCompare(a.date))
}

// ─── Analytics ───────────────────────────────────────────────────────────────
export async function getTutorAnalytics(
  tutorId: number,
  tenantId: number
): Promise<TutorAnalytics> {
  await delay()

  const mySlots = timeSlots.filter((s) => s.teacher_id === tutorId && s.tenant_id === tenantId)
  const mySlotIds = mySlots.map((s) => s.slot_id!)
  const myBookings = bookings.filter(
    (b) => mySlotIds.includes(b.slot_id) && b.tenant_id === tenantId
  )
  const myTxns = transactions.filter((t) => t.teacher_id === tutorId && t.tenant_id === tenantId)
  const myReviews = reviews.filter((r) => r.teacher_id === tutorId && r.tenant_id === tenantId)

  // Unique students
  const uniqueStudentIds = Array.from(new Set(myBookings.map((b) => b.student_id)))
  // Returning = booked more than once
  const bookingCountByStudent = myBookings.reduce<Record<number, number>>((acc, b) => {
    acc[b.student_id] = (acc[b.student_id] || 0) + 1
    return acc
  }, {})
  const returning = Object.values(bookingCountByStudent).filter((c) => c > 1).length
  const returningRate = uniqueStudentIds.length > 0
    ? Math.round((returning / uniqueStudentIds.length) * 100)
    : 0

  // Sessions over time
  const byMonth: Record<string, number> = {}
  myTxns.forEach((t) => {
    const m = t.created_at.slice(0, 7)
    byMonth[m] = (byMonth[m] || 0) + 1
  })
  const sessionsOverTime = Object.entries(byMonth)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([month, sessions]) => ({
      month: new Date(month + "-01").toLocaleDateString("en-ET", { month: "short", year: "2-digit" }),
      sessions,
    }))

  // Top subjects
  const subjectCount: Record<string, number> = {}
  mySlots.forEach((s) => {
    const name = subjects.find((x) => x.subject_id === s.subject_id)?.name ?? "Other"
    subjectCount[name] = (subjectCount[name] || 0) + 1
  })
  const topSubjects = Object.entries(subjectCount)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 5)
    .map(([subject, count]) => ({ subject, count }))

  const totalSessions = myTxns.length
  const avgRating = myReviews.length
    ? myReviews.reduce((a, r) => a + r.rating, 0) / myReviews.length
    : 0

  // Achievements
  const achievements = [
    { label: "First Session",    description: "Complete your first session",    emoji: "🎉", unlocked: totalSessions >= 1 },
    { label: "5 Star Tutor",     description: "Get an average rating of 5.0",  emoji: "⭐", unlocked: avgRating >= 4.9 },
    { label: "10 Students",      description: "Teach 10 unique students",       emoji: "🎓", unlocked: uniqueStudentIds.length >= 10 },
    { label: "25 Sessions",      description: "Complete 25 sessions",           emoji: "🏆", unlocked: totalSessions >= 25 },
    { label: "Loyal Students",   description: "30% returning student rate",     emoji: "🔄", unlocked: returningRate >= 30 },
    { label: "Super Tutor",      description: "50+ sessions completed",         emoji: "🚀", unlocked: totalSessions >= 50 },
    { label: "Revenue Master",   description: "Earn 10,000 ETB net",           emoji: "💰", unlocked: myTxns.reduce((a, t) => a + t.teacher_earnings, 0) >= 10000 },
    { label: "Polymath Tutor",   description: "Teach 3+ different subjects",    emoji: "📚", unlocked: topSubjects.length >= 3 },
  ]

  return {
    totalSessions,
    avgRating,
    uniqueStudents: uniqueStudentIds.length,
    returningRate,
    sessionsOverTime,
    topSubjects,
    achievements,
  }
}
