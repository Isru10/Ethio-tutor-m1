"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { z } from "zod"
import { format } from "date-fns"
import {
  BookOpen, CalendarDays, Clock, Users, CheckCircle2,
  ArrowLeft, ArrowRight, Loader2, GraduationCap, Sparkles, FileText,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Separator } from "@/components/ui/separator"
import { cn } from "@/lib/utils"
import { slotService } from "@/lib/services/slotService"
import { RichTextEditor } from "@/components/rich-text-editor"
import { toast } from "sonner"

const STEPS = [
  { id: 1, title: "Subject & Grade",   desc: "What will you teach and for which grades?", icon: BookOpen },
  { id: 2, title: "Date & Time",       desc: "When is this session scheduled?",            icon: CalendarDays },
  { id: 3, title: "Capacity",          desc: "How many students can join?",                icon: Users },
  { id: 4, title: "Session Details",   desc: "Describe your session with rich content.",   icon: FileText },
]

const GRADE_LABELS: Record<number, string> = Object.fromEntries(
  Array.from({ length: 12 }, (_, i) => [i + 1, `Grade ${i + 1}`])
)

const SUBJECT_COLORS: Record<string, string> = {
  Mathematics:"bg-blue-500", Physics:"bg-purple-500", Chemistry:"bg-amber-500",
  Biology:"bg-emerald-500", English:"bg-red-500", Amharic:"bg-pink-500",
  History:"bg-orange-500", Geography:"bg-cyan-500", Civics:"bg-teal-500", ICT:"bg-indigo-500",
}

const step1Schema = z.object({
  subject_id:     z.string().min(1, "Select a subject"),
  grade_mode:     z.enum(["range", "specific"]),
  grade_from:     z.number().int().min(1).max(12),
  grade_to:       z.number().int().min(1).max(12),
  selected_grade: z.number().int().min(1).max(12).optional(),
}).refine(d => d.grade_mode === "specific" || d.grade_from <= d.grade_to, {
  message: "Grade From must be ≤ Grade To", path: ["grade_to"],
})

const step2Schema = z.object({
  slot_date:  z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Pick a date"),
  start_time: z.string().regex(/^\d{2}:\d{2}$/, "Pick start time"),
  end_time:   z.string().regex(/^\d{2}:\d{2}$/, "Pick end time"),
}).refine(d => d.start_time < d.end_time, { message: "End time must be after start time", path: ["end_time"] })

const step3Schema = z.object({
  max_students: z.number().int().min(1).max(10),
})

const step4Schema = z.object({
  description: z.string().max(2000).optional(),
})

type Step1 = z.infer<typeof step1Schema>
type Step2 = z.infer<typeof step2Schema>
type Step3 = z.infer<typeof step3Schema>
type Step4 = z.infer<typeof step4Schema>

function StepBar({ current }: { current: number }) {
  return (
    <div className="flex items-center gap-0">
      {STEPS.map((step, i) => (
        <div key={step.id} className="flex items-center flex-1 last:flex-initial">
          <div className={cn(
            "flex h-8 w-8 shrink-0 items-center justify-center rounded-full border-2 text-xs font-bold transition-all",
            current > step.id  && "border-primary bg-primary text-primary-foreground",
            current === step.id && "border-primary text-primary bg-primary/10",
            current < step.id  && "border-muted-foreground/30 text-muted-foreground",
          )}>
            {current > step.id ? <CheckCircle2 className="size-3.5" /> : step.id}
          </div>
          {i < STEPS.length - 1 && (
            <div className={cn("h-0.5 flex-1 transition-all", current > step.id ? "bg-primary" : "bg-muted-foreground/20")} />
          )}
        </div>
      ))}
    </div>
  )
}

export default function NewSessionPage() {
  const router = useRouter()
  const [step, setStep]       = useState(1)
  const [done, setDone]       = useState(false)
  const [saving, setSaving]   = useState(false)
  const [apiError, setApiError] = useState<string | null>(null)
  const [subjects, setSubjects] = useState<Array<{ subject_id: number; name: string }>>([])
  const [s1, setS1] = useState<Partial<Step1>>({})
  const [s2, setS2] = useState<Partial<Step2>>({})
  const [s3, setS3] = useState<Partial<Step3>>({})

  const form1 = useForm<Step1>({ resolver: zodResolver(step1Schema), defaultValues: { subject_id: "", grade_mode: "range", grade_from: 5, grade_to: 12 } })
  const form2 = useForm<Step2>({ resolver: zodResolver(step2Schema), defaultValues: { slot_date: "", start_time: "", end_time: "" } })
  const form3 = useForm<Step3>({ resolver: zodResolver(step3Schema), defaultValues: { max_students: 5 } })
  const form4 = useForm<Step4>({ resolver: zodResolver(step4Schema), defaultValues: { description: "" } })

  useEffect(() => { slotService.getSubjects().then(setSubjects).catch(() => {}) }, [])

  const onStep1 = (data: Step1) => { setS1(data); setStep(2) }
  const onStep2 = (data: Step2) => { setS2(data); setStep(3) }
  const onStep3 = (data: Step3) => { setS3(data); setStep(4) }

  const onStep4 = async (data: Step4) => {
    setSaving(true); setApiError(null)
    try {
      await slotService.createSlot({
        subject_id:     Number(s1.subject_id),
        slot_date:      s2.slot_date!,
        start_time:     s2.start_time!,
        end_time:       s2.end_time!,
        grade_from:     s1.grade_mode === "specific" ? (s1.selected_grade ?? 1) : s1.grade_from!,
        grade_to:       s1.grade_mode === "specific" ? (s1.selected_grade ?? 12) : s1.grade_to!,
        max_students:   s3.max_students!,
        description:    data.description || undefined,
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

  const selectedSubject = subjects.find(s => String(s.subject_id) === s1.subject_id)
  const subjectColor    = selectedSubject ? (SUBJECT_COLORS[selectedSubject.name] ?? "bg-primary") : "bg-primary"

  if (done) return (
    <div className="px-4 lg:px-6 max-w-lg mx-auto py-20 flex flex-col items-center gap-4 text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-green-100 dark:bg-green-950/30">
        <CheckCircle2 className="size-9 text-green-600" />
      </div>
      <h2 className="text-2xl font-bold">Session Created!</h2>
      <p className="text-muted-foreground text-sm">
        {selectedSubject?.name} session on {s2.slot_date ? format(new Date(s2.slot_date + "T00:00"), "EEE, MMM d") : ""} · {s2.start_time} – {s2.end_time}
      </p>
      <p className="text-xs text-muted-foreground">Redirecting to your sessions…</p>
    </div>
  )

  return (
    <div className="px-4 lg:px-6 max-w-4xl mx-auto space-y-6 pb-12">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => router.back()}>
          <ArrowLeft className="size-4" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <Sparkles className="size-5 text-primary" /> New Teaching Session
          </h1>
          <p className="text-muted-foreground text-sm">{STEPS[step - 1].desc}</p>
        </div>
      </div>

      {/* Step bar */}
      <StepBar current={step} />

      <Card>
        <CardHeader className="pb-4">
          <div className="flex items-center gap-3">
            <div className={cn("flex h-10 w-10 items-center justify-center rounded-xl text-white", subjectColor)}>
              {(() => { const Icon = STEPS[step - 1].icon; return <Icon className="size-5" /> })()}
            </div>
            <div>
              <Badge variant="outline" className="text-xs mb-0.5">Step {step} of {STEPS.length}</Badge>
              <CardTitle className="text-lg">{STEPS[step - 1].title}</CardTitle>
            </div>
          </div>
        </CardHeader>

        <CardContent>
          {/* ── STEP 1: Subject & Grade ── */}
          {step === 1 && (
            <Form {...form1}>
              <form onSubmit={form1.handleSubmit(onStep1)} className="space-y-5">
                <FormField control={form1.control} name="subject_id" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Subject</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl><SelectTrigger><SelectValue placeholder="Choose a subject…" /></SelectTrigger></FormControl>
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
                  <FormLabel>Grade</FormLabel>
                  <p className="text-xs text-muted-foreground">Choose a specific grade or a range of grades.</p>

                  {/* Mode toggle */}
                  <div className="flex gap-2">
                    {(["range", "specific"] as const).map(m => (
                      <button key={m} type="button"
                        onClick={() => form1.setValue("grade_mode", m)}
                        className={cn(
                          "flex-1 rounded-lg border-2 py-2 text-sm font-medium transition-all",
                          form1.watch("grade_mode") === m
                            ? "border-primary bg-primary/5 text-primary"
                            : "border-border text-muted-foreground hover:border-primary/40"
                        )}>
                        {m === "range" ? "Grade Range" : "Specific Grade"}
                      </button>
                    ))}
                  </div>

                  {form1.watch("grade_mode") === "range" ? (
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
                  ) : (
                    <FormField control={form1.control} name="selected_grade" render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-xs text-muted-foreground">Grade</FormLabel>
                        <Select onValueChange={v => field.onChange(Number(v))} value={field.value ? String(field.value) : ""}>
                          <FormControl><SelectTrigger><SelectValue placeholder="Select grade" /></SelectTrigger></FormControl>
                          <SelectContent>
                            {Array.from({ length: 12 }, (_, i) => i + 1).map(g => (
                              <SelectItem key={g} value={String(g)}>{GRADE_LABELS[g]}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )} />
                  )}
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
              <form onSubmit={form2.handleSubmit(onStep2)} className="space-y-5">
                <FormField control={form2.control} name="slot_date" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Session Date</FormLabel>
                    <FormControl>
                      <Input type="date" min={new Date().toISOString().split("T")[0]} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )} />

                <div className="grid grid-cols-2 gap-3">
                  <FormField control={form2.control} name="start_time" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Start Time</FormLabel>
                      <FormControl><Input type="time" {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                  <FormField control={form2.control} name="end_time" render={({ field }) => (
                    <FormItem>
                      <FormLabel>End Time</FormLabel>
                      <FormControl><Input type="time" {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                </div>

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

          {/* ── STEP 3: Capacity ── */}
          {step === 3 && (
            <Form {...form3}>
              <form onSubmit={form3.handleSubmit(onStep3)} className="space-y-5">
                <FormField control={form3.control} name="max_students" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Max Students</FormLabel>
                    <p className="text-xs text-muted-foreground">How many students can book this slot?</p>
                    <div className="flex gap-2 mt-1 flex-wrap">
                      {[1,2,3,4,5,6,7,8,9,10].map(n => (
                        <button key={n} type="button" onClick={() => field.onChange(n)}
                          className={cn(
                            "flex h-10 w-10 items-center justify-center rounded-lg border-2 text-sm font-bold transition-all",
                            field.value === n ? "border-primary bg-primary text-primary-foreground" : "border-border hover:border-primary/50"
                          )}>
                          {n}
                        </button>
                      ))}
                    </div>
                    <FormMessage />
                  </FormItem>
                )} />

                <div className="flex justify-between pt-2">
                  <Button type="button" variant="ghost" className="gap-2" onClick={() => setStep(2)}><ArrowLeft className="size-4" /> Back</Button>
                  <Button type="submit" className="gap-2">Next <ArrowRight className="size-4" /></Button>
                </div>
              </form>
            </Form>
          )}

          {/* ── STEP 4: Description (rich text) ── */}
          {step === 4 && (
            <Form {...form4}>
              <form onSubmit={form4.handleSubmit(onStep4)} className="space-y-5">
                {apiError && (
                  <div className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">{apiError}</div>
                )}

                {/* Summary + editor side by side on lg */}
                <div className="grid gap-5 lg:grid-cols-[280px_1fr]">
                  {/* Summary */}
                  <div className="rounded-xl border bg-muted/30 p-4 space-y-2 text-sm h-fit">
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Session Summary</p>
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
                      <span>Up to {s3.max_students} student{s3.max_students !== 1 ? "s" : ""}</span>
                    </div>
                  </div>

                  {/* Rich text editor */}
                  <FormField control={form4.control} name="description" render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center gap-1.5">
                        <FileText className="size-3.5" /> Session Description
                        <span className="text-muted-foreground font-normal text-xs">(optional)</span>
                      </FormLabel>
                      <p className="text-xs text-muted-foreground">
                        Describe what students will learn, prerequisites, materials needed, and your teaching approach.
                      </p>
                      <FormControl>
                        <RichTextEditor
                          value={field.value ?? ""}
                          onChange={field.onChange}
                          placeholder="e.g. In this session we will cover quadratic equations. Students should have basic algebra knowledge. Please bring a calculator and notebook."
                          maxLength={2000}
                          className="mt-1"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                </div>

                <div className="flex justify-between pt-2">
                  <Button type="button" variant="ghost" className="gap-2" onClick={() => setStep(3)} disabled={saving}>
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
        </CardContent>
      </Card>
    </div>
  )
}
