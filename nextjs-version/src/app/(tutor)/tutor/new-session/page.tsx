"use client"

import { useState, useEffect, useMemo } from "react"
import { useRouter } from "next/navigation"
import {
  format, addMonths, subMonths, startOfMonth, endOfMonth,
  eachDayOfInterval, isSameMonth, isToday, isBefore, startOfToday, getDay,
} from "date-fns"
import {
  ChevronLeft, ChevronRight, BookOpen, CalendarDays, Clock,
  Users, CheckCircle2, Loader2, Sparkles, FileText, Lock,
  AlertCircle, ArrowLeft,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import { cn } from "@/lib/utils"
import { slotService } from "@/lib/services/slotService"
import { RichTextEditor } from "@/components/rich-text-editor"
import { toast } from "sonner"

const DAY_TO_JS: Record<string, number> = { Sun:0, Mon:1, Tue:2, Wed:3, Thu:4, Fri:5, Sat:6 }
const WEEKDAY_LABELS = ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"]
const GRADE_LABELS: Record<number,string> = Object.fromEntries(Array.from({length:12},(_,i)=>[i+1,`Grade ${i+1}`]))
const SUBJECT_COLORS: Record<string,string> = {
  Mathematics:"bg-blue-500",Physics:"bg-purple-500",Chemistry:"bg-amber-500",
  Biology:"bg-emerald-500",English:"bg-red-500",Amharic:"bg-pink-500",
  History:"bg-orange-500",Geography:"bg-cyan-500",Civics:"bg-teal-500",ICT:"bg-indigo-500",
}
const SUBJECT_TEXT: Record<string,string> = {
  Mathematics:"text-blue-600",Physics:"text-purple-600",Chemistry:"text-amber-600",
  Biology:"text-emerald-600",English:"text-red-600",Amharic:"text-pink-600",
  History:"text-orange-600",Geography:"text-cyan-600",Civics:"text-teal-600",ICT:"text-indigo-600",
}

function parseTimeSlot(slot: string): { start: string; end: string } | null {
  const parts = slot.split(/\s*[–-]\s*/)
  if (parts.length !== 2) return null
  return { start: parts[0].trim(), end: parts[1].trim() }
}

function SectionLabel({ icon: Icon, label, sublabel }: { icon: React.ElementType; label: string; sublabel?: string }) {
  return (
    <div className="flex items-center gap-2 mb-4">
      <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary/10">
        <Icon className="size-3.5 text-primary" />
      </div>
      <div>
        <p className="text-sm font-semibold">{label}</p>
        {sublabel && <p className="text-xs text-muted-foreground">{sublabel}</p>}
      </div>
    </div>
  )
}

function MiniCalendar({
  allowedDayNums, occupiedByDate, selectedDate, onSelect,
}: {
  allowedDayNums: Set<number>
  occupiedByDate: Map<string, number>
  selectedDate: string
  onSelect: (date: string) => void
}) {
  const [viewMonth, setViewMonth] = useState(new Date())
  const today = startOfToday()

  const { all, startPad } = useMemo(() => {
    const start = startOfMonth(viewMonth)
    const end   = endOfMonth(viewMonth)
    return { all: eachDayOfInterval({ start, end }), startPad: getDay(start) }
  }, [viewMonth])

  return (
    <div className="select-none">
      <div className="flex items-center justify-between mb-3">
        <button type="button" onClick={() => setViewMonth(m => subMonths(m,1))}
          className="flex h-7 w-7 items-center justify-center rounded-lg hover:bg-muted transition-colors">
          <ChevronLeft className="size-4" />
        </button>
        <p className="text-sm font-semibold">{format(viewMonth,"MMMM yyyy")}</p>
        <button type="button" onClick={() => setViewMonth(m => addMonths(m,1))}
          className="flex h-7 w-7 items-center justify-center rounded-lg hover:bg-muted transition-colors">
          <ChevronRight className="size-4" />
        </button>
      </div>

      <div className="grid grid-cols-7 mb-1">
        {WEEKDAY_LABELS.map(d => (
          <div key={d} className="text-center text-[10px] font-semibold text-muted-foreground py-1">{d}</div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-0.5">
        {Array.from({length: startPad}).map((_,i) => <div key={`pad-${i}`} />)}
        {all.map(day => {
          const dateStr   = format(day,"yyyy-MM-dd")
          const isPast    = isBefore(day, today)
          const isAllowed = allowedDayNums.has(getDay(day))
          const isSelected = selectedDate === dateStr
          const inMonth   = isSameMonth(day, viewMonth)
          const occupied  = (occupiedByDate.get(dateStr) ?? 0) > 0
          const clickable = !isPast && isAllowed && inMonth

          return (
            <button key={dateStr} type="button" disabled={!clickable}
              onClick={() => clickable && onSelect(dateStr)}
              className={cn(
                "relative flex flex-col items-center justify-center rounded-lg h-10 text-xs font-medium transition-all",
                isSelected && "bg-primary text-primary-foreground shadow-md",
                !isSelected && isToday(day) && isAllowed && !isPast && "ring-2 ring-primary ring-offset-1",
                !isSelected && clickable && "hover:bg-primary/10 hover:text-primary cursor-pointer",
                !isSelected && !clickable && inMonth && "text-muted-foreground/30 cursor-not-allowed",
                !inMonth && "opacity-0 pointer-events-none",
              )}>
              <span>{format(day,"d")}</span>
              {isAllowed && !isPast && inMonth && occupied && (
                <span className={cn("absolute bottom-1 h-1 w-1 rounded-full", isSelected ? "bg-primary-foreground/70" : "bg-amber-500")} />
              )}
              {isAllowed && !isPast && inMonth && !occupied && !isSelected && (
                <span className="absolute bottom-1 h-1 w-1 rounded-full bg-primary/40" />
              )}
            </button>
          )
        })}
      </div>

      <div className="flex items-center gap-4 mt-3 text-[10px] text-muted-foreground">
        <div className="flex items-center gap-1"><span className="h-1.5 w-1.5 rounded-full bg-primary/40" /> Available</div>
        <div className="flex items-center gap-1"><span className="h-1.5 w-1.5 rounded-full bg-amber-500" /> Has sessions</div>
        <div className="flex items-center gap-1"><span className="h-1.5 w-1.5 rounded-full bg-primary" /> Selected</div>
      </div>
    </div>
  )
}

export default function NewSessionPage() {
  const router = useRouter()
  const [saving,  setSaving]  = useState(false)
  const [done,    setDone]    = useState(false)
  const [apiError, setApiError] = useState<string | null>(null)
  const [subjects,     setSubjects]     = useState<Array<{subject_id:number;name:string}>>([])
  const [availability, setAvailability] = useState<{
    available_days: string[]; available_times: string[]
    default_max_students: number; hourly_rate: number
    existing_slots: {slot_date:string;start_time:string;end_time:string}[]
  } | null>(null)
  const [availLoading, setAvailLoading] = useState(true)

  const [subjectId,     setSubjectId]     = useState("")
  const [gradeMode,     setGradeMode]     = useState<"range"|"specific">("range")
  const [gradeFrom,     setGradeFrom]     = useState(5)
  const [gradeTo,       setGradeTo]       = useState(12)
  const [selectedGrade, setSelectedGrade] = useState(9)
  const [selectedDate,  setSelectedDate]  = useState("")
  const [selectedTime,  setSelectedTime]  = useState("")
  const [maxStudents,   setMaxStudents]   = useState(5)
  const [description,   setDescription]  = useState("")

  useEffect(() => {
    Promise.all([slotService.getSubjects(), slotService.getMyAvailability()])
      .then(([subs, avail]) => { setSubjects(subs); setAvailability(avail); setMaxStudents(avail.default_max_students) })
      .catch(() => toast.error("Could not load your availability settings."))
      .finally(() => setAvailLoading(false))
  }, [])

  const allowedDayNums = useMemo(() => {
    if (!availability) return new Set<number>()
    return new Set(availability.available_days.map(d => DAY_TO_JS[d]).filter(n => n !== undefined))
  }, [availability])

  const occupiedByDate = useMemo(() => {
    const map = new Map<string,number>()
    if (!availability) return map
    for (const s of availability.existing_slots) map.set(s.slot_date, (map.get(s.slot_date)??0)+1)
    return map
  }, [availability])

  const occupiedTimes = useMemo(() => {
    if (!availability || !selectedDate) return new Set<string>()
    const occupied = new Set<string>()
    for (const slot of availability.existing_slots) {
      if (slot.slot_date === selectedDate) {
        for (const label of availability.available_times) {
          const p = parseTimeSlot(label)
          if (p && p.start === slot.start_time && p.end === slot.end_time) occupied.add(label)
        }
      }
    }
    return occupied
  }, [availability, selectedDate])

  const selectedSubject = subjects.find(s => String(s.subject_id) === subjectId)
  const subjectColor    = selectedSubject ? (SUBJECT_COLORS[selectedSubject.name] ?? "bg-primary") : "bg-muted"
  const subjectText     = selectedSubject ? (SUBJECT_TEXT[selectedSubject.name]  ?? "text-primary") : "text-muted-foreground"
  const canSubmit       = !!subjectId && !!selectedDate && !!selectedTime && !saving

  const handleSubmit = async () => {
    if (!canSubmit) { toast.error("Please fill all required fields."); return }
    const parsed = parseTimeSlot(selectedTime)
    if (!parsed) { toast.error("Invalid time slot"); return }
    setSaving(true); setApiError(null)
    try {
      await slotService.createSlot({
        subject_id:   Number(subjectId),
        slot_date:    selectedDate,
        start_time:   parsed.start,
        end_time:     parsed.end,
        grade_from:   gradeMode === "specific" ? selectedGrade : gradeFrom,
        grade_to:     gradeMode === "specific" ? selectedGrade : gradeTo,
        max_students: maxStudents,
        description:  description || undefined,
      })
      setDone(true)
      toast.success("Session created! Students can now book it.")
      setTimeout(() => router.push("/tutor/sessions"), 1800)
    } catch (err: any) {
      setApiError(err.message)
    } finally {
      setSaving(false)
    }
  }

  if (done) return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4 text-center px-4">
      <div className="flex h-20 w-20 items-center justify-center rounded-full bg-green-100 dark:bg-green-950/30">
        <CheckCircle2 className="size-10 text-green-600" />
      </div>
      <h2 className="text-2xl font-bold">Session Created!</h2>
      <p className="text-muted-foreground text-sm">
        {selectedSubject?.name} · {selectedDate ? format(new Date(selectedDate+"T00:00"),"EEE, MMM d") : ""} · {selectedTime}
      </p>
      <p className="text-xs text-muted-foreground">Redirecting to your sessions…</p>
    </div>
  )

  return (
    <div className="px-4 lg:px-6 pb-12">
      {/* Header */}
      <div className="flex items-center gap-3 py-4 border-b mb-6">
        <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0" onClick={() => router.back()}>
          <ArrowLeft className="size-4" />
        </Button>
        <div className="flex-1">
          <h1 className="text-xl font-bold flex items-center gap-2">
            <Sparkles className="size-5 text-primary" /> New Teaching Session
          </h1>
          <p className="text-muted-foreground text-xs">Fill in all sections below, then click Create Session.</p>
        </div>
        {(subjectId || selectedDate || selectedTime) && (
          <div className="hidden md:flex items-center gap-2 rounded-full border bg-muted/50 px-3 py-1.5 text-xs">
            {selectedSubject && <span className={cn("font-semibold", subjectText)}>{selectedSubject.name}</span>}
            {selectedDate && <><span className="text-muted-foreground">·</span><span>{format(new Date(selectedDate+"T00:00"),"MMM d")}</span></>}
            {selectedTime && <><span className="text-muted-foreground">·</span><span>{selectedTime}</span></>}
          </div>
        )}
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        {/* LEFT */}
        <div className="space-y-6">

          {/* 1. Subject & Grade */}
          <Card>
            <CardContent className="pt-5 space-y-4">
              <SectionLabel icon={BookOpen} label="Subject & Grade" sublabel="What will you teach and for which grades?" />
              <div className="flex flex-wrap gap-2">
                {subjects.map(s => {
                  const sel = subjectId === String(s.subject_id)
                  return (
                    <button key={s.subject_id} type="button" onClick={() => setSubjectId(String(s.subject_id))}
                      className={cn(
                        "flex items-center gap-2 rounded-xl border-2 px-3 py-2 text-sm font-medium transition-all",
                        sel ? "border-primary bg-primary/5 text-primary" : "border-border hover:border-primary/40"
                      )}>
                      <span className={cn("h-2 w-2 rounded-full", SUBJECT_COLORS[s.name] ?? "bg-primary")} />
                      {s.name}
                    </button>
                  )
                })}
              </div>
              <Separator />
              <div className="space-y-2">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Grade</p>
                <div className="flex gap-2">
                  {(["range","specific"] as const).map(m => (
                    <button key={m} type="button" onClick={() => setGradeMode(m)}
                      className={cn(
                        "flex-1 rounded-lg border-2 py-2 text-sm font-medium transition-all",
                        gradeMode === m ? "border-primary bg-primary/5 text-primary" : "border-border text-muted-foreground hover:border-primary/40"
                      )}>
                      {m === "range" ? "Grade Range" : "Specific Grade"}
                    </button>
                  ))}
                </div>
                {gradeMode === "range" ? (
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <p className="text-xs text-muted-foreground">From</p>
                      <Select value={String(gradeFrom)} onValueChange={v => setGradeFrom(Number(v))}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>{Array.from({length:12},(_,i)=>i+1).map(g=><SelectItem key={g} value={String(g)}>{GRADE_LABELS[g]}</SelectItem>)}</SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-1">
                      <p className="text-xs text-muted-foreground">To</p>
                      <Select value={String(gradeTo)} onValueChange={v => setGradeTo(Number(v))}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>{Array.from({length:12},(_,i)=>i+1).map(g=><SelectItem key={g} value={String(g)}>{GRADE_LABELS[g]}</SelectItem>)}</SelectContent>
                      </Select>
                    </div>
                  </div>
                ) : (
                  <Select value={String(selectedGrade)} onValueChange={v => setSelectedGrade(Number(v))}>
                    <SelectTrigger><SelectValue placeholder="Select grade" /></SelectTrigger>
                    <SelectContent>{Array.from({length:12},(_,i)=>i+1).map(g=><SelectItem key={g} value={String(g)}>{GRADE_LABELS[g]}</SelectItem>)}</SelectContent>
                  </Select>
                )}
              </div>
            </CardContent>
          </Card>

          {/* 2. Date & Time */}
          <Card>
            <CardContent className="pt-5 space-y-4">
              <SectionLabel icon={CalendarDays} label="Date & Time" sublabel="Pick from your declared availability" />
              {availLoading ? (
                <div className="flex items-center justify-center py-10"><Loader2 className="size-6 animate-spin text-muted-foreground" /></div>
              ) : !availability || availability.available_days.length === 0 ? (
                <div className="rounded-lg border border-amber-300 bg-amber-50 dark:bg-amber-950/20 p-4 flex gap-3">
                  <AlertCircle className="size-5 text-amber-600 shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-amber-800 dark:text-amber-300">No availability set</p>
                    <p className="text-xs text-amber-700 dark:text-amber-400 mt-0.5">Go to your profile and set your available days and time slots first.</p>
                    <Button size="sm" variant="outline" className="mt-2 h-7 text-xs" onClick={() => router.push("/tutor/profile")}>Update Profile</Button>
                  </div>
                </div>
              ) : (
                <div className="grid gap-6 md:grid-cols-[1fr_200px]">
                  {/* Calendar */}
                  <div>
                    <p className="text-xs text-muted-foreground mb-3">
                      Your available days: <span className="font-medium text-foreground">{availability.available_days.join(", ")}</span>
                    </p>
                    <MiniCalendar
                      allowedDayNums={allowedDayNums}
                      occupiedByDate={occupiedByDate}
                      selectedDate={selectedDate}
                      onSelect={date => { setSelectedDate(date); setSelectedTime("") }}
                    />
                  </div>
                  {/* Time slots */}
                  <div className="space-y-2">
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                      {selectedDate ? format(new Date(selectedDate+"T00:00"),"EEE, MMM d") : "Select a date first"}
                    </p>
                    <div className="space-y-1.5">
                      {availability.available_times.map(label => {
                        const occupied   = occupiedTimes.has(label)
                        const isSelected = selectedTime === label
                        const disabled   = !selectedDate || occupied
                        return (
                          <button key={label} type="button" disabled={disabled}
                            onClick={() => { if (occupied) { toast.info("Already scheduled at this time."); return } setSelectedTime(label) }}
                            className={cn(
                              "w-full flex items-center gap-2 rounded-lg border px-3 py-2 text-xs transition-all text-left",
                              isSelected && "border-primary bg-primary/5 text-primary font-semibold",
                              occupied && "border-muted bg-muted/20 text-muted-foreground/50 cursor-not-allowed",
                              !isSelected && !occupied && !disabled && "border-border hover:border-primary/50 hover:bg-primary/5 cursor-pointer",
                              !isSelected && !occupied && disabled && "border-muted text-muted-foreground/40 cursor-not-allowed",
                            )}>
                            {occupied ? <Lock className="size-3 shrink-0" /> : isSelected ? <CheckCircle2 className="size-3 shrink-0 text-primary" /> : <Clock className="size-3 shrink-0 text-muted-foreground" />}
                            <span className="flex-1">{label}</span>
                            {occupied && <span className="text-[10px] text-muted-foreground/60">Taken</span>}
                          </button>
                        )
                      })}
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* 3. Capacity */}
          <Card>
            <CardContent className="pt-5 space-y-3">
              <SectionLabel icon={Users} label="Max Students" sublabel="How many students can join this session?" />
              <div className="flex gap-2 flex-wrap">
                {[1,2,3,4,5,6,7,8,9,10].map(n => (
                  <button key={n} type="button" onClick={() => setMaxStudents(n)}
                    className={cn(
                      "flex h-10 w-10 items-center justify-center rounded-lg border-2 text-sm font-bold transition-all",
                      maxStudents === n ? "border-primary bg-primary text-primary-foreground" : "border-border hover:border-primary/50"
                    )}>
                    {n}
                  </button>
                ))}
              </div>
              <p className="text-xs text-muted-foreground">Pre-filled from your profile default.</p>
            </CardContent>
          </Card>

          {/* 4. Description */}
          <Card>
            <CardContent className="pt-5 space-y-3">
              <SectionLabel icon={FileText} label="Session Description" sublabel="Optional — describe what students will learn" />
              <RichTextEditor
                value={description}
                onChange={setDescription}
                placeholder="e.g. In this session we will cover quadratic equations. Students should have basic algebra knowledge…"
                maxLength={2000}
              />
            </CardContent>
          </Card>

          {apiError && (
            <div className="rounded-lg bg-destructive/10 border border-destructive/20 px-4 py-3 text-sm text-destructive">{apiError}</div>
          )}

          <Button size="lg" className="w-full gap-2 h-12 text-base" disabled={!canSubmit} onClick={handleSubmit}>
            {saving ? <Loader2 className="size-5 animate-spin" /> : <Sparkles className="size-5" />}
            {saving ? "Creating Session…" : "Create Session"}
          </Button>
        </div>

        {/* RIGHT: sticky summary */}
        <div className="hidden lg:block">
          <div className="sticky top-6 space-y-3">
            <Card>
              <CardContent className="pt-5 space-y-3">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Session Preview</p>
                <div className="flex items-center gap-2">
                  <div className={cn("h-3 w-3 rounded-full shrink-0", subjectColor)} />
                  <span className={cn("font-semibold text-sm", subjectText)}>
                    {selectedSubject?.name ?? <span className="text-muted-foreground italic font-normal text-xs">No subject selected</span>}
                  </span>
                </div>
                <div className="text-xs text-muted-foreground">
                  {gradeMode === "range" ? `${GRADE_LABELS[gradeFrom]} – ${GRADE_LABELS[gradeTo]}` : GRADE_LABELS[selectedGrade]}
                </div>
                <Separator />
                <div className="flex items-center gap-2 text-sm">
                  <CalendarDays className="size-3.5 text-muted-foreground shrink-0" />
                  {selectedDate
                    ? <span className="font-medium">{format(new Date(selectedDate+"T00:00"),"EEEE, MMMM d yyyy")}</span>
                    : <span className="text-muted-foreground italic text-xs">No date selected</span>}
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Clock className="size-3.5 text-muted-foreground shrink-0" />
                  {selectedTime
                    ? <span className="font-medium">{selectedTime}</span>
                    : <span className="text-muted-foreground italic text-xs">No time selected</span>}
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Users className="size-3.5 text-muted-foreground shrink-0" />
                  <span>Up to <span className="font-medium">{maxStudents}</span> student{maxStudents !== 1 ? "s" : ""}</span>
                </div>
                <Separator />
                <div className="space-y-1.5">
                  {[
                    { label: "Subject selected",  done: !!subjectId },
                    { label: "Date selected",      done: !!selectedDate },
                    { label: "Time slot selected", done: !!selectedTime },
                  ].map(item => (
                    <div key={item.label} className="flex items-center gap-2 text-xs">
                      <div className={cn("h-4 w-4 rounded-full flex items-center justify-center shrink-0", item.done ? "bg-green-500" : "bg-muted")}>
                        {item.done && <CheckCircle2 className="size-2.5 text-white" />}
                      </div>
                      <span className={item.done ? "text-foreground" : "text-muted-foreground"}>{item.label}</span>
                    </div>
                  ))}
                </div>
                <Button className="w-full gap-2 mt-2" disabled={!canSubmit} onClick={handleSubmit}>
                  {saving ? <Loader2 className="size-4 animate-spin" /> : <Sparkles className="size-4" />}
                  {saving ? "Creating…" : "Create Session"}
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
