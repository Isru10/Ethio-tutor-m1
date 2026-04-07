"use client"

import { useEffect, useState, useMemo } from "react"
import { useSearchParams } from "next/navigation"
import { BrowseFilters } from "./components/browse-filters"
import { SlotCard } from "./components/slot-card"
import { BookingDialog } from "./components/booking-dialog"
import { Skeleton } from "@/components/ui/skeleton"
import { useAuthStore } from "@/lib/store/useAuthStore"
import { useStudentStore } from "@/store/studentStore"
import { getAvailableSlots } from "@/lib/services/dashboardService"
import type { SlotWithDetails } from "@/types/database"
import { SearchX } from "lucide-react"

export default function BrowsePage() {
  const { user } = useAuthStore()
  const { browseFilters, availableSlots, setAvailableSlots } = useStudentStore()

  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [selectedSlot, setSelectedSlot] = useState<SlotWithDetails | null>(null)
  const [dialogOpen, setDialogOpen] = useState(false)

  const searchParams = useSearchParams()
  const preselectedSlotId = searchParams.get("slot")
  const preselectedTeacherId = searchParams.get("teacher")

  // Load available slots
  useEffect(() => {
    if (!user) return
    setLoading(true)
    getAvailableSlots(user.tenant_id, {
      subjectId: browseFilters.subjectId,
      gradeId: browseFilters.gradeId,
      dateFrom: browseFilters.dateFrom || undefined,
    }).then((slots) => {
      setAvailableSlots(slots)
      setLoading(false)
    })
  }, [user, browseFilters.subjectId, browseFilters.gradeId, browseFilters.dateFrom, setAvailableSlots])

  // Open dialog if URL has ?slot=xxx
  useEffect(() => {
    if (preselectedSlotId && availableSlots.length > 0) {
      const slot = availableSlots.find(
        (s) => s.slot.slot_id === parseInt(preselectedSlotId)
      )
      if (slot) {
        setSelectedSlot(slot)
        setDialogOpen(true)
      }
    }
  }, [preselectedSlotId, availableSlots])

  // Client-side search filter + teacher pre-filter
  const filteredSlots = useMemo(() => {
    let result = availableSlots

    if (preselectedTeacherId) {
      result = result.filter(
        (s) => s.slot.teacher_id === parseInt(preselectedTeacherId)
      )
    }

    if (search.trim()) {
      const q = search.toLowerCase()
      result = result.filter(
        (s) =>
          s.teacher.name.toLowerCase().includes(q) ||
          s.subject.name.toLowerCase().includes(q)
      )
    }

    return result
  }, [availableSlots, search, preselectedTeacherId])

  const handleBook = (slotId: number) => {
    const slot = availableSlots.find((s) => s.slot.slot_id === slotId)
    if (slot) {
      setSelectedSlot(slot)
      setDialogOpen(true)
    }
  }

  const handleConfirmBooking = (slotId: number) => {
    // In production: call API to create booking
    // For now: remove the slot from available list to simulate booking
    const remaining = availableSlots.filter((s) => s.slot.slot_id !== slotId)
    setAvailableSlots(remaining)
    console.log(`[Mock] Booking created for slot ${slotId}`)
  }

  return (
    <>
      {/* Page heading */}
      <div className="px-4 lg:px-6">
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl font-bold tracking-tight">Browse Classes</h1>
          <p className="text-muted-foreground text-sm">
            Find and book sessions with available teachers.
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="px-4 lg:px-6">
        <BrowseFilters search={search} onSearchChange={setSearch} />
      </div>

      {/* Results count */}
      <div className="px-4 lg:px-6 flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          {loading ? (
            "Loading classes…"
          ) : (
            <>
              <span className="font-semibold text-foreground">{filteredSlots.length}</span>
              {" class"}{filteredSlots.length !== 1 ? "es" : ""} available
            </>
          )}
        </p>
      </div>

      {/* Cards grid */}
      <div className="px-4 lg:px-6">
        {loading ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-72 rounded-xl" />
            ))}
          </div>
        ) : filteredSlots.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-3 py-20 text-center">
            <SearchX className="size-10 text-muted-foreground/50" />
            <p className="text-muted-foreground text-sm font-medium">
              No classes match your filters.
            </p>
            <p className="text-muted-foreground text-xs">
              Try adjusting your subject, grade, or date selection.
            </p>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {filteredSlots.map((slot) => (
              <SlotCard
                key={slot.slot.slot_id}
                slot={slot}
                onBook={handleBook}
              />
            ))}
          </div>
        )}
      </div>

      {/* Booking confirmation dialog */}
      <BookingDialog
        slot={selectedSlot}
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        onConfirm={handleConfirmBooking}
      />
    </>
  )
}
