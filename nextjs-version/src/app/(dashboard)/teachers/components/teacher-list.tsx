"use client"

import { useState, useMemo } from "react"
import { MOCK_TEACHERS } from "@/lib/mock-data"
import { TeacherCard } from "../../dashboard/components/teacher-card"
import { TeacherFilters } from "./teacher-filters"
import { LayoutGrid, List, SlidersHorizontal } from "lucide-react"
import { Button } from "@/components/ui/button"

export function TeacherList() {
  const [filters, setFilters] = useState({
    search: "",
    rating: 0,
    subject: "all",
    minStudents: 0,
  })

  // Derive unique subjects for the filter dropdown
  const allSubjects = useMemo(() => {
    const subjects = new Set<string>()
    MOCK_TEACHERS.forEach((tutor) => {
      tutor.subjects.forEach((s) => subjects.add(s.subject.name))
    })
    return Array.from(subjects).sort()
  }, [])

  // Filtering logic
  const filteredTeachers = useMemo(() => {
    return MOCK_TEACHERS.filter((tutor) => {
      const matchesSearch = tutor.user.name.toLowerCase().includes(filters.search.toLowerCase())
      const matchesRating = tutor.profile.average_rating >= filters.rating
      const matchesSubject = filters.subject === "all" || 
        tutor.subjects.some((s) => s.subject.name === filters.subject)
      const matchesStudents = tutor.totalStudentsTaught >= filters.minStudents

      return matchesSearch && matchesRating && matchesSubject && matchesStudents
    })
  }, [filters])

  return (
    <div className="space-y-8">
      {/* Filters Section */}
      <TeacherFilters 
        filters={filters} 
        setFilters={setFilters} 
        subjects={allSubjects} 
      />

      {/* Grid Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold">Available Teachers</h2>
          <p className="text-sm text-muted-foreground">Showing {filteredTeachers.length} results</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" className="h-9 w-9">
            <LayoutGrid className="size-4" />
          </Button>
          <Button variant="ghost" size="icon" className="h-9 w-9">
            <List className="size-4" />
          </Button>
        </div>
      </div>

      {/* Results Grid */}
      {filteredTeachers.length > 0 ? (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filteredTeachers.map((tutor) => (
            <TeacherCard
              key={tutor.user.user_id}
              tutor={tutor}
              slots={[]} // Mocked as empty for listing
            />
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-20 text-center border-2 border-dashed rounded-3xl bg-muted/30">
          <div className="p-4 rounded-full bg-muted mb-4">
            <SlidersHorizontal className="size-8 text-muted-foreground" />
          </div>
          <h3 className="text-lg font-semibold">No teachers found</h3>
          <p className="text-muted-foreground text-sm max-w-xs mx-auto mt-2">
            Try adjusting your filters or search terms to find what you're looking for.
          </p>
          <Button 
            variant="link" 
            className="mt-4"
            onClick={() => setFilters({ search: "", rating: 0, subject: "all", minStudents: 0 })}
          >
            Clear all filters
          </Button>
        </div>
      )}
    </div>
  )
}
