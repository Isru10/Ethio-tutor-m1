// ============================================================
// EthioTutor — Database Types (matches 14-table MySQL schema)
// All tables include tenant_id for multi-tenant SaaS isolation.
// ============================================================

export type UserRole = "ADMIN" | "TUTOR" | "STUDENT";
export type TenantPlan = "basic" | "pro";
export type TenantStatus = "active" | "suspended" | "trial";
export type UserStatus = "active" | "inactive" | "pending";
export type SlotStatus = "available" | "full" | "cancelled" | "completed";
export type BookingStatus = "pending" | "confirmed" | "cancelled" | "completed";
export type SessionStatus = "scheduled" | "in_progress" | "completed" | "cancelled";
export type PaymentStatus = "pending" | "paid" | "failed" | "refunded";

// ─── 1. TENANTS ─────────────────────────────────────────────
export interface Tenant {
  tenant_id: number;
  name: string;
  subdomain: string;
  plan: TenantPlan;
  status: TenantStatus;
  created_at: string;
}

// ─── 2. USERS ───────────────────────────────────────────────
export interface User {
  user_id: number;
  tenant_id: number;
  name: string;
  email: string;
  password: string; // hashed — never expose in UI
  role: UserRole;
  phone?: string;
  status: UserStatus;
  created_at?: string;
}

// ─── 3. TEACHER_PROFILES ────────────────────────────────────
export interface TeacherProfile {
  teacher_profile_id: number;
  tenant_id: number;
  user_id: number;
  bio: string;
  qualifications: string;
  experience_years: number;
  hourly_rate: number;
  languages: string; // comma-separated, e.g. "Amharic,English"
  image_profile: string;
  teacher_image: string;
  file: string; // CV/certificate upload URL
  average_rating: number;
}

// ─── 4. STUDENT_PROFILES ────────────────────────────────────
export interface StudentProfile {
  student_profile_id: number;
  tenant_id: number;
  user_id: number;
  grade_id: number;
  learning_goals: string;
  total_spent: number;
  image_profile: string;
}

// ─── 5. SUBJECTS ────────────────────────────────────────────
export interface Subject {
  subject_id: number;
  tenant_id: number;
  name: string;
  category: string; // e.g. "Science", "Language", "Math"
}

// ─── 6. GRADES ──────────────────────────────────────────────
export interface Grade {
  grade_id: number;
  tenant_id: number;
  grade_name: string; // e.g. "Grade 9"
  level_group: string; // e.g. "Secondary", "Primary"
}

// ─── 7. TEACHER_SUBJECTS ────────────────────────────────────
export interface TeacherSubject {
  id: number;
  tenant_id: number;
  teacher_id: number; // FK → users.user_id
  subject_id: number;
  grade_from: number; // FK → grades.grade_id
  grade_to: number;   // FK → grades.grade_id
}

// ─── 8. TIME_SLOTS ──────────────────────────────────────────
export interface TimeSlot {
  slot_id: number;
  tenant_id: number;
  teacher_id: number;
  subject_id: number;
  slot_date: string;    // "YYYY-MM-DD"
  start_time: string;   // "HH:MM:SS"
  end_time: string;     // "HH:MM:SS"
  grade_from: number;
  grade_to: number;
  selected_grade: number;
  max_students: number;
  remaining_seats: number;
  status: SlotStatus;
}

// ─── 9. BOOKINGS ────────────────────────────────────────────
export interface Booking {
  booking_id: number;
  tenant_id: number;
  slot_id: number;
  student_id: number; // FK → users.user_id
  student_grade: number;
  status: BookingStatus;
  created_at: string;
}

// ─── 10. SESSIONS ───────────────────────────────────────────
export interface Session {
  session_id: number;
  tenant_id: number;
  slot_id: number;
  teacher_id: number;
  start_time: string; // ISO datetime
  end_time: string;
  status: SessionStatus;
  meeting_link?: string; // Google Meet / Zoom link for the session
}

// ─── 11. TRANSACTIONS ───────────────────────────────────────
export interface Transaction {
  transaction_id: number;
  tenant_id: number;
  booking_id: number;
  student_id: number;
  teacher_id: number;
  total_amount: number;
  platform_commission: number;
  teacher_earnings: number;
  payment_status: PaymentStatus;
  created_at: string;
}

// ─── 12. REVIEWS ────────────────────────────────────────────
export interface Review {
  review_id: number;
  tenant_id: number;
  booking_id: number;
  student_id: number;
  teacher_id: number;
  rating: number; // 1–5
  comment: string;
  created_at: string;
}

// ─── 13. NOTIFICATIONS ──────────────────────────────────────
export interface Notification {
  notification_id: number;
  tenant_id: number;
  recipient_id: number; // FK → users.user_id
  title: string;
  message: string;
  is_read: boolean;
  created_at: string;
}

// ─── 14. SESSION_RECORDINGS ─────────────────────────────────
export interface SessionRecording {
  recording_id: number;
  tenant_id: number;
  session_id: number;
  storage_url: string;
  duration_seconds: number;
  created_at: string;
}

// ============================================================
// COMPOSITE / NESTED TYPES — used by the UI & service layer
// ============================================================

/** Full tutor card shown in the Browse page */
export interface TutorWithProfile {
  user: Omit<User, "password">;
  profile: TeacherProfile;
  subjects: (TeacherSubject & { subject: Subject })[];
  /** Number of reviews this tutor has received (pre-computed) */
  reviewCount?: number;
  /** Total ETB earned (pre-computed from transactions) */
  totalEarned?: number;
}

/** A booking with all the nested detail the UI needs */
export interface BookingWithDetails {
  booking: Booking;
  slot: TimeSlot;
  subject: Subject;
  teacher: Omit<User, "password">;
  teacher_profile: TeacherProfile;
  transaction?: Transaction;
}

/** A time slot with subject and teacher info — Browse page card */
export interface SlotWithDetails {
  slot: TimeSlot;
  subject: Subject;
  teacher: Omit<User, "password">;
  teacher_profile: TeacherProfile;
  grade_from_label: string;
  grade_to_label: string;
}

/** A session with full context — Sessions page row */
export interface SessionWithDetails {
  session: Session;
  slot: TimeSlot;
  subject: Subject;
  teacher: Omit<User, "password">;
  recording?: SessionRecording;
}

/** Dashboard summary numbers per role */
export interface StudentDashboardStats {
  totalBookings: number;
  upcomingSessions: number;
  totalSpent: number;
  unreadNotifications: number;
}

// ============================================================
// AUTH USER TYPE — what Zustand authStore holds
// ============================================================
export interface AuthUser {
  user_id: number;
  tenant_id: number;
  name: string;
  email: string;
  role: UserRole;
  plan: TenantPlan;
  avatar: string;
  status: UserStatus;
}
