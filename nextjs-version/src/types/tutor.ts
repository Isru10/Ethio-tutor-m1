// Types for tutor-specific page data shapes

export interface TutorBookingRow {
  booking_id: number
  student_name: string
  subject: string
  grade: string
  date: string
  time: string
  amount: number
  status: "confirmed" | "completed" | "pending" | "cancelled"
}

export interface TutorStudentRow {
  user_id: number
  name: string
  grade: string
  subjects: string[]
  totalSessions: number
  lastSession: string
  totalPaid: number
  status: "active" | "inactive"
}

export interface TutorEarningRow {
  transaction_id: number
  date: string
  studentName: string
  subject: string
  grossAmount: number
  commission: number
  netAmount: number
  paymentStatus: "paid" | "pending"
}

export interface TutorReviewRow {
  review_id: number
  studentName: string
  rating: number
  comment: string
  subject: string
  createdAt: string
}

export interface TutorSlotRow {
  slot_id: number
  subject: string
  date: string
  time: string
  gradeRange: string
  maxStudents: number
  remainingSeats: number
  status: "available" | "full" | "completed"
}

export interface TutorAnalytics {
  totalSessions: number
  avgRating: number
  uniqueStudents: number
  returningRate: number
  sessionsOverTime: { month: string; sessions: number }[]
  topSubjects: { subject: string; count: number }[]
  achievements: {
    label: string
    description: string
    emoji: string
    unlocked: boolean
  }[]
}
