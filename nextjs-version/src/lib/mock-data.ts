import { TutorWithProfile, SlotWithDetails } from "@/types/database"

export interface MockStudentStats {
  totalSessions: number
  uniqueTeachers: number
  streakDaily: number
  streakMonthly: number
  streakYearly: number
}

export const STUDENT_STATS: MockStudentStats = {
  totalSessions: 42,
  uniqueTeachers: 8,
  streakDaily: 5,
  streakMonthly: 12,
  streakYearly: 124,
}

export const SESSIONS_BY_DATE = [
  { date: "2024-04-01", count: 2 },
  { date: "2024-04-02", count: 1 },
  { date: "2024-04-03", count: 3 },
  { date: "2024-04-04", count: 0 },
  { date: "2024-04-05", count: 2 },
  { date: "2024-04-06", count: 4 },
  { date: "2024-04-07", count: 1 },
  { date: "2024-04-08", count: 2 },
  { date: "2024-04-09", count: 3 },
  { date: "2024-04-10", count: 5 },
  { date: "2024-04-11", count: 2 },
  { date: "2024-04-12", count: 1 },
  { date: "2024-04-13", count: 0 },
  { date: "2024-04-14", count: 2 },
  { date: "2024-04-15", count: 3 },
]

export const SESSIONS_PER_TEACHER = [
  { name: "Abebe Bikila", count: 12 },
  { name: "Selamawit Dagmawi", count: 8 },
  { name: "Yohannes Haile", count: 7 },
  { name: "Tewodros Kassahun", count: 6 },
  { name: "Eskinder Nega", count: 5 },
  { name: "Birtukan Mideksa", count: 4 },
]

export type ExtendedTutor = TutorWithProfile & {
  totalStudentsTaught: number
  sessionsWithStudent: number
}

export const MOCK_TEACHERS: ExtendedTutor[] = [
  {
    user: {
      user_id: 1,
      tenant_id: 1,
      name: "Abebe Bikila",
      email: "abebe@example.com",
      role: "TUTOR",
      status: "active",
    },
    profile: {
      teacher_profile_id: 1,
      tenant_id: 1,
      user_id: 1,
      bio: "Passionate Mathematics tutor with over 10 years of experience in helping students excel in competitive exams.",
      qualifications: "MSc in Applied Mathematics, Addis Ababa University",
      experience_years: 12,
      hourly_rate: 450,
      languages: "Amharic,English",
      image_profile: "",
      teacher_image: "",
      file: "",
      average_rating: 4.9,
    },
    subjects: [
      { id: 1, tenant_id: 1, teacher_id: 1, subject_id: 1, grade_from: 9, grade_to: 12, subject: { subject_id: 1, tenant_id: 1, name: "Mathematics", category: "Math" } },
      { id: 2, tenant_id: 1, teacher_id: 1, subject_id: 2, grade_from: 9, grade_to: 12, subject: { subject_id: 2, tenant_id: 1, name: "Physics", category: "Science" } },
    ],
    reviewCount: 156,
    totalStudentsTaught: 450,
    sessionsWithStudent: 12,
  },
  {
    user: {
      user_id: 2,
      tenant_id: 1,
      name: "Selamawit Dagmawi",
      email: "selam@example.com",
      role: "TUTOR",
      status: "active",
    },
    profile: {
      teacher_profile_id: 2,
      tenant_id: 1,
      user_id: 2,
      bio: "English language expert specializing in literature and creative writing. I focus on building confidence and expression.",
      qualifications: "BA in English Literature",
      experience_years: 8,
      hourly_rate: 350,
      languages: "Amharic,English,French",
      image_profile: "",
      teacher_image: "",
      file: "",
      average_rating: 4.8,
    },
    subjects: [
      { id: 3, tenant_id: 1, teacher_id: 2, subject_id: 3, grade_from: 1, grade_to: 8, subject: { subject_id: 3, tenant_id: 1, name: "English", category: "Language" } },
    ],
    reviewCount: 98,
    totalStudentsTaught: 210,
    sessionsWithStudent: 8,
  },
  {
    user: {
      user_id: 3,
      tenant_id: 1,
      name: "Yohannes Haile",
      email: "yohannes@example.com",
      role: "TUTOR",
      status: "active",
    },
    profile: {
      teacher_profile_id: 3,
      tenant_id: 1,
      user_id: 3,
      bio: "Enthusiastic Science teacher with a focus on Biology and Chemistry. Making complex concepts easy to understand.",
      qualifications: "BSc in Biology",
      experience_years: 5,
      hourly_rate: 300,
      languages: "Amharic,English,Tigrigna",
      image_profile: "",
      teacher_image: "",
      file: "",
      average_rating: 4.7,
    },
    subjects: [
      { id: 4, tenant_id: 1, teacher_id: 3, subject_id: 4, grade_from: 9, grade_to: 12, subject: { subject_id: 4, tenant_id: 1, name: "Biology", category: "Science" } },
      { id: 5, tenant_id: 1, teacher_id: 3, subject_id: 5, grade_from: 9, grade_to: 12, subject: { subject_id: 5, tenant_id: 1, name: "Chemistry", category: "Science" } },
    ],
    reviewCount: 45,
    totalStudentsTaught: 120,
    sessionsWithStudent: 7,
  },
  {
    user: {
      user_id: 4,
      tenant_id: 1,
      name: "Tewodros Kassahun",
      email: "teddy@example.com",
      role: "TUTOR",
      status: "active",
    },
    profile: {
      teacher_profile_id: 4,
      tenant_id: 1,
      user_id: 4,
      bio: "History and Social Studies enthusiast. I bring the past to life through engaging storytelling.",
      qualifications: "BA in History",
      experience_years: 15,
      hourly_rate: 400,
      languages: "Amharic,English",
      image_profile: "",
      teacher_image: "",
      file: "",
      average_rating: 4.9,
    },
    subjects: [
      { id: 6, tenant_id: 1, teacher_id: 4, subject_id: 6, grade_from: 1, grade_to: 12, subject: { subject_id: 6, tenant_id: 1, name: "History", category: "Social Sciences" } },
    ],
    reviewCount: 230,
    totalStudentsTaught: 800,
    sessionsWithStudent: 6,
  },
  {
    user: {
      user_id: 5,
      tenant_id: 1,
      name: "Birtukan Mideksa",
      email: "birty@example.com",
      role: "TUTOR",
      status: "active",
    },
    profile: {
      teacher_profile_id: 5,
      tenant_id: 1,
      user_id: 5,
      bio: "Afaan Oromoo and Amharic language specialist. Helping students master their native and secondary languages.",
      qualifications: "MA in Linguistics",
      experience_years: 10,
      hourly_rate: 380,
      languages: "Amharic,Afaan Oromoo,English",
      image_profile: "",
      teacher_image: "",
      file: "",
      average_rating: 4.8,
    },
    subjects: [
      { id: 7, tenant_id: 1, teacher_id: 5, subject_id: 7, grade_from: 1, grade_to: 12, subject: { subject_id: 7, tenant_id: 1, name: "Amharic", category: "Language" } },
      { id: 8, tenant_id: 1, teacher_id: 5, subject_id: 8, grade_from: 1, grade_to: 12, subject: { subject_id: 8, tenant_id: 1, name: "Afaan Oromoo", category: "Language" } },
    ],
    reviewCount: 112,
    totalStudentsTaught: 340,
    sessionsWithStudent: 4,
  },
  {
    user: {
      user_id: 6,
      tenant_id: 1,
      name: "Eskinder Nega",
      email: "eskinder@example.com",
      role: "TUTOR",
      status: "active",
    },
    profile: {
      teacher_profile_id: 6,
      tenant_id: 1,
      user_id: 6,
      bio: "Geography and Environment expert. I focus on physical geography and climate studies.",
      qualifications: "BSc in Geography",
      experience_years: 6,
      hourly_rate: 320,
      languages: "Amharic,English",
      image_profile: "",
      teacher_image: "",
      file: "",
      average_rating: 4.5,
    },
    subjects: [
      { id: 9, tenant_id: 1, teacher_id: 6, subject_id: 9, grade_from: 9, grade_to: 12, subject: { subject_id: 9, tenant_id: 1, name: "Geography", category: "Social Sciences" } },
    ],
    reviewCount: 32,
    totalStudentsTaught: 85,
    sessionsWithStudent: 5,
  },
]
