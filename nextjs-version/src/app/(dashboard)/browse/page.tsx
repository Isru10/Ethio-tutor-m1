"use client"

import { useEffect, useState, useMemo, Suspense } from "react"
import { useSearchParams } from "next/navigation"
import { BrowseFilters } from "./components/browse-filters"
import { SlotCard } from "./components/slot-card"
import { BookingDialog } from "./components/booking-dialog"
import { LiveBanner } from "./components/live-banner"
import { StartingSoon } from "./components/starting-soon"
import { ActivityFeed } from "./components/activity-feed"
import { Skeleton } from "@/components/ui/skeleton"
import { useAuthStore } from "@/lib/store/useAuthStore"
import { useStudentStore } from "@/store/studentStore"
import { getAvailableSlots } from "@/lib/services/dashboardService"
import type { SlotWithDetails } from "@/types/database"
import { SearchX } from "lucide-react"

const DEFAULT_EXTRA = {
  quickFilters: [] as string[],
  sortBy: "soonest",
  maxPrice: null as number | null,
  minSeats: null as number | null,
}

function BrowseContent() {
  const { user } = useAuthStore()
  const { browseFilters, availableSlots, setAvailableSlots, resetBrowseFilters } = useStudentStore()

  const [loading, setLoading]       = useState(true)
  const [search, setSearch]         = useState("")
  const [extra, setExtra]           = useState(DEFAULT_EXTRA)
  const [selectedSlot, setSelectedSlot] = useState<SlotWithDetails | null>(null)
  const [dialogOpen, setDialogOpen] = useState(false)

  const searchParams         = useSearchParams()
  const preselectedSlotId    = searchParams.get("slot")
  const preselectedTeacherId = searchParams.get("teacher")

  useEffect(() => {
    if (!user) return
    setLoading(true)
    getAvailableSlots(user.tenant_id, {
      subjectId: browseFilters.subjectId,
      gradeId:   browseFilters.gradeId,
      dateFrom:  browseFilters.dateFrom || undefined,
    }).then(slots => { setAvailableSlots(slots); setLoading(false) })
  }, [user, browseFilters.subjectId, browseFilters.gradeId, browseFilters.dateFrom, setAvailableSlots])

  useEffect(() => {
    if (preselectedSlotId && availableSlots.length > 0) {
      const slot = availableSlots.find(s => s.slot.slot_id === parseInt(preselectedSlotId))
      if (slot) { setSelectedSlot(slot); setDialogOpen(true) }
    }
  }, [preselectedSlotId, availableSlots])

  const now = useMemo(() => new Date(), [])

  const filteredSlots = useMemo(() => {
    let result = availableSlots

    // Remove past slots
    result = result.filter(s => {
      const start = new Date(`${s.slot.slot_date.split("T")[0]}T${s.slot.start_time.slice(0, 5)}:00`)
      return start.getTime() > now.getTime()
    })

    if (preselectedTeacherId) {
      result = result.filter(s => s.slot.teacher_id === parseInt(preselectedTeacherId))
    }

    if (search.trim()) {
      const q = search.toLowerCase()
      result = result.filter(s =>
        s.teacher.name.toLowerCase().includes(q) ||
        s.subject.name.toLowerCase().includes(q)
      )
    }

    // Quick filters
    if (extra.quickFilters.includes("today")) {
      const today = now.toISOString().split("T")[0]
      result = result.filter(s => s.slot.slot_date.split("T")[0] === today)
    }
    if (extra.quickFilters.includes("week")) {
      const weekEnd = new Date(now.getTime() + 7 * 86400000).toISOString().split("T")[0]
      result = result.filter(s => s.slot.slot_date.split("T")[0] <= weekEnd)
    }
    if (extra.quickFilters.includes("seats")) {
      result = result.filter(s => s.slot.remaining_seats > 0)
    }
    if (extra.quickFilters.includes("cheap")) {
      result = result.filter(s => Number(s.teacher_profile.hourly_rate) < 200)
    }
    if (extra.quickFilters.includes("short")) {
      result = result.filter(s => {
        const [sh, sm] = s.slot.start_time.slice(0, 5).split(":").map(Number)
        const [eh, em] = s.slot.end_time.slice(0, 5).split(":").map(Number)
        return (eh * 60 + em) - (sh * 60 + sm) <= 60
      })
    }
    if (extra.quickFilters.includes("long")) {
      result = result.filter(s => {
        const [sh, sm] = s.slot.start_time.slice(0, 5).split(":").map(Number)
        const [eh, em] = s.slot.end_time.slice(0, 5).split(":").map(Number)
        return (eh * 60 + em) - (sh * 60 + sm) >= 120
      })
    }

    // Advanced filters
    if (extra.maxPrice) {
      result = result.filter(s => Number(s.teacher_profile.hourly_rate) <= extra.maxPrice!)
    }
    if (extra.minSeats) {
      result = result.filter(s => s.slot.remaining_seats >= extra.minSeats!)
    }

    // Sort
    result = [...result].sort((a, b) => {
      const aDate = new Date(`${a.slot.slot_date.split("T")[0]}T${a.slot.start_time.slice(0, 5)}:00`)
      const bDate = new Date(`${b.slot.slot_date.split("T")[0]}T${b.slot.start_time.slice(0, 5)}:00`)

      if (extra.sortBy === "price_asc")  return Number(a.teacher_profile.hourly_rate) - Number(b.teacher_profile.hourly_rate)
      if (extra.sortBy === "price_desc") return Number(b.teacher_profile.hourly_rate) - Number(a.teacher_profile.hourly_rate)
      if (extra.sortBy === "seats")      return b.slot.remaining_seats - a.slot.remaining_seats
      if (extra.sortBy === "rating")     return Number(b.teacher_profile.average_rating) - Number(a.teacher_profile.average_rating)

      // Default: soonest first, urgent (within 24h) pinned top
      const aIn24h = (aDate.getTime() - now.getTime()) < 86400000
      const bIn24h = (bDate.getTime() - now.getTime()) < 86400000
      if (aIn24h && !bIn24h) return -1
      if (!aIn24h && bIn24h) return 1
      return aDate.getTime() - bDate.getTime()
    })

    return result
  }, [availableSlots, search, preselectedTeacherId, now, extra])

  const handleBook = (slotId: number) => {
    const slot = availableSlots.find(s => s.slot.slot_id === slotId)
    if (slot) { setSelectedSlot(slot); setDialogOpen(true) }
  }

  const handleClearAll = () => {
    resetBrowseFilters()
    setSearch("")
    setExtra(DEFAULT_EXTRA)
  }

  return (
    <>
      <div className="px-4 lg:px-6">
        <h1 className="text-2xl font-bold tracking-tight">Browse Classes</h1>
        <p className="text-muted-foreground text-sm">Find and book sessions with available teachers.</p>
      </div>

      {/* Mobile activity feed — horizontal marquee */}
      {!loading && (
        <div className="px-4 lg:px-6 xl:hidden overflow-hidden">
          <ActivityFeed slots={filteredSlots} />
        </div>
      )}

      {/* Live banner */}
      {!loading && (
        <div className="px-4 lg:px-6">
          <LiveBanner totalSlots={filteredSlots.length} />
        </div>
      )}

      {/* Rich filters */}
      <div className="px-4 lg:px-6">
        <BrowseFilters
          search={search}
          onSearchChange={setSearch}
          extraFilters={extra}
          onExtraFilterChange={(k, v) => setExtra(prev => ({ ...prev, [k]: v }))}
          onClearAll={handleClearAll}
        />
      </div>

      {loading ? (
        <div className="px-4 lg:px-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-72 rounded-xl" />)}
        </div>
      ) : filteredSlots.length === 0 ? (
        <div className="px-4 lg:px-6 flex flex-col items-center justify-center gap-3 py-20 text-center">
          <SearchX className="size-10 text-muted-foreground/50" />
          <p className="text-muted-foreground text-sm font-medium">No classes match your filters.</p>
          <p className="text-muted-foreground text-xs">Try adjusting your filters.</p>
        </div>
      ) : (
        <div className="px-4 lg:px-6 flex gap-5">
          {/* Main content */}
          <div className="flex-1 min-w-0 space-y-6">
            {!search && extra.quickFilters.length === 0 && (
              <StartingSoon slots={filteredSlots} onBook={handleBook} />
            )}
            <div className="space-y-3">
              <p className="text-sm text-muted-foreground">
                <span className="font-semibold text-foreground">{filteredSlots.length}</span>
                {" class"}{filteredSlots.length !== 1 ? "es" : ""} available
              </p>
              <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                {filteredSlots.map(slot => (
                  <SlotCard key={slot.slot.slot_id} slot={slot} onBook={handleBook} />
                ))}
              </div>
            </div>
          </div>

          {/* Desktop vertical snake */}
          <div className="hidden xl:block w-[236px] shrink-0 h-[calc(100vh-12rem)] sticky top-6">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2.5">
              Live Activity
            </p>
            <ActivityFeed slots={filteredSlots} className="h-[calc(100%-2rem)]" />
          </div>
        </div>
      )}

      <BookingDialog
        slot={selectedSlot}
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        onConfirm={() => setAvailableSlots(availableSlots.filter(s => s.slot.slot_id !== selectedSlot?.slot.slot_id))}
      />
    </>
  )
}

export default function BrowsePage() {
  return (
    <Suspense fallback={
      <div className="px-4 lg:px-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-72 rounded-xl" />)}
      </div>
    }>
      <BrowseContent />
    </Suspense>
  )
}
