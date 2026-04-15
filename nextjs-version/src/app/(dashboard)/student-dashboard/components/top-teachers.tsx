"use client"

import { MOCK_TEACHERS } from "@/lib/mock-data"
import { TeacherCard } from "../../dashboard/components/teacher-card"

export function TopTeachers() {
  // Sort by rating descending and take top 5
  const topTeachers = [...MOCK_TEACHERS]
    .sort((a, b) => b.profile.average_rating - a.profile.average_rating)
    .slice(0, 5)

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold tracking-tight">Top Rated Teachers</h2>
        <span className="text-xs text-muted-foreground bg-muted px-2 py-1 rounded-full uppercase tracking-widest font-bold">
          Based on your sessions
        </span>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {topTeachers.map((tutor) => (
          <TeacherCard
            key={tutor.user.user_id}
            tutor={tutor}
            slots={[]} // We don't need slots for this summary view
          />
        ))}
      </div>
    </div>
  )
}
