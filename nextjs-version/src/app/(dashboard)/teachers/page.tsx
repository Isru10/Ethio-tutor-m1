import { TeacherList } from "./components/teacher-list"

export const metadata = {
  title: "Find Teachers | EthioTutor",
  description: "Browse and filter our expert teachers to find the perfect match for your learning goals.",
}

export default function TeachersPage() {
  return (
    <div className="flex flex-col gap-8 p-4 lg:p-6 min-h-screen bg-muted/5">
      {/* Page Header */}
      <div className="flex flex-col gap-1">
        <h1 className="text-3xl font-bold tracking-tight">Expert Teachers</h1>
        <p className="text-muted-foreground text-sm max-w-2xl">
          Discover highly qualified tutors from across Ethiopia. Filter by rating, subject, and experience to find the perfect mentor.
        </p>
      </div>

      {/* Main Content */}
      <TeacherList />
    </div>
  )
}
