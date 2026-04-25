"use client"

import { useEffect, useState } from "react"
import { useStudentStore } from "@/store/studentStore"
import { useAuthStore } from "@/store/authStore"
import { getSubjects, getGrades } from "@/lib/services/dashboardService"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import {
  SlidersHorizontal, X, Search, CalendarDays,
  Clock, Users, Banknote, ChevronDown, ChevronUp,
} from "lucide-react"
import { cn } from "@/lib/utils"

// Quick-filter tag pills
const QUICK_FILTERS = [
  { label: "Today",        key: "today"     },
  { label: "This Week",    key: "week"      },
  { label: "Seats Left",   key: "seats"     },
  { label: "Under 200 ETB",key: "cheap"     },
  { label: "1h Sessions",  key: "short"     },
  { label: "2h+ Sessions", key: "long"      },
]

const SORT_OPTIONS = [
  { label: "Soonest first",    value: "soonest"  },
  { label: "Price: Low → High",value: "price_asc"},
  { label: "Price: High → Low",value: "price_desc"},
  { label: "Most seats",       value: "seats"    },
  { label: "Top rated",        value: "rating"   },
]

export interface BrowseFilterState {
  search: string
  subjectId: number | null
  gradeId: number | null
  dateFrom: string
  quickFilters: string[]
  sortBy: string
  maxPrice: number | null
  minSeats: number | null
}

type ExtraFilters = Omit<BrowseFilterState, "search" | "subjectId" | "gradeId" | "dateFrom">

interface BrowseFiltersProps {
  search: string
  onSearchChange: (val: string) => void
  extraFilters: ExtraFilters
  onExtraFilterChange: (key: keyof ExtraFilters, value: any) => void
  onClearAll: () => void
}

export function BrowseFilters({
  search, onSearchChange, extraFilters, onExtraFilterChange, onClearAll,
}: BrowseFiltersProps) {
  const { user } = useAuthStore()
  const {
    browseFilters, setBrowseFilter, resetBrowseFilters,
    subjects, grades, setSubjects, setGrades,
  } = useStudentStore()

  const [expanded, setExpanded] = useState(false)

  useEffect(() => {
    if (!user) return
    getSubjects(user.tenant_id).then(setSubjects)
    getGrades(user.tenant_id).then(setGrades)
  }, [user, setSubjects, setGrades])

  const toggleQuick = (key: string) => {
    const current = extraFilters.quickFilters
    const next = current.includes(key) ? current.filter(k => k !== key) : [...current, key]
    onExtraFilterChange("quickFilters", next)
  }

  const activeCount =
    (browseFilters.subjectId ? 1 : 0) +
    (browseFilters.gradeId ? 1 : 0) +
    (browseFilters.dateFrom ? 1 : 0) +
    (search ? 1 : 0) +
    extraFilters.quickFilters.length +
    (extraFilters.maxPrice ? 1 : 0) +
    (extraFilters.minSeats ? 1 : 0)

  return (
    <div className="rounded-xl border bg-card overflow-hidden">
      {/* ── Top bar ── */}
      <div className="flex items-center gap-3 p-3 flex-wrap">
        {/* Search */}
        <div className="relative flex-1 min-w-[160px]">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground" />
          <Input
            placeholder="Search teacher or subject…"
            value={search}
            onChange={e => onSearchChange(e.target.value)}
            className="h-9 pl-8 text-sm"
          />
        </div>

        {/* Subject */}
        <Select
          value={browseFilters.subjectId?.toString() ?? "all"}
          onValueChange={v => setBrowseFilter("subjectId", v === "all" ? null : parseInt(v))}
        >
          <SelectTrigger className="h-9 w-[140px] text-sm">
            <SelectValue placeholder="Subject" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Subjects</SelectItem>
            {subjects.map(s => (
              <SelectItem key={s.subject_id} value={s.subject_id.toString()}>{s.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Grade */}
        <Select
          value={browseFilters.gradeId?.toString() ?? "all"}
          onValueChange={v => setBrowseFilter("gradeId", v === "all" ? null : parseInt(v))}
        >
          <SelectTrigger className="h-9 w-[130px] text-sm">
            <SelectValue placeholder="Grade" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Grades</SelectItem>
            {grades.map(g => (
              <SelectItem key={g.grade_id} value={g.grade_id.toString()}>{g.grade_name}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Sort */}
        <Select value={extraFilters.sortBy} onValueChange={v => onExtraFilterChange("sortBy", v)}>
          <SelectTrigger className="h-9 w-[160px] text-sm">
            <SelectValue placeholder="Sort by" />
          </SelectTrigger>
          <SelectContent>
            {SORT_OPTIONS.map(o => (
              <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Expand toggle */}
        <Button
          variant="outline"
          size="sm"
          className="h-9 gap-1.5 text-xs shrink-0"
          onClick={() => setExpanded(v => !v)}
        >
          <SlidersHorizontal className="size-3.5" />
          More
          {activeCount > 0 && (
            <Badge className="h-4 w-4 p-0 text-[9px] flex items-center justify-center rounded-full">
              {activeCount}
            </Badge>
          )}
          {expanded ? <ChevronUp className="size-3" /> : <ChevronDown className="size-3" />}
        </Button>

        {activeCount > 0 && (
          <Button variant="ghost" size="sm" className="h-9 gap-1 text-xs text-muted-foreground" onClick={onClearAll}>
            <X className="size-3" /> Clear
          </Button>
        )}
      </div>

      {/* ── Quick filter pills ── */}
      <div className="px-3 pb-3 flex flex-wrap gap-1.5">
        {QUICK_FILTERS.map(f => (
          <button
            key={f.key}
            onClick={() => toggleQuick(f.key)}
            className={cn(
              "text-xs px-2.5 py-1 rounded-full border transition-all duration-150 font-medium",
              extraFilters.quickFilters.includes(f.key)
                ? "bg-primary text-primary-foreground border-primary"
                : "bg-background text-muted-foreground border-border hover:border-primary/50 hover:text-foreground"
            )}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* ── Expanded advanced filters ── */}
      {expanded && (
        <>
          <Separator />
          <div className="p-3 grid grid-cols-1 sm:grid-cols-3 gap-3">
            {/* Date */}
            <div className="space-y-1">
              <label className="text-xs font-medium text-muted-foreground flex items-center gap-1">
                <CalendarDays className="size-3" /> From Date
              </label>
              <Input
                type="date"
                className="h-8 text-xs"
                value={browseFilters.dateFrom}
                onChange={e => setBrowseFilter("dateFrom", e.target.value)}
              />
            </div>

            {/* Max price */}
            <div className="space-y-1">
              <label className="text-xs font-medium text-muted-foreground flex items-center gap-1">
                <Banknote className="size-3" /> Max Price (ETB)
              </label>
              <Input
                type="number"
                placeholder="e.g. 500"
                className="h-8 text-xs"
                value={extraFilters.maxPrice ?? ""}
                onChange={e => onExtraFilterChange("maxPrice", e.target.value ? Number(e.target.value) : null)}
              />
            </div>

            {/* Min seats */}
            <div className="space-y-1">
              <label className="text-xs font-medium text-muted-foreground flex items-center gap-1">
                <Users className="size-3" /> Min Seats Available
              </label>
              <Select
                value={extraFilters.minSeats?.toString() ?? "any"}
                onValueChange={v => onExtraFilterChange("minSeats", v === "any" ? null : parseInt(v))}
              >
                <SelectTrigger className="h-8 text-xs">
                  <SelectValue placeholder="Any" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="any">Any</SelectItem>
                  <SelectItem value="1">At least 1</SelectItem>
                  <SelectItem value="2">At least 2</SelectItem>
                  <SelectItem value="3">At least 3</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
