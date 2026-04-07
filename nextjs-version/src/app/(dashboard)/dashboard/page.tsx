import { StudentStatCards } from "./components/student-stat-cards"
import { TeacherCardGrid } from "./components/teacher-card-grid"

export default function StudentDashboardPage() {
  return (
    <>
      {/* Page heading */}
      <div className="px-4 lg:px-6">
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground text-sm">
            Welcome back! Book a class with one of our available teachers.
          </p>
        </div>
      </div>

      {/* Stats row */}
      <div className="px-4 lg:px-6">
        <StudentStatCards />
      </div>

      {/* Available teachers section */}
      <div className="px-4 lg:px-6 space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">Available Teachers</h2>
          <a
            href="/browse"
            className="text-sm text-primary hover:underline underline-offset-4"
          >
            Browse all →
          </a>
        </div>
        <TeacherCardGrid />
      </div>
    </>
  )
}
