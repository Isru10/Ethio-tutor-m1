/**
 * dashboardService.ts
 *
 * Tenant-aware mock query functions. All functions:
 *  - Accept tenant_id so SaaS isolation is enforced from day 1.
 *  - Return Promise<T> with a simulated 300ms delay.
 *  - Return deeply nested/joined objects, matching what the real API will return.
 *
 * When the Express backend is ready, replace these functions with axios calls.
 * The rest of your UI code will not need to change.
 */

import {
  users, teacherProfiles, studentProfiles, subjects, grades,
  timeSlots, bookings, sessions, transactions,
  reviews, notifications, sessionRecordings,
} from "@/lib/mockData";

import { useAuthStore } from "@/lib/store/useAuthStore";
import { API_BASE } from "@/lib/api";

import type {
  BookingWithDetails, SlotWithDetails, SessionWithDetails,
  StudentDashboardStats, TutorWithProfile,
  Notification, SessionRecording, Review,
} from "@/types/database";

// Simulates network latency
const delay = (ms = 300) => new Promise((r) => setTimeout(r, ms));

// ─── STUDENT SERVICES ────────────────────────────────────────────────────────

/**
 * Student dashboard summary cards.
 */
export async function getStudentDashboardStats(
  studentId: number,
  tenantId: number
): Promise<StudentDashboardStats> {
  await delay();
  const myBookings = bookings.filter(
    (b) => b.student_id === studentId && b.tenant_id === tenantId
  );
  const mySessionIds = myBookings.map((b) => b.slot_id);
  const upcoming = sessions.filter(
    (s) =>
      mySessionIds.includes(s.slot_id) &&
      s.tenant_id === tenantId &&
      s.status === "scheduled"
  );
  const profile = studentProfiles.find(
    (p) => p.user_id === studentId && p.tenant_id === tenantId
  );
  const unread = notifications.filter(
    (n) => n.recipient_id === studentId && n.tenant_id === tenantId && !n.is_read
  );

  return {
    totalBookings: myBookings.length,
    upcomingSessions: upcoming.length,
    totalSpent: profile?.total_spent ?? 0,
    unreadNotifications: unread.length,
  };
}

/**
 * Get all bookings for a student with full nested details.
 */
export async function getStudentBookings(
  studentId: number,
  tenantId: number
): Promise<BookingWithDetails[]> {
  await delay();

  return bookings
    .filter((b) => b.student_id === studentId && b.tenant_id === tenantId)
    .map((booking) => {
      const slot  = timeSlots.find((s) => s.slot_id === booking.slot_id)!;
      const subj  = subjects.find((s) => s.subject_id === slot.subject_id)!;
      const teacher = users.find((u) => u.user_id === slot.teacher_id)!;
      const { password: _pw, ...teacherSafe } = teacher;
      const tProfile = teacherProfiles.find((p) => p.user_id === teacher.user_id)!;
      const txn = transactions.find((t) => t.booking_id === booking.booking_id);

      return { booking, slot, subject: subj, teacher: teacherSafe, teacher_profile: tProfile, transaction: txn };
    });
}

export async function getAvailableSlots(
  tenantId: number,
  filters?: { subjectId?: number | null; gradeId?: number | null; dateFrom?: string; dateTo?: string }
): Promise<SlotWithDetails[]> {
  const { accessToken } = useAuthStore.getState();

  let url = `${API_BASE}/slots`;
  if (filters?.subjectId) url += `?subjectId=${filters.subjectId}`;

  const res = await fetch(url, {
    headers: { "Authorization": `Bearer ${accessToken}`, "Content-Type": "application/json" },
  });

  const result = await res.json();
  if (!res.ok) throw new Error(result.message);

  let slots: SlotWithDetails[] = result.data.map((slot: any) => {
    const tp = slot.teacher ?? {}; // TeacherProfile row

    // Normalize slot_date: MySQL Date comes as "2025-06-15T00:00:00.000Z" — strip to "YYYY-MM-DD"
    const rawDate: string = typeof slot.slot_date === "string"
      ? slot.slot_date.split("T")[0]
      : new Date(slot.slot_date).toISOString().split("T")[0];

    return {
      slot: {
        ...slot,
        slot_date: rawDate,
      },
      subject: slot.subject ?? { name: "Unknown", category: "" },
      // teacher.user holds { user_id, name } from the backend include
      teacher: {
        user_id: tp.user?.user_id ?? tp.user_id ?? 0,
        name:    tp.user?.name   ?? "Unknown Teacher",
      },
      teacher_profile: {
        average_rating:   Number(tp.average_rating   ?? 0),
        experience_years: Number(tp.experience_years ?? 0),
        hourly_rate:      Number(tp.hourly_rate       ?? 0),
        languages:        tp.languages ?? "Amharic",
      },
      grade_from_label: `Grade ${slot.grade_from}`,
      grade_to_label:   `Grade ${slot.grade_to}`,
    };
  });

  // Client-side filters
  if (filters?.gradeId) {
    slots = slots.filter(
      (s) => s.slot.grade_from <= (filters.gradeId ?? 0) && s.slot.grade_to >= (filters.gradeId ?? 0)
    );
  }
  if (filters?.dateFrom) slots = slots.filter((s) => s.slot.slot_date >= filters.dateFrom!);
  if (filters?.dateTo)   slots = slots.filter((s) => s.slot.slot_date <= filters.dateTo!);

  return slots;
}

/**
 * Get all sessions for a student (upcoming + past).
 */
export async function getStudentSessions(
  studentId: number,
  tenantId: number
): Promise<SessionWithDetails[]> {
  await delay();

  const myBookings  = bookings.filter((b) => b.student_id === studentId && b.tenant_id === tenantId);
  const mySlotIds   = myBookings.map((b) => b.slot_id);
  const mySessions  = sessions.filter((s) => mySlotIds.includes(s.slot_id) && s.tenant_id === tenantId);

  return mySessions.map((session) => {
    const slot  = timeSlots.find((s) => s.slot_id === session.slot_id)!;
    const subj  = subjects.find((s) => s.subject_id === slot.subject_id)!;
    const teacher = users.find((u) => u.user_id === session.teacher_id)!;
    const { password: _pw, ...teacherSafe } = teacher;
    const recording = sessionRecordings.find((r) => r.session_id === session.session_id);

    return { session, slot, subject: subj, teacher: teacherSafe, recording };
  });
}

/**
 * Get student's payment history.
 */
export async function getStudentTransactions(studentId: number, tenantId: number) {
  await delay();
  return transactions
    .filter((t) => t.student_id === studentId && t.tenant_id === tenantId)
    .map((txn) => {
      const booking = bookings.find((b) => b.booking_id === txn.booking_id)!;
      const slot    = timeSlots.find((s) => s.slot_id === booking.slot_id)!;
      const subj    = subjects.find((s) => s.subject_id === slot.subject_id)!;
      const teacher = users.find((u) => u.user_id === txn.teacher_id)!;
      const { password: _pw, ...teacherSafe } = teacher;
      return { transaction: txn, booking, slot, subject: subj, teacher: teacherSafe };
    });
}

/**
 * Get recordings available to a student (Pro plan only — caller must enforce plan gate).
 */
export async function getStudentRecordings(
  studentId: number,
  tenantId: number
): Promise<(SessionRecording & { subjectName: string; teacherName: string; sessionDate: string })[]> {
  await delay();

  const myBookings = bookings.filter((b) => b.student_id === studentId && b.tenant_id === tenantId);
  const mySlotIds  = myBookings.map((b) => b.slot_id);
  const mySessions = sessions.filter((s) => mySlotIds.includes(s.slot_id) && s.status === "completed" && s.tenant_id === tenantId);
  const mySessionIds = mySessions.map((s) => s.session_id);

  return sessionRecordings
    .filter((r) => mySessionIds.includes(r.session_id) && r.tenant_id === tenantId)
    .map((rec) => {
      const session = mySessions.find((s) => s.session_id === rec.session_id)!;
      const slot    = timeSlots.find((s) => s.slot_id === session.slot_id)!;
      const subj    = subjects.find((s) => s.subject_id === slot.subject_id)!;
      const teacher = users.find((u) => u.user_id === session.teacher_id)!;
      return {
        ...rec,
        subjectName: subj.name,
        teacherName: teacher.name,
        sessionDate: session.start_time.split("T")[0],
      };
    });
}

/**
 * Get notifications for a user.
 */
export async function getUserNotifications(
  userId: number,
  tenantId: number
): Promise<Notification[]> {
  await delay();
  return notifications.filter(
    (n) => n.recipient_id === userId && n.tenant_id === tenantId
  );
}

export async function getTutorsWithProfiles(tenantId: number): Promise<TutorWithProfile[]> {
  const { accessToken } = useAuthStore.getState();

  const res = await fetch(`${API_BASE}/tutors`, {
    headers: { "Authorization": `Bearer ${accessToken}` },
  });
  if (!res.ok) return [];
  const result = await res.json();

  // Backend returns TeacherProfile[] with user, teacherSubjects, reviews, timeSlots included
  return (result.data as any[]).map((p: any) => ({
    user: {
      user_id:   p.user.user_id,
      tenant_id: p.tenant_id,
      name:      p.user.name,
      email:     p.user.email ?? "",
      role:      "TUTOR" as const,
      status:    p.user.status ?? "active",
    },
    profile: {
      teacher_profile_id: p.teacher_profile_id,
      tenant_id:          p.tenant_id,
      user_id:            p.user_id,
      bio:                p.bio              ?? "",
      qualifications:     p.qualifications   ?? "",
      experience_years:   Number(p.experience_years ?? 0),
      hourly_rate:        Number(p.hourly_rate       ?? 0),
      languages:          p.languages        ?? "Amharic",
      image_profile:      p.image_profile    ?? "",
      teacher_image:      p.teacher_image    ?? "",
      file:               p.file             ?? "",
      average_rating:     Number(p.average_rating    ?? 0),
    },
    subjects: (p.teacherSubjects ?? []).map((ts: any) => ({
      id:         ts.id,
      tenant_id:  ts.tenant_id,
      teacher_id: ts.teacher_id,
      subject_id: ts.subject_id,
      grade_from: ts.grade_from,
      grade_to:   ts.grade_to,
      subject:    ts.subject,
    })),
    reviewCount: (p.reviews ?? []).length,
    totalEarned: 0,
    // Attach available slots so TeacherCard can show "Next slot" without a second fetch
    availableSlots: (p.timeSlots ?? []).map((slot: any) => {
      const rawDate = typeof slot.slot_date === "string"
        ? slot.slot_date.split("T")[0]
        : new Date(slot.slot_date).toISOString().split("T")[0];
      return {
        slot: { ...slot, slot_date: rawDate, teacher_id: p.user.user_id },
        subject:         { name: "", category: "" },
        teacher:         { user_id: p.user.user_id, name: p.user.name },
        teacher_profile: { average_rating: Number(p.average_rating ?? 0), experience_years: Number(p.experience_years ?? 0), hourly_rate: Number(p.hourly_rate ?? 0), languages: p.languages ?? "" },
        grade_from_label: `Grade ${slot.grade_from ?? 1}`,
        grade_to_label:   `Grade ${slot.grade_to   ?? 12}`,
      };
    }),
  }));
}

/**
 * Get a single tutor's full profile by user_id for the detail/intro page.
 */
export async function getTutorById(
  tutorId: number,
  tenantId: number
): Promise<(TutorWithProfile & {
  reviewItems: { review: Review; studentName: string }[];
  availableSlots: SlotWithDetails[];
}) | null> {
  const { accessToken } = useAuthStore.getState();

  const res = await fetch(`${API_BASE}/tutors/${tutorId}`, {
    headers: { "Authorization": `Bearer ${accessToken}` },
  });
  if (!res.ok) return null;
  const result = await res.json();
  const p = result.data;
  if (!p) return null;

  const profile = {
    teacher_profile_id: p.teacher_profile_id,
    tenant_id:          p.tenant_id,
    user_id:            p.user_id,
    bio:                p.bio              ?? "",
    qualifications:     p.qualifications   ?? "",
    experience_years:   Number(p.experience_years ?? 0),
    hourly_rate:        Number(p.hourly_rate       ?? 0),
    languages:          p.languages        ?? "Amharic",
    image_profile:      p.image_profile    ?? "",
    teacher_image:      p.teacher_image    ?? "",
    file:               p.file             ?? "",
    average_rating:     Number(p.average_rating    ?? 0),
  };

  const availableSlots: SlotWithDetails[] = (p.timeSlots ?? []).map((slot: any) => {
    const rawDate = typeof slot.slot_date === "string"
      ? slot.slot_date.split("T")[0]
      : new Date(slot.slot_date).toISOString().split("T")[0];
    return {
      slot: { ...slot, slot_date: rawDate },
      subject:         slot.subject ?? { name: "", category: "" },
      teacher:         { user_id: p.user_id, name: p.user.name },
      teacher_profile: profile,
      grade_from_label: `Grade ${slot.grade_from ?? 1}`,
      grade_to_label:   `Grade ${slot.grade_to   ?? 12}`,
    };
  });

  const reviewItems = (p.reviews ?? []).map((r: any) => ({
    review: {
      review_id:  r.review_id,
      tenant_id:  r.tenant_id,
      booking_id: r.booking_id,
      student_id: r.student_id,
      teacher_id: r.teacher_id,
      rating:     r.rating,
      comment:    r.comment ?? "",
      created_at: r.created_at,
    },
    studentName: r.student?.user?.name ?? "Student",
  }));

  return {
    user: {
      user_id:   p.user_id,
      tenant_id: p.tenant_id,
      name:      p.user.name,
      email:     p.user.email ?? "",
      role:      "TUTOR" as const,
      status:    p.user.status ?? "active",
    },
    profile,
    subjects: (p.teacherSubjects ?? []).map((ts: any) => ({
      id: ts.id, tenant_id: ts.tenant_id, teacher_id: ts.teacher_id,
      subject_id: ts.subject_id, grade_from: ts.grade_from, grade_to: ts.grade_to,
      subject: ts.subject,
    })),
    reviewCount:    reviewItems.length,
    totalEarned:    0,
    reviewItems,
    availableSlots,
  };
}

/**
 * Get reviews for a specific teacher.
 */
export async function getTeacherReviews(teacherId: number, tenantId: number) {
  await delay();
  return reviews
    .filter((r) => r.teacher_id === teacherId && r.tenant_id === tenantId)
    .map((r) => {
      const student = users.find((u) => u.user_id === r.student_id)!;
      return { review: r, studentName: student.name };
    });
}

// ─── REFERENCE DATA ──────────────────────────────────────────────────────────

export async function getSubjects(tenantId: number) {
  await delay(100);
  return subjects.filter((s) => s.tenant_id === tenantId);
}

export async function getGrades(tenantId: number) {
  await delay(100);
  return grades.filter((g) => g.tenant_id === tenantId);
}

