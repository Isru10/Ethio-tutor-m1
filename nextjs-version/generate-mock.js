const fs = require('fs');

// Helpers
const randomItem = (arr) => arr[Math.floor(Math.random() * arr.length)];
const randomInt = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;
const formatStr = (str) => `"${str}"`;

const firstNames = ["Abebe", "Dawit", "Hiwot", "Meron", "Yonas", "Selam", "Tigist", "Bereket", "Liya", "Nahom", "Kebede", "Almaz", "Hirut", "Tesfaye", "Tadesse", "Girma", "Bekele", "Alemu", "Haile", "Worku", "Solomon", "Mengistu", "Kidist", "Betelhem", "Ephrem", "Fikirte", "Genet", "Hanna", "Kaleb", "Lidet", "Mekdes", "Nati", "Robel", "Sara", "Yohannes", "Zewditu", "Abel", "Biniam", "Chala", "Desta", "Eleni", "Fassil", "Getachew"];
const extBios = [
  "Experienced mathematics teacher with a passion for making complex topics simple.",
  "Biology and Chemistry tutor helping students excel in science.",
  "Physics and Mathematics specialist. EGSECE exam preparation expert.",
  "Language teacher focused on conversational Amharic and English grammar.",
  "ICT background with strong coding and computer basics teaching skills.",
  "History and Geography passionate tutor with 5+ years of experience.",
  "Private tutor for elementary and middle schoolers focusing on all-round basics.",
  "University lecturer offering advanced tutoring for high school seniors."
];

let out = `import type {
  Tenant, User, TeacherProfile, StudentProfile,
  Subject, Grade, TeacherSubject, TimeSlot,
  Booking, Session, Transaction, Review,
  Notification, SessionRecording,
} from "@/types/database";

// ─── 1. TENANTS ─────────────────────────────────────────────
export const tenants: Tenant[] = [
  { tenant_id: 1, name: "EthioTutor Basic", subdomain: "basic", plan: "basic", status: "active", created_at: "2024-01-10T08:00:00Z" },
  { tenant_id: 2, name: "EthioTutor Pro", subdomain: "pro", plan: "pro", status: "active", created_at: "2024-01-15T08:00:00Z" },
];\n\n`;

// 2. USERS (3 Admins, 35 Tutors, 40 Students)
let users = [];
let admins = [
  { id: 1, t: 1, n: "Abebe Admin", e: "admin@basic.et", r: "ADMIN" },
  { id: 2, t: 2, n: "Tigist Admin", e: "admin@pro.et", r: "ADMIN" },
  { id: 3, t: 1, n: "System Admin", e: "sysadmin@basic.et", r: "ADMIN" },
];
let userId = 4;
let tutors = [];
for (let i = 0; i < 35; i++) {
  let fn = randomItem(firstNames);
  let ln = randomItem(firstNames);
  tutors.push({ id: userId++, t: (i % 2 === 0 ? 1 : 2), n: \`\${fn} \${ln}\`, e: \`tutor\${i+1}@example.et\`, r: "TUTOR", phone: \`+251911\${randomInt(100000, 999999)}\` });
}
let students = [];
for (let i = 0; i < 40; i++) {
  let fn = randomItem(firstNames);
  let ln = randomItem(firstNames);
  students.push({ id: userId++, t: (i % 2 === 0 ? 1 : 2), n: \`\${fn} \${ln}\`, e: \`student\${i+1}@example.et\`, r: "STUDENT", phone: \`+251911\${randomInt(100000, 999999)}\` });
}

out += `// ─── 2. USERS ───────────────────────────────────────────────\nexport const users: User[] = [\n`;
[...admins, ...tutors, ...students].forEach(u => {
  out += `  { user_id: ${u.id}, tenant_id: ${u.t}, name: "${u.n}", email: "${u.e}", password: "hashed", role: "${u.r}", phone: "${u.phone || '+251911000000'}", status: "active", created_at: "2024-02-01T09:00:00Z" },\n`;
});
out += `];\n\n`;

// 3. TEACHER PROFILES
out += `// ─── 3. TEACHER_PROFILES ────────────────────────────────────\nexport const teacherProfiles: TeacherProfile[] = [\n`;
tutors.forEach((t, i) => {
  let rate = randomInt(5, 25) * 10;
  out += `  { teacher_profile_id: ${i+1}, tenant_id: ${t.t}, user_id: ${t.id}, bio: "${randomItem(extBios)}", qualifications: "BSc/BA University Degree", experience_years: ${randomInt(1, 15)}, hourly_rate: ${rate}, languages: "Amharic,English", image_profile: "", teacher_image: "", file: "", average_rating: ${(Math.random() * 1.5 + 3.5).toFixed(1)} },\n`;
});
out += `];\n\n`;

// 4. GRADES
out += `// ─── 4. GRADES ──────────────────────────────────────────────\nexport const grades: Grade[] = [\n`;
let grades = [];
for(let t=1; t<=2; t++) {
  for(let g=1; g<=12; g++) {
    let gr = { id: grades.length+1, t, name: \`Grade \${g}\`, group: g<=6 ? "Primary" : g<=8 ? "Middle" : g<=10 ? "Secondary" : "Preparatory" };
    grades.push(gr);
    out += `  { grade_id: ${gr.id}, tenant_id: ${gr.t}, grade_name: "${gr.name}", level_group: "${gr.group}" },\n`;
  }
}
out += `];\n\n`;

// 4b. STUDENT PROFILES
out += `// ─── 4b. STUDENT_PROFILES ───────────────────────────────────\nexport const studentProfiles: StudentProfile[] = [\n`;
students.forEach((s, i) => {
  out += `  { student_profile_id: ${i+1}, tenant_id: ${s.t}, user_id: ${s.id}, grade_id: ${s.t===1 ? randomInt(1,12) : randomInt(13,24)}, learning_goals: "Improve subject understanding and pass exams.", total_spent: ${randomInt(100, 3000)}, image_profile: "" },\n`;
});
out += `];\n\n`;

// 5. SUBJECTS
let subData = ["Mathematics", "Physics", "Chemistry", "Biology", "English", "Amharic", "History", "Geography", "Civics", "ICT"];
out += `// ─── 5. SUBJECTS ────────────────────────────────────────────\nexport const subjects: Subject[] = [\n`;
let subjects = [];
for(let t=1; t<=2; t++) {
  subData.forEach((name, i) => {
    let cat = ["Mathematics","Physics","Chemistry","Biology"].includes(name) ? "Science/Math" : "Others";
    subjects.push({ id: subjects.length+1, t, name, cat });
    out += `  { subject_id: ${subjects.length}, tenant_id: ${t}, name: "${name}", category: "${cat}" },\n`;
  });
}
out += `];\n\n`;

// 7. TEACHER SUBJECTS (approx 60)
out += `// ─── 7. TEACHER_SUBJECTS ────────────────────────────────────\nexport const teacherSubjects: TeacherSubject[] = [\n`;
let tsId = 1;
tutors.forEach(t => {
  // 1 to 3 subjects per tutor
  let count = randomInt(1, 3);
  let tenantSubs = subjects.filter(sx => sx.t === t.t);
  for(let k=0; k<count; k++) {
    let sub = randomItem(tenantSubs);
    out += `  { id: ${tsId++}, tenant_id: ${t.t}, teacher_id: ${t.id}, subject_id: ${sub.id}, grade_from: 5, grade_to: 12 },\n`;
  }
});
out += `];\n\n`;

// 8. TIME SLOTS (Browse classes) - Approx 50
out += `// ─── 8. TIME_SLOTS ──────────────────────────────────────────\nexport const timeSlots: TimeSlot[] = [\n`;
let slots = [];
let d = 1;
tutors.forEach(t => {
  let count = randomInt(1, 3);
  let tenantSubs = subjects.filter(sx => sx.t === t.t);
  for(let k=0; k<count; k++) {
    let sub = randomItem(tenantSubs);
    let st = \`2026-03-\${String(randomInt(1,28)).padStart(2,'0')}\`;
    let hr = randomInt(8, 17);
    let sts = randomItem(["available", "full", "completed"]);
    let sl = { slot_id: slots.length+1, t: t.t, tid: t.id, sid: sub.id };
    slots.push(sl);
    out += `  { slot_id: ${sl.slot_id}, tenant_id: ${t.t}, teacher_id: ${t.id}, subject_id: ${sub.id}, slot_date: "${st}", start_time: "${String(hr).padStart(2,'0')}:00:00", end_time: "${String(hr+1).padStart(2,'0')}:00:00", grade_from: 5, grade_to: 12, selected_grade: ${randomInt(5,12)}, max_students: 5, remaining_seats: ${sts === "full" ? 0 : randomInt(1, 4)}, status: "${sts}" },\n`;
  }
});
out += `];\n\n`;

// 9. BOOKINGS (Approx 50)
out += `// ─── 9. BOOKINGS ────────────────────────────────────────────\nexport const bookings: Booking[] = [\n`;
let bookings = [];
students.forEach(s => {
  let count = randomInt(1, 3);
  let tenantSlots = slots.filter(x => x.t === s.t);
  for(let k=0; k<count; k++) {
    let st = randomItem(tenantSlots);
    let sts = randomItem(["confirmed", "completed", "pending"]);
    let bk = { id: bookings.length+1, t: s.t, sid: s.id, slotId: st.slot_id, tid: st.tid };
    bookings.push(bk);
    out += `  { booking_id: ${bk.id}, tenant_id: ${s.t}, slot_id: ${bk.slotId}, student_id: ${s.id}, student_grade: 8, status: "${sts}", created_at: "2026-03-01T10:00:00Z" },\n`;
  }
});
out += `];\n\n`;

// 10. SESSIONS
out += `// ─── 10. SESSIONS ───────────────────────────────────────────\nexport const sessions: Session[] = [\n`;
slots.forEach(sl => {
  let sts = randomItem(["scheduled", "completed"]);
  out += `  { session_id: ${sl.slot_id}, tenant_id: ${sl.t}, slot_id: ${sl.slot_id}, teacher_id: ${sl.tid}, start_time: "2026-03-10T09:00:00Z", end_time: "2026-03-10T10:00:00Z", status: "${sts}", meeting_link: "https://meet.google.com/abc-xyz" },\n`;
});
out += `];\n\n`;

// 11. TRANSACTIONS
out += `// ─── 11. TRANSACTIONS ───────────────────────────────────────\nexport const transactions: Transaction[] = [\n`;
bookings.forEach(bk => {
  let amt = randomInt(100, 300);
  let comm = amt * 0.15;
  let earn = amt - comm;
  let sts = randomItem(["paid", "pending"]);
  out += `  { transaction_id: ${bk.id}, tenant_id: ${bk.t}, booking_id: ${bk.id}, student_id: ${bk.sid}, teacher_id: ${bk.tid}, total_amount: ${amt}, platform_commission: ${comm}, teacher_earnings: ${earn}, payment_status: "${sts}", created_at: "2026-03-02T10:05:00Z" },\n`;
});
out += `];\n\n`;

// 12. REVIEWS
out += `// ─── 12. REVIEWS ────────────────────────────────────────────\nexport const reviews: Review[] = [\n`;
let revs = bookings.slice(0, 40); // 40 reviews
revs.forEach((bk, i) => {
  out += `  { review_id: ${i+1}, tenant_id: ${bk.t}, booking_id: ${bk.id}, student_id: ${bk.sid}, teacher_id: ${bk.tid}, rating: ${randomInt(3, 5)}, comment: "Great session! Highly recommend this tutor.", created_at: "2026-03-05T11:00:00Z" },\n`;
});
out += `];\n\n`;

// 13. NOTIFICATIONS
out += `// ─── 13. NOTIFICATIONS ──────────────────────────────────────\nexport const notifications: Notification[] = [\n`;
let notifId = 1;
students.forEach(s => {
  out += `  { notification_id: ${notifId++}, tenant_id: ${s.t}, recipient_id: ${s.id}, title: "Welcome to EthioTutor!", message: "Your account has been created successfully.", is_read: true, created_at: "2026-02-01T10:00:00Z" },\n`;
});
tutors.slice(0, 20).forEach(t => {
  out += `  { notification_id: ${notifId++}, tenant_id: ${t.t}, recipient_id: ${t.id}, title: "New Booking Received", message: "A student has booked your upcoming slot.", is_read: false, created_at: "2026-03-10T10:00:00Z" },\n`;
});
out += `];\n\n`;

// 14. SESSION RECORDINGS
out += `// ─── 14. SESSION_RECORDINGS (Pro only) ─────────────\nexport const sessionRecordings: SessionRecording[] = [\n`;
let recId = 1;
slots.filter(sl => sl.t === 2).slice(0, 30).forEach(sl => {
  out += `  { recording_id: ${recId++}, tenant_id: 2, session_id: ${sl.slot_id}, storage_url: "https://storage.ethiotutor.et/recordings/session-${sl.slot_id}.mp4", duration_seconds: ${randomInt(1800, 5400)}, created_at: "2026-03-12T09:35:00Z" },\n`;
});
out += `];\n`;

fs.writeFileSync('src/lib/mockData.ts', out);
console.log('Successfully generated extensive mock data to src/lib/mockData.ts');
