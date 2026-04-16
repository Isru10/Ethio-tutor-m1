"use client"

import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Slider } from "@/components/ui/slider"
import { Search, Star, Users, GraduationCap } from "lucide-react"

interface TeacherFiltersProps {
  filters: {
    search: string
    rating: number
    subject: string
    minStudents: number
  }
  setFilters: (filters: any) => void
  subjects: string[]
}

export function TeacherFilters({ filters, setFilters, subjects }: TeacherFiltersProps) {
  return (
    <div className="bg-card border rounded-2xl p-6 shadow-sm space-y-8">
      <div className="flex flex-col gap-2">
        <h3 className="text-lg font-bold">Search & Filter</h3>
        <p className="text-xs text-muted-foreground uppercase tracking-widest font-bold">Refine your results</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {/* Name Search */}
        <div className="space-y-2">
          <label className="text-xs font-bold flex items-center gap-2">
            <Search className="size-3 text-primary" />
            Teacher Name
          </label>
          <Input
            placeholder="Search by name..."
            value={filters.search}
            onChange={(e) => setFilters({ ...filters, search: e.target.value })}
            className="h-10 text-sm"
          />
        </div>

        {/* Subject Filter */}
        <div className="space-y-2">
          <label className="text-xs font-bold flex items-center gap-2">
            <GraduationCap className="size-3 text-primary" />
            Subject
          </label>
          <Select
            value={filters.subject}
            onValueChange={(val) => setFilters({ ...filters, subject: val })}
          >
            <SelectTrigger className="h-10 text-sm">
              <SelectValue placeholder="All Subjects" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Subjects</SelectItem>
              {subjects.map((subj) => (
                <SelectItem key={subj} value={subj}>
                  {subj}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Rating Filter (Slider) */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <label className="text-xs font-bold flex items-center gap-2">
              <Star className="size-3 text-amber-500 fill-amber-500" />
              Min Rating: <span className="text-primary">{filters.rating.toFixed(1)}</span>
            </label>
          </div>
          <Slider
            value={[filters.rating]}
            min={0}
            max={5}
            step={0.1}
            onValueChange={([val]: number[]) => setFilters({ ...filters, rating: val })}
            className="py-1"
          />
        </div>

        {/* Students Taught Filter (Slider) */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <label className="text-xs font-bold flex items-center gap-2">
              <Users className="size-3 text-blue-500" />
              Min Students: <span className="text-primary">{filters.minStudents}+</span>
            </label>
          </div>
          <Slider
            value={[filters.minStudents]}
            min={0}
            max={1000}
            step={10}
            onValueChange={([val]: number[]) => setFilters({ ...filters, minStudents: val })}
            className="py-1"
          />
        </div>
      </div>
    </div>
  )
}
