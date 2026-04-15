import { StatsCards } from "./components/stats-cards"
import { TopTeachers } from "./components/top-teachers"
import { Charts } from "./components/charts"

export const metadata = {
  title: "Student Analytics Dashboard | EthioTutor",
  description: "Monitor your learning progress, streaks, and top performing tutors.",
}

export default function StudentDashboardPage() {
  return (
    <div className="flex flex-col gap-8 p-4 lg:p-6 min-h-screen bg-muted/5">
      {/* Page Header */}
      <div className="flex flex-col gap-1">
        <h1 className="text-3xl font-bold tracking-tight">Student Dashboard</h1>
        <p className="text-muted-foreground text-sm max-w-2xl">
          Welcome to your personalized learning analytics. Track your streaks, review your top teachers, and visualize your session activity.
        </p>
      </div>

      {/* Stats Section */}
      <section className="space-y-4">
        <h2 className="text-sm font-bold uppercase tracking-[0.2em] text-muted-foreground/60">Performance Overview</h2>
        <StatsCards />
      </section>

      {/* Analytics Section */}
      <section className="space-y-4">
        <h2 className="text-sm font-bold uppercase tracking-[0.2em] text-muted-foreground/60">Learning Insights</h2>
        <Charts />
      </section>

      {/* Top Teachers Section */}
      <section className="space-y-4">
        <TopTeachers />
      </section>
    </div>
  )
}
