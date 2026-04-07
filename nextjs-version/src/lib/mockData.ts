import type {
  Tenant, User, TeacherProfile, StudentProfile,
  Subject, Grade, TeacherSubject, TimeSlot,
  Booking, Session, Transaction, Review,
  Notification, SessionRecording,
} from "@/types/database";

// ─── 1. TENANTS ─────────────────────────────────────────────
export const tenants: Tenant[] = [
  { tenant_id: 1, name: "EthioTutor Basic", subdomain: "basic", plan: "basic", status: "active", created_at: "2024-01-10T08:00:00Z" },
  { tenant_id: 2, name: "EthioTutor Pro", subdomain: "pro", plan: "pro", status: "active", created_at: "2024-01-15T08:00:00Z" },
];

// ─── 2. USERS ───────────────────────────────────────────────
export const users: User[] = [
  // Hardcoded profiles for authStore mapping
  { user_id: 1, tenant_id: 1, name: "Abebe Girma", email: "admin@basic.et", password: "hashed", role: "ADMIN", phone: "+251911000001", status: "active", created_at: "2024-01-10T09:00:00Z" },
  { user_id: 2, tenant_id: 1, name: "Dawit Bekele", email: "dawit@basic.et", password: "hashed", role: "TUTOR", phone: "+251911000002", status: "active", created_at: "2024-01-12T09:00:00Z" },
  { user_id: 4, tenant_id: 1, name: "Meron Alemu", email: "meron.student@basic.et", password: "hashed", role: "STUDENT", phone: "+251911000004", status: "active", created_at: "2024-02-01T09:00:00Z" },
  { user_id: 9, tenant_id: 2, name: "Liya Mengistu", email: "liya.student@pro.et", password: "hashed", role: "STUDENT", phone: "+251911000009", status: "active", created_at: "2024-02-20T09:00:00Z" },
  
  // Extra Tutors (ID: 10 to 33)
  ...Array.from({ length: 24 }, (_, i) => ({
    user_id: i + 10, tenant_id: i < 15 ? 2 : 1, name: `Tutor ${i + 10}`, email: `tutor${i + 10}@example.et`, password: "hashed", role: "TUTOR" as const, phone: `+251911${Math.floor(100000 + Math.random() * 900000)}`, status: "active" as const, created_at: "2024-02-01T09:00:00Z"
  })),

  // Extra Students (ID: 34 to 73 = 40 Students)
  ...Array.from({ length: 40 }, (_, i) => ({
    user_id: i + 34, tenant_id: i < 15 ? 2 : 1, name: `Student ${i + 34}`, email: `student${i + 34}@example.et`, password: "hashed", role: "STUDENT" as const, phone: `+251933${Math.floor(100000 + Math.random() * 900000)}`, status: "active" as const, created_at: "2024-02-05T09:00:00Z"
  }))
];

// Combine all tutor IDs and student IDs for logic
const tutorIds = [2, ...Array.from({ length: 24 }, (_, i) => i + 10)];
const studentIds = [4, 9, ...Array.from({ length: 40 }, (_, i) => i + 34)];

const getTenant = (uid: number) => users.find(u => u.user_id === uid)?.tenant_id || 1;

// ─── 3. TEACHER_PROFILES ────────────────────────────────────
export const teacherProfiles: TeacherProfile[] = tutorIds.map((tid, i) => ({
    teacher_profile_id: i + 1,
    tenant_id: getTenant(tid),
    user_id: tid,
    bio: "Experienced specialized teacher looking to help students master challenging concepts and excel in their studies.",
    qualifications: "BSc/BA University Degree",
    experience_years: Math.floor(Math.random() * 10) + 1,
    hourly_rate: Math.floor(100 + Math.random() * 200),
    languages: "Amharic,English",
    image_profile: "",
    teacher_image: "",
    file: "",
    average_rating: +(Math.random() * 1.5 + 3.5).toFixed(1)
}));

// ─── 4. GRADES ──────────────────────────────────────────────
export const grades: Grade[] = Array.from({ length: 24 }, (_, i) => ({
  grade_id: i + 1,
  tenant_id: i < 12 ? 1 : 2,
  grade_name: `Grade ${(i % 12) + 1}`,
  level_group: (i % 12) + 1 <= 6 ? "Primary" : (i % 12) + 1 <= 8 ? "Middle" : (i % 12) + 1 <= 10 ? "Secondary" : "Preparatory"
}));

// ─── 4b. STUDENT_PROFILES ───────────────────────────────────
export const studentProfiles: StudentProfile[] = studentIds.map((sid, i) => ({
  student_profile_id: i + 1,
  tenant_id: getTenant(sid),
  user_id: sid,
  grade_id: getTenant(sid) === 1 ? Math.floor(Math.random() * 12) + 1 : Math.floor(Math.random() * 12) + 13,
  learning_goals: "Improve subject understanding and pass exams.",
  total_spent: Math.floor(100 + Math.random() * 2000),
  image_profile: ""
}));

// ─── 5. SUBJECTS ────────────────────────────────────────────
const subNames = ["Mathematics", "Physics", "Chemistry", "Biology", "English", "Amharic", "History", "Geography", "Civics", "ICT"];
export const subjects: Subject[] = Array.from({ length: 20 }, (_, i) => {
  const name = subNames[i % 10];
  const cat = ["Mathematics", "Physics", "Chemistry", "Biology"].includes(name) ? "Science/Math" : "Language/Arts";
  return { subject_id: i + 1, tenant_id: i < 10 ? 1 : 2, name, category: cat };
});

// ─── 7. TEACHER_SUBJECTS ────────────────────────────────────
export const teacherSubjects: TeacherSubject[] = tutorIds.flatMap((tid, i) => {
  const tnt = getTenant(tid);
  // Give every tutor 2 subjects
  return [
    { id: i * 2 + 1, tenant_id: tnt, teacher_id: tid, subject_id: tnt === 1 ? 1 : 11, grade_from: 5, grade_to: 12 },
    { id: i * 2 + 2, tenant_id: tnt, teacher_id: tid, subject_id: tnt === 1 ? 2 : 12, grade_from: 5, grade_to: 12 }
  ];
});

// ─── 8. TIME_SLOTS ──────────────────────────────────────────
// Generate 60+ time slots, specifically ensuring Dawit (ID 2) gets many slots
const allSlots = Array.from({ length: 80 }, (_, i) => {
  const sts = (i % 3 === 0 ? "full" : i % 5 === 0 ? "completed" : "available") as "available" | "full" | "completed";
  // Force every 4th slot to be Dawit, else random tutor
  const tid = i % 4 === 0 ? 2 : tutorIds[Math.floor(Math.random() * tutorIds.length)];
  const tnt = getTenant(tid);
  return {
    slot_id: i + 1,
    tenant_id: tnt,
    teacher_id: tid,
    subject_id: tnt === 1 ? 1 : 11, // Math
    slot_date: `2026-03-${String(10 + (i % 20)).padStart(2, '0')}`,
    start_time: `${String(8 + (i % 10)).padStart(2, '0')}:00:00`,
    end_time: `${String(9 + (i % 10)).padStart(2, '0')}:00:00`,
    grade_from: 5,
    grade_to: 12,
    selected_grade: Math.floor(Math.random() * 8) + 5,
    max_students: 5,
    remaining_seats: sts === "full" ? 0 : Math.floor(Math.random() * 4) + 1,
    status: sts
  };
});
export const timeSlots: TimeSlot[] = allSlots;

// ─── 9. BOOKINGS ────────────────────────────────────────────
// Generate 80+ bookings, specifically ensuring Meron (ID 4) and Liya (ID 9) have lots
export const bookings: Booking[] = Array.from({ length: 80 }, (_, i) => {
  const sts = i % 4 === 0 ? "completed" : i % 3 === 0 ? "pending" : "confirmed";
  
  // Give Meron ~20 bookings, Liya ~10, random for rest
  const stuid = i < 20 ? 4 : i < 30 ? 9 : studentIds[Math.floor(Math.random() * studentIds.length)];
  const tnt = getTenant(stuid);
  
  // Find a slot that matches this student's tenant
  const validSlots = allSlots.filter(s => s.tenant_id === tnt);
  const sl = validSlots[i % validSlots.length];

  return {
    booking_id: i + 1,
    tenant_id: tnt,
    slot_id: sl.slot_id!,
    student_id: stuid,
    student_grade: sl.selected_grade!,
    status: sts,
    created_at: `2026-03-0${1 + (i % 9)}T10:00:00Z`
  };
});

// ─── 10. SESSIONS ───────────────────────────────────────────
export const sessions: Session[] = timeSlots.map((sl, i) => ({
  session_id: i + 1,
  tenant_id: sl.tenant_id,
  slot_id: sl.slot_id!,
  teacher_id: sl.teacher_id,
  start_time: `${sl.slot_date}T${sl.start_time}Z`,
  end_time: `${sl.slot_date}T${sl.end_time}Z`,
  status: sl.status === "completed" ? "completed" : "scheduled",
  meeting_link: "https://meet.google.com/abc-xyz"
}));

// ─── 11. TRANSACTIONS ───────────────────────────────────────
export const transactions: Transaction[] = bookings.map((bk, i) => {
  const amt = Math.floor(100 + Math.random() * 200);
  const comm = amt * 0.15;
  const earn = amt - comm;
  const sts = bk.status === "pending" ? "pending" : "paid";
  const tid = timeSlots.find(s => s.slot_id === bk.slot_id)?.teacher_id || 2;
  return {
    transaction_id: i + 1,
    tenant_id: bk.tenant_id,
    booking_id: bk.booking_id,
    student_id: bk.student_id,
    teacher_id: tid,
    total_amount: amt,
    platform_commission: comm,
    teacher_earnings: earn,
    payment_status: sts,
    created_at: bk.created_at
  };
});

// ─── 12. REVIEWS ────────────────────────────────────────────
export const reviews: Review[] = bookings.filter(b => b.status === "completed").map((bk, i) => {
  const tid = timeSlots.find(s => s.slot_id === bk.slot_id)?.teacher_id || 2;
  return {
    review_id: i + 1,
    tenant_id: bk.tenant_id,
    booking_id: bk.booking_id,
    student_id: bk.student_id,
    teacher_id: tid,
    rating: Math.floor(3 + Math.random() * 3),
    comment: "Great session! Highly recommend this tutor.",
    created_at: "2026-03-05T11:00:00Z"
  };
});

// ─── 13. NOTIFICATIONS ──────────────────────────────────────
export const notifications: Notification[] = Array.from({ length: 80 }, (_, i) => {
  // Ensure Meron (4), Dawit (2), Liya (9) get plenty
  const recId = i < 20 ? 4 : i < 40 ? 2 : i < 50 ? 9 : studentIds[Math.floor(Math.random() * studentIds.length)];
  return {
    notification_id: i + 1,
    tenant_id: getTenant(recId),
    recipient_id: recId,
    title: "Platform Update & Booking Status",
    message: "You have a new activity regarding your recent bookings or payments.",
    is_read: i % 2 === 0,
    created_at: `2026-03-${String(1 + (i % 25)).padStart(2, '0')}T10:00:00Z`
  };
});

// ─── 14. SESSION_RECORDINGS ─────────────────────────────────
export const sessionRecordings: SessionRecording[] = sessions
  .filter(s => s.tenant_id === 2 && s.status === "completed")
  .map((s, i) => ({
    recording_id: i + 1,
    tenant_id: 2,
    session_id: s.session_id,
    storage_url: `https://storage.ethiotutor.et/recordings/session-${s.session_id}.mp4`,
    duration_seconds: Math.floor(1800 + Math.random() * 3600),
    created_at: s.start_time
  }));
