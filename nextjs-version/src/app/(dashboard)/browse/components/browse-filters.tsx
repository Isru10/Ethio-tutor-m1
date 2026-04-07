"use client"

import { useEffect } from "react"
import { useStudentStore } from "@/store/studentStore"
import { useAuthStore } from "@/store/authStore"
import { getSubjects, getGrades } from "@/lib/services/dashboardService"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { SlidersHorizontal, X } from "lucide-react"

interface BrowseFiltersProps {
  search: string
  onSearchChange: (val: string) => void
}

export function BrowseFilters({ search, onSearchChange }: BrowseFiltersProps) {
  const { user } = useAuthStore()
  const {
    browseFilters, setBrowseFilter, resetBrowseFilters,
    subjects, grades, setSubjects, setGrades,
  } = useStudentStore()

  // Load subjects and grades on mount
  useEffect(() => {
    if (!user) return
    getSubjects(user.tenant_id).then(setSubjects)
    getGrades(user.tenant_id).then(setGrades)
  }, [user, setSubjects, setGrades])

  const hasActiveFilters =
    browseFilters.subjectId !== null ||
    browseFilters.gradeId !== null ||
    browseFilters.dateFrom !== "" ||
    search !== ""

  return (
    <div className="flex flex-col gap-3 rounded-xl border bg-card p-4">
      <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
        <SlidersHorizontal className="size-4" />
        Filter Classes
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {/* Teacher name search */}
        <Input
          placeholder="Search teacher name…"
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          className="h-9"
        />

        {/* Subject filter */}
        <Select
          value={browseFilters.subjectId?.toString() ?? "all"}
          onValueChange={(v) =>
            setBrowseFilter("subjectId", v === "all" ? null : parseInt(v))
          }
        >
          <SelectTrigger className="h-9">
            <SelectValue placeholder="All Subjects" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Subjects</SelectItem>
            {subjects.map((s) => (
              <SelectItem key={s.subject_id} value={s.subject_id.toString()}>
                {s.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Grade filter */}
        <Select
          value={browseFilters.gradeId?.toString() ?? "all"}
          onValueChange={(v) =>
            setBrowseFilter("gradeId", v === "all" ? null : parseInt(v))
          }
        >
          <SelectTrigger className="h-9">
            <SelectValue placeholder="All Grades" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Grades</SelectItem>
            {grades.map((g) => (
              <SelectItem key={g.grade_id} value={g.grade_id.toString()}>
                {g.grade_name} · {g.level_group}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Date filter */}
        <Input
          type="date"
          className="h-9"
          value={browseFilters.dateFrom}
          onChange={(e) => setBrowseFilter("dateFrom", e.target.value)}
        />
      </div>

      {/* Clear filters */}
      {hasActiveFilters && (
        <div className="flex justify-end">
          <Button
            variant="ghost"
            size="sm"
            className="h-7 text-xs gap-1 text-muted-foreground hover:text-foreground"
            onClick={() => {
              resetBrowseFilters()
              onSearchChange("")
            }}
          >
            <X className="size-3" />
            Clear filters
          </Button>
        </div>
      )}
    </div>
  )
}
