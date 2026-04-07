"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { z } from "zod"
import Link from "next/link"
import {
  CheckCircle2, ArrowLeft, ArrowRight, BookOpen,
  Loader2
} from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { cn } from "@/lib/utils"
import { useAuthStore } from "@/lib/store/useAuthStore"
import { authService } from "@/lib/services/authService"

// ─── Steps ───────────────────────────────────────────────────
const STEPS = [
  { id: 1, title: "Create Account",       desc: "Set up your tutor login credentials" },
  { id: 2, title: "Teaching Profile",     desc: "Tell students about your expertise" },
  { id: 3, title: "Subjects & Grades",    desc: "What subjects do you teach?" },
  { id: 4, title: "Availability & Rate",  desc: "Set your schedule and pricing" },
]

// ─── Selectable data ─────────────────────────────────────────
const ALL_SUBJECTS = [
  "Mathematics", "Physics", "Chemistry", "Biology",
  "English", "Amharic", "History", "Geography", "Civics", "ICT",
]
const GRADE_OPTIONS = [
  "Grade 5", "Grade 6", "Grade 7", "Grade 8",
  "Grade 9", "Grade 10", "Grade 11", "Grade 12",
]
const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]
const TIME_SLOTS = [
  "07:00 – 08:00", "08:00 – 09:00", "09:00 – 10:00",
  "10:00 – 11:00", "11:00 – 12:00", "13:00 – 14:00",
  "14:00 – 15:00", "15:00 – 16:00", "16:00 – 17:00",
  "17:00 – 18:00", "18:00 – 19:00", "19:00 – 20:00",
]
const LANGUAGES = ["Amharic", "English", "Oromiffa", "Tigrinya", "Somali", "Arabic"]

// ─── Zod schemas per step ─────────────────────────────────────
const step1Schema = z.object({
  firstName:       z.string().min(1, "First name is required"),
  lastName:        z.string().min(1, "Last name is required"),
  email:           z.string().email("Enter a valid email"),
  password:        z.string().min(6, "At least 6 characters"),
  confirmPassword: z.string().min(6, "Please confirm your password"),
}).refine((d) => d.password === d.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
})

const step2Schema = z.object({
  phone:            z.string().min(9, "Enter a valid phone number"),
  bio:              z.string().min(30, "Bio must be at least 30 characters"),
  qualifications:   z.string().min(5, "Add your qualifications"),
  experience_years: z.string().min(1, "Select years of experience"),
  languages:        z.array(z.string()).min(1, "Select at least one language"),
})

const step3Schema = z.object({
  subjects:    z.array(z.string()).min(1, "Select at least one subject"),
  gradeFrom:   z.string().min(1, "Select starting grade"),
  gradeTo:     z.string().min(1, "Select ending grade"),
})

const step4Schema = z.object({
  hourlyRate:    z.number().min(50, "Minimum rate is 50 ETB"),
  maxStudents:   z.enum(["1", "2", "3", "4", "5"]),
  availableDays: z.array(z.string()).min(1, "Select at least one day"),
  timeSlots:     z.array(z.string()).min(1, "Select at least one time slot"),
  terms:         z.boolean().refine((v) => v === true, "You must agree to the terms"),
})

type Step1 = z.infer<typeof step1Schema>
type Step2 = z.infer<typeof step2Schema>
type Step3 = z.infer<typeof step3Schema>
type Step4 = z.infer<typeof step4Schema>

// ─── Step progress bar ────────────────────────────────────────
function StepBar({ current }: { current: number }) {
  return (
    <div className="flex items-center gap-0 mb-8">
      {STEPS.map((step, i) => (
        <div key={step.id} className="flex items-center flex-1 last:flex-initial">
          <div className={cn(
            "flex h-8 w-8 shrink-0 items-center justify-center rounded-full border-2 text-xs font-bold transition-all",
            current > step.id  && "border-primary bg-primary text-primary-foreground",
            current === step.id && "border-primary text-primary bg-primary/10",
            current < step.id  && "border-muted-foreground/30 text-muted-foreground",
          )}>
            {current > step.id ? <CheckCircle2 className="size-4" /> : step.id}
          </div>
          {i < STEPS.length - 1 && (
            <div className={cn(
              "h-0.5 flex-1 transition-all",
              current > step.id ? "bg-primary" : "bg-muted-foreground/20"
            )} />
          )}
        </div>
      ))}
    </div>
  )
}

// ─── Toggleable multi-select badge helper ─────────────────────
function ToggleBadge({
  value, selected, onToggle,
}: { value: string; selected: boolean; onToggle: () => void }) {
  return (
    <Badge
      variant={selected ? "default" : "outline"}
      className="cursor-pointer select-none text-xs px-3 py-1"
      onClick={onToggle}
    >
      {selected && <CheckCircle2 className="size-3 mr-1" />}
      {value}
    </Badge>
  )
}

// ─── Main page ────────────────────────────────────────────────
export default function TutorRegisterPage() {
  const router = useRouter()
  const setAuth = useAuthStore((s) => s.setAuth)
  const [step, setStep] = useState(1)
  const [done, setDone] = useState(false)
  
  const [loadingStep1, setLoadingStep1] = useState(false)
  const [errorStep1, setErrorStep1] = useState<string | null>(null)

  // Forms for each step
  const form1 = useForm<Step1>({
    resolver: zodResolver(step1Schema),
    defaultValues: { firstName: "", lastName: "", email: "", password: "", confirmPassword: "" },
  })
  const form2 = useForm<Step2>({
    resolver: zodResolver(step2Schema),
    defaultValues: { phone: "", bio: "", qualifications: "", experience_years: "", languages: [] },
  })
  const form3 = useForm<Step3>({
    resolver: zodResolver(step3Schema),
    defaultValues: { subjects: [], gradeFrom: "", gradeTo: "" },
  })
  const form4 = useForm<Step4>({
    resolver: zodResolver(step4Schema),
    defaultValues: { hourlyRate: 150, maxStudents: "3", availableDays: [], timeSlots: [], terms: false },
  })

  // Handlers — collect data across steps, send everything in one API call at the end
  const onStep1 = (data: Step1) => { setStep(2); form1.reset(data) }
  const onStep2 = (_data: Step2) => setStep(3)
  const onStep3 = (_data: Step3) => setStep(4)

  const onStep4 = async (data: Step4) => {
    try {
      setLoadingStep1(true)
      setErrorStep1(null)

      const s1data = form1.getValues()
      const s2data = form2.getValues()
      const s3data = form3.getValues()

      // Map experience string → number
      const expMap: Record<string, number> = {
        "Less than 1 year": 0, "1–2 years": 1, "3–5 years": 3,
        "6–10 years": 6, "10+ years": 10,
      }
      // Map grade label → number
      const gradeNum = (g: string) => parseInt(g.replace("Grade ", "")) || 1

      const res = await authService.register({
        name:             `${s1data.firstName} ${s1data.lastName}`,
        email:            s1data.email,
        password:         s1data.password,
        role:             "TUTOR",
        tenantId:         1,
        phone:            s2data.phone,
        bio:              s2data.bio,
        qualifications:   s2data.qualifications,
        experience_years: expMap[s2data.experience_years] ?? 0,
        languages:        s2data.languages.join(","),
        subjects:         s3data.subjects,
        grade_from:       gradeNum(s3data.gradeFrom),
        grade_to:         gradeNum(s3data.gradeTo),
        hourly_rate:      data.hourlyRate,
      })

      setAuth(res.user, res.accessToken, res.refreshToken)
      setDone(true)
      setTimeout(() => router.push("/tutor/tutor-dashboard"), 1800)
    } catch (err: any) {
      setErrorStep1(err.message)
    } finally {
      setLoadingStep1(false)
    }
  }

  const currentStep = STEPS[step - 1]

  // ── Toggle helpers ─────────────────────────────────────────
  function toggleArray(arr: string[], val: string) {
    return arr.includes(val) ? arr.filter((v) => v !== val) : [...arr, val]
  }

  return (
    <div className="min-h-screen bg-muted/30 flex flex-col items-center justify-center px-4 py-12">
      {/* Logo */}
      <Link href="/" className="flex items-center gap-2 mb-8">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary text-primary-foreground font-bold text-sm">ET</div>
        <span className="font-bold text-xl">EthioTutor</span>
      </Link>

      <div className="w-full max-w-lg">
        {done ? (
          /* ── Success ── */
          <Card className="text-center">
            <CardContent className="pt-12 pb-10 space-y-4">
              <div className="flex justify-center">
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-green-100 dark:bg-green-950/30">
                  <CheckCircle2 className="size-9 text-green-600" />
                </div>
              </div>
              <h2 className="text-2xl font-bold">Welcome, Tutor! 🎉</h2>
              <p className="text-muted-foreground text-sm max-w-xs mx-auto">
                Your profile is being reviewed. You can complete your setup from the dashboard.
              </p>
              <div className="flex justify-center pt-2">
                <div className="h-1.5 w-40 rounded-full bg-muted overflow-hidden">
                  <div className="h-full bg-primary rounded-full" style={{ animation: "grow 1.8s linear forwards" }} />
                </div>
              </div>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardHeader>
              <StepBar current={step} />
              <div className="flex items-center gap-3 mb-1">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
                  <BookOpen className="size-5 text-primary" />
                </div>
                <div>
                  <Badge variant="outline" className="text-xs mb-0.5">Step {step} of {STEPS.length}</Badge>
                  <CardTitle className="text-xl leading-tight">{currentStep.title}</CardTitle>
                </div>
              </div>
              <CardDescription>{currentStep.desc}</CardDescription>
            </CardHeader>

            <CardContent>
              {/* ── STEP 1: Account ──────────────────────────── */}
              {step === 1 && (
                <Form {...form1}>
                  <form onSubmit={form1.handleSubmit(onStep1)} className="space-y-4">
                    {errorStep1 && (
                        <div className="bg-red-50 text-red-500 text-sm p-3 rounded-md text-center">
                        {errorStep1}
                        </div>
                    )}
                    <div className="grid grid-cols-2 gap-3">
                      <FormField control={form1.control} name="firstName" render={({ field }) => (
                        <FormItem>
                          <FormLabel>First Name</FormLabel>
                          <FormControl><Input placeholder="Dawit" {...field} /></FormControl>
                          <FormMessage />
                        </FormItem>
                      )} />
                      <FormField control={form1.control} name="lastName" render={({ field }) => (
                        <FormItem>
                          <FormLabel>Last Name</FormLabel>
                          <FormControl><Input placeholder="Bekele" {...field} /></FormControl>
                          <FormMessage />
                        </FormItem>
                      )} />
                    </div>
                    <FormField control={form1.control} name="email" render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email Address</FormLabel>
                        <FormControl><Input type="email" placeholder="tutor@example.com" {...field} /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />
                    <FormField control={form1.control} name="password" render={({ field }) => (
                      <FormItem>
                        <FormLabel>Password</FormLabel>
                        <FormControl><Input type="password" placeholder="At least 6 characters" {...field} /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />
                    <FormField control={form1.control} name="confirmPassword" render={({ field }) => (
                      <FormItem>
                        <FormLabel>Confirm Password</FormLabel>
                        <FormControl><Input type="password" placeholder="Repeat your password" {...field} /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />
                    <div className="flex justify-between items-center pt-2">
                      <p className="text-xs text-muted-foreground">
                        Already have an account?{" "}
                        <Link href="/sign-in" className="underline underline-offset-2">Sign in</Link>
                      </p>
                      <Button type="submit" className="gap-2" disabled={loadingStep1}>
                        {loadingStep1 && <Loader2 className="animate-spin size-4" />}
                        Continue <ArrowRight className="size-4" />
                      </Button>
                    </div>
                  </form>
                </Form>
              )}

              {/* ── STEP 2: Teaching Profile ──────────────────── */}
              {step === 2 && (
                <Form {...form2}>
                  <form onSubmit={form2.handleSubmit(onStep2)} className="space-y-4">
                    <FormField control={form2.control} name="phone" render={({ field }) => (
                      <FormItem>
                        <FormLabel>Phone Number</FormLabel>
                        <FormControl><Input placeholder="+251 91 234 5678" {...field} /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />

                    <FormField control={form2.control} name="experience_years" render={({ field }) => (
                      <FormItem>
                        <FormLabel>Years of Teaching Experience</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger><SelectValue placeholder="Select experience" /></SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {["Less than 1 year", "1–2 years", "3–5 years", "6–10 years", "10+ years"].map((v) => (
                              <SelectItem key={v} value={v}>{v}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )} />

                    <FormField control={form2.control} name="qualifications" render={({ field }) => (
                      <FormItem>
                        <FormLabel>Qualifications & Certifications</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g. BSc Mathematics, Addis Ababa University" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />

                    <FormField control={form2.control} name="languages" render={() => (
                      <FormItem>
                        <FormLabel>Languages You Teach In</FormLabel>
                        <div className="flex flex-wrap gap-2 mt-1">
                          {LANGUAGES.map((lang) => {
                            const cur = form2.watch("languages") ?? []
                            return (
                              <ToggleBadge
                                key={lang} value={lang}
                                selected={cur.includes(lang)}
                                onToggle={() => form2.setValue("languages", toggleArray(cur, lang), { shouldValidate: true })}
                              />
                            )
                          })}
                        </div>
                        <FormMessage />
                      </FormItem>
                    )} />

                    <FormField control={form2.control} name="bio" render={({ field }) => (
                      <FormItem>
                        <FormLabel>Teaching Bio</FormLabel>
                        <FormControl>
                          <Textarea
                            rows={4}
                            placeholder="Tell students about your teaching style, background, and what makes you a great tutor…"
                            {...field}
                          />
                        </FormControl>
                        <p className="text-xs text-muted-foreground">
                          {field.value.length}/30 min characters
                        </p>
                        <FormMessage />
                      </FormItem>
                    )} />

                    <div className="flex justify-between pt-2">
                       <Button type="button" variant="ghost" className="gap-2" onClick={() => setStep(1)}>
                         <ArrowLeft className="size-4" /> Back
                       </Button>
                      <Button type="submit" className="gap-2 ml-auto">Continue <ArrowRight className="size-4" /></Button>
                    </div>
                  </form>
                </Form>
              )}

              {/* ── STEP 3: Subjects & Grades ─────────────────── */}
              {step === 3 && (
                <Form {...form3}>
                  <form onSubmit={form3.handleSubmit(onStep3)} className="space-y-5">
                    <FormField control={form3.control} name="subjects" render={() => (
                      <FormItem>
                        <FormLabel>Subjects You Teach</FormLabel>
                        <div className="flex flex-wrap gap-2 mt-1">
                          {ALL_SUBJECTS.map((sub) => {
                            const cur = form3.watch("subjects") ?? []
                            return (
                              <ToggleBadge
                                key={sub} value={sub}
                                selected={cur.includes(sub)}
                                onToggle={() => form3.setValue("subjects", toggleArray(cur, sub), { shouldValidate: true })}
                              />
                            )
                          })}
                        </div>
                        <FormMessage />
                      </FormItem>
                    )} />

                    <Separator />

                    <div className="space-y-2">
                      <p className="text-sm font-medium">Grade Range You Cover</p>
                      <p className="text-xs text-muted-foreground">Students within this range can book you.</p>
                      <div className="grid grid-cols-2 gap-3">
                        <FormField control={form3.control} name="gradeFrom" render={({ field }) => (
                          <FormItem>
                            <FormLabel>From Grade</FormLabel>
                            <Select onValueChange={field.onChange} value={field.value}>
                              <FormControl>
                                <SelectTrigger><SelectValue placeholder="Lowest grade" /></SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {GRADE_OPTIONS.map((g) => <SelectItem key={g} value={g}>{g}</SelectItem>)}
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )} />
                        <FormField control={form3.control} name="gradeTo" render={({ field }) => (
                          <FormItem>
                            <FormLabel>To Grade</FormLabel>
                            <Select onValueChange={field.onChange} value={field.value}>
                              <FormControl>
                                <SelectTrigger><SelectValue placeholder="Highest grade" /></SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {GRADE_OPTIONS.map((g) => <SelectItem key={g} value={g}>{g}</SelectItem>)}
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )} />
                      </div>
                    </div>

                    <div className="flex justify-between pt-2">
                      <Button type="button" variant="ghost" className="gap-2" onClick={() => setStep(2)}>
                        <ArrowLeft className="size-4" /> Back
                      </Button>
                      <Button type="submit" className="gap-2">Continue <ArrowRight className="size-4" /></Button>
                    </div>
                  </form>
                </Form>
              )}

              {/* ── STEP 4: Availability & Rate ───────────────── */}
              {step === 4 && (
                <Form {...form4}>
                  <form onSubmit={form4.handleSubmit(onStep4)} className="space-y-5">
                    {errorStep1 && (
                      <div className="bg-red-50 text-red-500 text-sm p-3 rounded-md text-center">
                        {errorStep1}
                      </div>
                    )}
                    <FormField control={form4.control} name="hourlyRate" render={({ field }) => (
                      <FormItem>
                        <FormLabel>Hourly Rate (ETB)</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <Input
                              type="number" min={50} step={10}
                              placeholder="150"
                              {...field}
                              className="pr-14"
                            />
                            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground font-medium">
                              ETB/hr
                            </span>
                          </div>
                        </FormControl>
                        <p className="text-xs text-muted-foreground">Minimum 50 ETB/hr. Platform takes 15% commission.</p>
                        <FormMessage />
                      </FormItem>
                    )} />

                    {/* Max students per session */}
                    <FormField control={form4.control} name="maxStudents" render={({ field }) => (
                      <FormItem>
                        <FormLabel>Max Students Per Session</FormLabel>
                        <RadioGroup
                          onValueChange={field.onChange}
                          value={field.value}
                          className="flex gap-2 flex-wrap mt-1"
                        >
                          {["1", "2", "3", "4", "5"].map((n) => (
                            <div
                              key={n}
                              className={cn(
                                "flex h-10 w-10 items-center justify-center rounded-lg border-2 cursor-pointer text-sm font-bold transition-all",
                                field.value === n ? "border-primary bg-primary text-primary-foreground" : "border-border hover:border-primary/50"
                              )}
                              onClick={() => field.onChange(n)}
                            >
                              <RadioGroupItem value={n} className="hidden" />
                              {n}
                            </div>
                          ))}
                        </RadioGroup>
                        <FormMessage />
                      </FormItem>
                    )} />

                    {/* Available days */}
                    <FormField control={form4.control} name="availableDays" render={() => (
                      <FormItem>
                        <FormLabel>Available Days</FormLabel>
                        <div className="flex gap-2 flex-wrap mt-1">
                          {DAYS.map((day) => {
                            const cur = form4.watch("availableDays") ?? []
                            const sel = cur.includes(day)
                            return (
                              <div
                                key={day}
                                className={cn(
                                  "flex h-9 w-12 items-center justify-center rounded-lg border-2 cursor-pointer text-xs font-semibold transition-all select-none",
                                  sel ? "border-primary bg-primary text-primary-foreground" : "border-border hover:border-primary/50"
                                )}
                                onClick={() => form4.setValue("availableDays", toggleArray(cur, day), { shouldValidate: true })}
                              >
                                {day}
                              </div>
                            )
                          })}
                        </div>
                        <FormMessage />
                      </FormItem>
                    )} />

                    {/* Time slots */}
                    <FormField control={form4.control} name="timeSlots" render={() => (
                      <FormItem>
                        <FormLabel>Available Time Slots</FormLabel>
                        <div className="grid grid-cols-2 gap-2 mt-1">
                          {TIME_SLOTS.map((slot) => {
                            const cur = form4.watch("timeSlots") ?? []
                            const sel = cur.includes(slot)
                            return (
                              <div
                                key={slot}
                                className={cn(
                                  "flex items-center gap-2 rounded-lg border px-3 py-2 cursor-pointer text-xs transition-all select-none",
                                  sel ? "border-primary bg-primary/5 text-primary font-medium" : "border-border hover:border-primary/40"
                                )}
                                onClick={() => form4.setValue("timeSlots", toggleArray(cur, slot), { shouldValidate: true })}
                              >
                                {sel
                                  ? <CheckCircle2 className="size-3 shrink-0 text-primary" />
                                  : <div className="h-3 w-3 rounded-full border border-muted-foreground/40 shrink-0" />
                                }
                                {slot}
                              </div>
                            )
                          })}
                        </div>
                        <FormMessage />
                      </FormItem>
                    )} />

                    {/* Terms */}
                    <FormField control={form4.control} name="terms" render={({ field }) => (
                      <FormItem className="flex items-start gap-2.5">
                        <FormControl>
                          <Checkbox checked={field.value} onCheckedChange={field.onChange} className="mt-0.5" />
                        </FormControl>
                        <FormLabel className="text-sm font-normal leading-relaxed">
                          I agree to the{" "}
                          <a href="#" className="underline underline-offset-2 text-primary">Tutor Terms of Service</a>
                          {" "}and{" "}
                          <a href="#" className="underline underline-offset-2 text-primary">Commission Policy</a>
                        </FormLabel>
                        <FormMessage />
                      </FormItem>
                    )} />

                    <div className="flex justify-between pt-2">
                       <Button type="button" variant="ghost" className="gap-2" onClick={() => setStep(3)}>
                         <ArrowLeft className="size-4" /> Back
                       </Button>
                      <Button type="submit" className="gap-2 px-6" disabled={loadingStep1}>
                        {loadingStep1 && <Loader2 className="animate-spin size-4" />}
                        <BookOpen className="size-4" />
                        Complete Profile
                      </Button>
                    </div>
                  </form>
                </Form>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
