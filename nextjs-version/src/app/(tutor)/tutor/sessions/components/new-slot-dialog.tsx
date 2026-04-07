"use client"

import { useState, useEffect } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { format } from "date-fns"
import {
  BookOpen, CalendarDays, Clock, Users, CheckCircle2,
  ArrowLeft, ArrowRight, Loader2, GraduationCap, Sparkles,
} from "lucide-react"

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Separator } from "@/components/ui/separator"
import { cn } from "@/lib/utils"
import { slotService } from "@/lib/services/slotService"

// ─── Schema (mirrors backend CreateSlotSchema exactly) ───────
const step1Schema = z.object({
  subject_id: z.string().min(1, "Select a subject"),
  grade_from: z.number().int().min(1).max(12),
  grade_to:   z.number().int().min(1).max(12),
}).refine(d => d.grade_from <= d.grade_to, {
  message: "Grade From must be ≤ Grade To",
  path: ["grade_to"],
})

const step2Schema = z.object({
  slot_date:  z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Pick a date"),
  start_time: z.string().regex(/^\d{2}:\d{2}$/, "Pick start time"),
  end_time:   z.string().regex(/^\d{2}:\d{2}$/, "Pick end time"),
}).refine(d => d.start_time < d.end_time, {
  message: "End time must be after start time",
  path: ["end_time"],
})

const step3Schema = z.object({
  max_students: z.number().int().min(1).max(10),
})

type Step1 = z.infer<typeof step1Schema>
type Step2 = z.infer<typeof step2Schema>
type Step3 = z.infer<typeof step3Schema>

const STEPS = [
  { id: 1, title: "Subject & Grade",  desc: "What will you teach and for which grades?", icon: BookOpen },
  { id: 2, title: "Date & Time",      desc: "When is this session scheduled?",            icon: CalendarDays },
  { id: 3, title: "Capacity & Review",desc: "How many students and final review.",         icon: Users },
]

const GRADE_LABELS: Record<number, string> = {
  1:"Grade 1", 2:"Grade 2", 3:"Grade 3", 4:"Grade 4", 5:"Grade 5",
  6:"Grade 6", 7:"Grade 7", 8:"Grade 8", 9:"Grade 9", 10:"Grade 10",
  11:"Grade 11", 12:"Grade 12",
}

const SUBJECT_COLORS: Record<string, string> = {
  Mathematics:"bg-blue-500", Physics:"bg-purple-500", Chemistry:"bg-amber-500",
  Biology:"bg-emerald-500", English:"bg-red-500", Amharic:"bg-pink-500",
  History:"bg-orange-500", Geography:"bg-cyan-500", Civics:"bg-teal-500", ICT:"bg-indigo-500",
}

interface Props {
  open: boolean
  onOpenChange: (v: boolean) => void
  onCreated: () => void
}

export function NewSlotDialog({ open, onOpenChange, onCreated }: Props) {
  const [step, setStep] = useState(1)
  const [done, setDone] = useState(false)
  const [saving, setSaving] = useState(false)
  const [apiError, setApiError] = useState<string | null>(null)
  const [subjects, setSubjects] = useState<Array<{ subject_id: number; name: string }>>([])

  // Accumulated data across steps
  const [s1, setS1] = useState<Partial<Step1>>({})
  const [s2, setS2] = useState<Partial<Step2>>({})

  const form1 = useForm<Step1>({ resolver: zodResolver(step1Schema), defaultValues: { subject_id: "", grade_from: 5, grade_to: 12 } })
  const form2 = useForm<Step2>({ resolver: zodResolver(step2Schema), defaultValues: { slot_date: "", start_time: "", end_time: "" } })
  const form3 = useForm<Step3>({ resolver: zodResolver(step3Schema), defaultValues: { max_students: 5 } })

  useEffect(() => {
    if (open) slotService.getSubjects().then(setSubjects).catch(() => {})
  }, [open])

  const reset = () => {
    setStep(1); setDone(false); setApiError(null)
    setS1({}); setS2({})
    form1.reset(); form2.reset(); form3.reset()
  }

  const handleClose = (v: boolean) => {
    if (!v) reset()
    onOpenChange(v)
  }

  const onStep1 = (data: Step1) => { setS1(data); setStep(2) }
  const onStep2 = (data: Step2) => { setS2(data); setStep(3) }

  const onStep3 = async (data: Step3) => {
    setSaving(true); setApiError(null)
    try {
      await slotService.createSlot({
        subject_id:   Number(s1.subject_id),
        slot_date:    s2.slot_date!,
        start_time:   s2.start_time!,
        end_time:     s2.end_time!,
        grade_from:   s1.grade_from!,
        grade_to:     s1.grade_to!,
        max_students: data.max_students,
      })
      setDone(true)
      setTimeout(() => { handleClose(false); onCreated() }, 1600)
    } catch (err: any) {
      setApiError(err.message)
    } finally {
      setSaving(false)
    }
  }

  const selectedSubject = subjects.find(s => String(s.subject_id) === s1.subject_id)
  const subjectColor = selectedSubject ? (SUBJECT_COLORS[selectedSubject.name] ?? "bg-primary") : "bg-primary"

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-lg p-0 overflow-hidden">
        {/* Coloured top bar */}
        <div className={cn("h-1.5 w-full", subjectColor)} />

        <div className="px-6 pt-5 pb-6">
          <DialogHeader className="mb-5">
            <DialogTitle className="flex items-center gap-2 text-lg">
              <Sparkles className="size-5 text-primary" />
              {done ? "Session Created!" : "New Teaching Session"}
            </DialogTitle>
            <DialogDescription>
              {done ? "Your slot is live — students can now book it." : STEPS[step - 1].desc}
            </DialogDescription>
          </DialogHeader>

          {/* ── Success state ── */}
          {done ? (
            <div className="flex flex-col items-center gap-4 py-6">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-green-100 dark:bg-green-950/30">
                <CheckCircle2 className="size-9 text-green-600" />
              </div>
              <div className="text-center space-y-1">
                <p className="font-semibold">{selectedSubject?.name} session scheduled</p>
                <p className="text-sm text-muted-foreground">
                  {s2.slot_date ? format(new Date(s2.slot_date + "T00:00"), "EEE, MMM d yyyy") : ""} · {s2.start_time} – {s2.end_time}
                </p>
              </div>
            </div>
          ) : (
            <>
              {/* Step indicator */}
              <div className="flex items-center gap-0 mb-6">
                {STEPS.map((st, i) => (
                  <div key={st.id} className="flex items-center flex-1 last:flex-initial">
                    <div className={cn(
                      "flex h-8 w-8 shrink-0 items-center justify-center rounded-full border-2 text-xs font-bold transition-all",
                      step > st.id  && "border-primary bg-primary text-primary-foreground",
                      step === st.id && "border-primary text-primary bg-primary/10",
                      step < st.id  && "border-muted-foreground/30 text-muted-foreground",
                    )}>
                      {step > st.id ? <CheckCircle2 className="size-3.5" /> : st.id}
                    </div>
                    {i < STEPS.length - 1 && (
                      <div className={cn("h-0.5 flex-1 transition-all", step > st.id ? "bg-primary" : "bg-muted-foreground/20")} />
                    )}
                  </div>
                ))}
              </div>

              {/* ── STEP 1: Subject & Grade ── */}
              {step === 1 && (
                <Form {...form1}>
                  <form onSubmit={form1.handleSubmit(onStep1)} className="space-y-4">
                    <FormField control={form1.control} name="subject_id" render={({ field }) => (
                      <FormItem>
                        <FormLabel className="flex items-center gap-1.5"><BookOpen className="size-3.5" /> Subject</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger><SelectValue placeholder="Choose a subject…" /></SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {subjects.map(s => (
                              <SelectItem key={s.subject_id} value={String(s.subject_id)}>
                                <div className="flex items-center gap-2">
                                  <span className={cn("h-2 w-2 rounded-full", SUBJECT_COLORS[s.name] ?? "bg-primary")} />
                                  {s.name}
                                </div>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )} />

                    <div className="space-y-2">
                      <FormLabel className="flex items-center gap-1.5"><GraduationCap className="size-3.5" /> Grade Range</FormLabel>
                      <p className="text-xs text-muted-foreground">Students within this range can book this session.</p>
                      <div className="grid grid-cols-2 gap-3">
                        <FormField control={form1.control} name="grade_from" render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-xs text-muted-foreground">From</FormLabel>
                            <Select onValueChange={v => field.onChange(Number(v))} value={String(field.value)}>
                              <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                              <SelectContent>
                                {Array.from({ length: 12 }, (_, i) => i + 1).map(g => (
                                  <SelectItem key={g} value={String(g)}>{GRADE_LABELS[g]}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )} />
                        <FormField control={form1.control} name="grade_to" render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-xs text-muted-foreground">To</FormLabel>
                            <Select onValueChange={v => field.onChange(Number(v))} value={String(field.value)}>
                              <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                              <SelectContent>
                                {Array.from({ length: 12 }, (_, i) => i + 1).map(g => (
                                  <SelectItem key={g} value={String(g)}>{GRADE_LABELS[g]}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )} />
                      </div>
                    </div>

                    <div className="flex justify-end pt-2">
                      <Button type="submit" className="gap-2">Next <ArrowRight className="size-4" /></Button>
                    </div>
                  </form>
                </Form>
              )}

              {/* ── STEP 2: Date & Time ── */}
              {step === 2 && (
                <Form {...form2}>
                  <form onSubmit={form2.handleSubmit(onStep2)} className="space-y-4">
                    <FormField control={form2.control} name="slot_date" render={({ field }) => (
                      <FormItem>
                        <FormLabel className="flex items-center gap-1.5"><CalendarDays className="size-3.5" /> Session Date</FormLabel>
                        <FormControl>
                          <Input type="date" min={new Date().toISOString().split("T")[0]} {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />

                    <div className="grid grid-cols-2 gap-3">
                      <FormField control={form2.control} name="start_time" render={({ field }) => (
                        <FormItem>
                          <FormLabel className="flex items-center gap-1.5"><Clock className="size-3.5" /> Start Time</FormLabel>
                          <FormControl><Input type="time" {...field} /></FormControl>
                          <FormMessage />
                        </FormItem>
                      )} />
                      <FormField control={form2.control} name="end_time" render={({ field }) => (
                        <FormItem>
                          <FormLabel className="flex items-center gap-1.5"><Clock className="size-3.5" /> End Time</FormLabel>
                          <FormControl><Input type="time" {...field} /></FormControl>
                          <FormMessage />
                        </FormItem>
                      )} />
                    </div>

                    {/* Duration preview */}
                    {form2.watch("start_time") && form2.watch("end_time") && form2.watch("start_time") < form2.watch("end_time") && (
                      <div className="flex items-center gap-2 rounded-lg bg-muted/50 px-3 py-2 text-sm">
                        <Clock className="size-3.5 text-muted-foreground" />
                        <span className="text-muted-foreground">Duration:</span>
                        <span className="font-medium">
                          {(() => {
                            const [sh, sm] = form2.watch("start_time").split(":").map(Number)
                            const [eh, em] = form2.watch("end_time").split(":").map(Number)
                            const mins = (eh * 60 + em) - (sh * 60 + sm)
                            return mins >= 60 ? `${Math.floor(mins / 60)}h ${mins % 60 > 0 ? `${mins % 60}m` : ""}`.trim() : `${mins}m`
                          })()}
                        </span>
                      </div>
                    )}

                    <div className="flex justify-between pt-2">
                      <Button type="button" variant="ghost" className="gap-2" onClick={() => setStep(1)}><ArrowLeft className="size-4" /> Back</Button>
                      <Button type="submit" className="gap-2">Next <ArrowRight className="size-4" /></Button>
                    </div>
                  </form>
                </Form>
              )}

              {/* ── STEP 3: Capacity & Review ── */}
              {step === 3 && (
                <Form {...form3}>
                  <form onSubmit={form3.handleSubmit(onStep3)} className="space-y-4">
                    {apiError && (
                      <div className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">{apiError}</div>
                    )}

                    <FormField control={form3.control} name="max_students" render={({ field }) => (
                      <FormItem>
                        <FormLabel className="flex items-center gap-1.5"><Users className="size-3.5" /> Max Students</FormLabel>
                        <p className="text-xs text-muted-foreground">How many students can book this slot?</p>
                        <div className="flex gap-2 mt-1">
                          {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(n => (
                            <button
                              key={n} type="button"
                              onClick={() => field.onChange(n)}
                              className={cn(
                                "flex h-9 w-9 items-center justify-center rounded-lg border-2 text-sm font-bold transition-all",
                                field.value === n
                                  ? "border-primary bg-primary text-primary-foreground"
                                  : "border-border hover:border-primary/50"
                              )}
                            >{n}</button>
                          ))}
                        </div>
                        <FormMessage />
                      </FormItem>
                    )} />

                    <Separator />

                    {/* Review summary */}
                    <div className="space-y-2">
                      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Session Summary</p>
                      <div className="rounded-xl border bg-muted/30 p-4 space-y-2.5 text-sm">
                        <div className="flex items-center gap-2">
                          <span className={cn("h-2.5 w-2.5 rounded-full", subjectColor)} />
                          <span className="font-medium">{selectedSubject?.name ?? "—"}</span>
                          <Badge variant="outline" className="text-xs ml-auto">
                            {GRADE_LABELS[s1.grade_from ?? 1]} – {GRADE_LABELS[s1.grade_to ?? 12]}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <CalendarDays className="size-3.5" />
                          <span>{s2.slot_date ? format(new Date(s2.slot_date + "T00:00"), "EEEE, MMMM d yyyy") : "—"}</span>
                        </div>
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <Clock className="size-3.5" />
                          <span>{s2.start_time} – {s2.end_time}</span>
                        </div>
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <Users className="size-3.5" />
                          <span>Up to {form3.watch("max_students")} student{form3.watch("max_students") !== 1 ? "s" : ""}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex justify-between pt-2">
                      <Button type="button" variant="ghost" className="gap-2" onClick={() => setStep(2)} disabled={saving}>
                        <ArrowLeft className="size-4" /> Back
                      </Button>
                      <Button type="submit" className="gap-2 px-6" disabled={saving}>
                        {saving ? <Loader2 className="size-4 animate-spin" /> : <Sparkles className="size-4" />}
                        {saving ? "Creating…" : "Create Session"}
                      </Button>
                    </div>
                  </form>
                </Form>
              )}
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
