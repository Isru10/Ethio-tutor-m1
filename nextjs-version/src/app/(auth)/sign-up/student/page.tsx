"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { z } from "zod"
import Link from "next/link"
import { CheckCircle2, ArrowLeft, ArrowRight, GraduationCap, Loader2 } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import { useAuthStore } from "@/lib/store/useAuthStore"
import { authService } from "@/lib/services/authService"

// ─── Steps configuration ────────────────────────────────────
const STEPS = [
  { id: 1, title: "Create Account",     desc: "Set up your login credentials" },
  { id: 2, title: "About You",          desc: "Tell us a bit about yourself" },
  { id: 3, title: "Your Goals",         desc: "Help us personalize your experience" },
  { id: 4, title: "Almost Done!",       desc: "Final details before you start" },
]

// ─── Zod schemas per step ───────────────────────────────────
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
  phone:      z.string().min(9, "Enter a valid phone number"),
  grade:      z.string().min(1, "Select your grade"),
  school:     z.string().min(2, "Enter your school name"),
  city:       z.string().min(2, "Enter your city"),
})

const step3Schema = z.object({
  hearAboutUs:   z.string().min(1, "Please select an option"),
  learningGoals: z.string().min(10, "Tell us a bit more (10+ chars)"),
  focusSubjects: z.array(z.string()).min(1, "Pick at least one subject"),
})

const step4Schema = z.object({
  plan:  z.enum(["basic", "pro"]),
  terms: z.boolean().refine((v) => v === true, "You must agree to the terms"),
})

// ─── Types ──────────────────────────────────────────────────
type Step1 = z.infer<typeof step1Schema>
type Step2 = z.infer<typeof step2Schema>
type Step3 = z.infer<typeof step3Schema>
type Step4 = z.infer<typeof step4Schema>

const GRADES = ["Grade 5","Grade 6","Grade 7","Grade 8","Grade 9","Grade 10","Grade 11","Grade 12"]
const SUBJECTS = ["Mathematics","Physics","Chemistry","Biology","English","Amharic","History","Geography","Civics","ICT"]
const HEAR_OPTIONS = [
  { value: "friend",       label: "A friend or classmate" },
  { value: "social",       label: "Social media (TikTok, Instagram, Telegram)" },
  { value: "teacher",      label: "My teacher recommended it" },
  { value: "google",       label: "Google / online search" },
  { value: "ad",           label: "Advertisement" },
  { value: "other",        label: "Other" },
]

// ─── Step Progress Bar ───────────────────────────────────────
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
              current > step.id + 0 ? "bg-primary" : "bg-muted-foreground/20"
            )} />
          )}
        </div>
      ))}
    </div>
  )
}

// ─── Main Component ─────────────────────────────────────────
export default function StudentRegisterPage() {
  const router = useRouter()
  const setAuth = useAuthStore((s) => s.setAuth)
  const [step, setStep]   = useState(1)
  const [done, setDone]   = useState(false)
  
  const [loadingStep1, setLoadingStep1] = useState(false)
  const [errorStep1, setErrorStep1] = useState<string | null>(null)

  // Collected data across steps
  const [s1, setS1] = useState<Partial<Step1>>({})
  const [s2, setS2] = useState<Partial<Step2>>({})
  const [s3, setS3] = useState<Partial<Step3>>({})

  // ── Step 1 form ──────────────────────────────────────────
  const form1 = useForm<Step1>({
    resolver: zodResolver(step1Schema),
    defaultValues: { firstName:"", lastName:"", email:"", password:"", confirmPassword:"" },
  })
  const form2 = useForm<Step2>({
    resolver: zodResolver(step2Schema),
    defaultValues: { phone:"", grade:"", school:"", city:"" },
  })
  const form3 = useForm<Step3>({
    resolver: zodResolver(step3Schema),
    defaultValues: { hearAboutUs:"", learningGoals:"", focusSubjects:[] },
  })
  const form4 = useForm<Step4>({
    resolver: zodResolver(step4Schema),
    defaultValues: { plan:"basic", terms: false },
  })

  // Actually register the user with ALL collected data at the final step
  const handleStep1 = (data: Step1) => { setS1(data); setStep(2) }
  const handleStep2 = (data: Step2) => { setS2(data); setStep(3) }
  const handleStep3 = (data: Step3) => { setS3(data); setStep(4) }

  const handleStep4 = async (_data: Step4) => {
    try {
      setLoadingStep1(true)
      setErrorStep1(null)

      const res = await authService.register({
        name:           `${s1.firstName} ${s1.lastName}`,
        email:          s1.email,
        password:       s1.password,
        role:           "STUDENT",
        tenantId:       1,
        phone:          s2.phone,
        grade_name:     s2.grade,
        learning_goals: s3.learningGoals,
      })

      setAuth(res.user, res.accessToken, res.refreshToken)
      setDone(true)
      setTimeout(() => router.push("/dashboard"), 1800)
    } catch (err: any) {
      setErrorStep1(err.message)
    } finally {
      setLoadingStep1(false)
    }
  }

  const currentStep = STEPS.find((s) => s.id === step)!

  return (
    <div className="min-h-screen bg-muted/30 flex flex-col items-center justify-center px-4 py-12">
      {/* Logo */}
      <Link href="/" className="flex items-center gap-2 mb-8">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary text-primary-foreground font-bold text-sm">ET</div>
        <span className="font-bold text-xl">EthioTutor</span>
      </Link>

      {/* Card */}
      <div className="w-full max-w-lg">
        {done ? (
          /* ── Success screen ── */
          <Card className="text-center">
            <CardContent className="pt-12 pb-10 space-y-4">
              <div className="flex justify-center">
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-green-100 dark:bg-green-950/30">
                  <CheckCircle2 className="size-9 text-green-600" />
                </div>
              </div>
              <h2 className="text-2xl font-bold">Welcome to EthioTutor!</h2>
              <p className="text-muted-foreground text-sm">
                Your account is ready. Taking you to your dashboard…
              </p>
              <div className="flex justify-center pt-2">
                <div className="h-1.5 w-40 rounded-full bg-muted overflow-hidden">
                  <div className="h-full bg-primary rounded-full animate-[fill_1.8s_linear_forwards]" style={{ width: "100%", animationName: "fill" }} />
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
                  <GraduationCap className="size-5 text-primary" />
                </div>
                <div>
                  <Badge variant="outline" className="text-xs mb-0.5">Step {step} of {STEPS.length}</Badge>
                  <CardTitle className="text-xl leading-tight">{currentStep.title}</CardTitle>
                </div>
              </div>
              <CardDescription>{currentStep.desc}</CardDescription>
            </CardHeader>

            <CardContent>
              {/* ── STEP 1: Account credentials ──────────────── */}
              {step === 1 && (
                <Form {...form1}>
                  <form onSubmit={form1.handleSubmit(handleStep1)} className="space-y-4">
                    <div className="grid grid-cols-2 gap-3">
                      <FormField control={form1.control} name="firstName" render={({ field }) => (
                        <FormItem>
                          <FormLabel>First Name</FormLabel>
                          <FormControl><Input placeholder="Meron" {...field} /></FormControl>
                          <FormMessage />
                        </FormItem>
                      )} />
                      <FormField control={form1.control} name="lastName" render={({ field }) => (
                        <FormItem>
                          <FormLabel>Last Name</FormLabel>
                          <FormControl><Input placeholder="Alemu" {...field} /></FormControl>
                          <FormMessage />
                        </FormItem>
                      )} />
                    </div>
                    <FormField control={form1.control} name="email" render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email Address</FormLabel>
                        <FormControl><Input type="email" placeholder="you@example.com" {...field} /></FormControl>
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

              {/* ── STEP 2: Personal details ────────────────── */}
              {step === 2 && (
                <Form {...form2}>
                  <form onSubmit={form2.handleSubmit(handleStep2)} className="space-y-4">
                    <FormField control={form2.control} name="phone" render={({ field }) => (
                      <FormItem>
                        <FormLabel>Phone Number</FormLabel>
                        <FormControl><Input placeholder="+251 91 234 5678" {...field} /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />
                    <FormField control={form2.control} name="grade" render={({ field }) => (
                      <FormItem>
                        <FormLabel>Current Grade</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger><SelectValue placeholder="Select your grade" /></SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {GRADES.map((g) => <SelectItem key={g} value={g}>{g}</SelectItem>)}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )} />
                    <FormField control={form2.control} name="school" render={({ field }) => (
                      <FormItem>
                        <FormLabel>School Name</FormLabel>
                        <FormControl><Input placeholder="e.g. Addis Ababa Secondary School" {...field} /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />
                    <FormField control={form2.control} name="city" render={({ field }) => (
                      <FormItem>
                        <FormLabel>City / Region</FormLabel>
                        <FormControl><Input placeholder="e.g. Addis Ababa" {...field} /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />
                    <div className="flex justify-between pt-2">
                      <Button type="submit" className="gap-2 ml-auto">
                        Continue <ArrowRight className="size-4" />
                      </Button>
                    </div>
                  </form>
                </Form>
              )}

              {/* ── STEP 3: Learning goals ───────────────────── */}
              {step === 3 && (
                <Form {...form3}>
                  <form onSubmit={form3.handleSubmit(handleStep3)} className="space-y-4">
                    <FormField control={form3.control} name="hearAboutUs" render={({ field }) => (
                      <FormItem>
                        <FormLabel>How did you hear about EthioTutor?</FormLabel>
                        <FormControl>
                          <RadioGroup onValueChange={field.onChange} value={field.value} className="space-y-2 mt-1">
                            {HEAR_OPTIONS.map((opt) => (
                              <div key={opt.value} className="flex items-center space-x-2 rounded-lg border px-3 py-2.5 hover:bg-muted/50 cursor-pointer">
                                <RadioGroupItem value={opt.value} id={opt.value} />
                                <label htmlFor={opt.value} className="text-sm cursor-pointer flex-1">{opt.label}</label>
                              </div>
                            ))}
                          </RadioGroup>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />
                    <FormField control={form3.control} name="focusSubjects" render={() => (
                      <FormItem>
                        <FormLabel>Which subjects do you need help with?</FormLabel>
                        <div className="flex flex-wrap gap-2 mt-1">
                          {SUBJECTS.map((sub) => {
                            const selected = form3.watch("focusSubjects") ?? []
                            const checked = selected.includes(sub)
                            return (
                              <Badge
                                key={sub}
                                variant={checked ? "default" : "outline"}
                                className="cursor-pointer text-xs px-3 py-1 select-none"
                                onClick={() => {
                                  const cur = form3.getValues("focusSubjects") ?? []
                                  form3.setValue(
                                    "focusSubjects",
                                    checked ? cur.filter((s) => s !== sub) : [...cur, sub],
                                    { shouldValidate: true }
                                  )
                                }}
                              >
                                {sub}
                              </Badge>
                            )
                          })}
                        </div>
                        <FormMessage />
                      </FormItem>
                    )} />
                    <FormField control={form3.control} name="learningGoals" render={({ field }) => (
                      <FormItem>
                        <FormLabel>What do you want to achieve?</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="e.g. I want to improve my Math grade and prepare for the national exam…"
                            rows={3}
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />
                    <div className="flex justify-between pt-2">
                      <Button type="button" variant="ghost" className="gap-2" onClick={() => setStep(2)}>
                        <ArrowLeft className="size-4" /> Back
                      </Button>
                      <Button type="submit" className="gap-2">
                        Continue <ArrowRight className="size-4" />
                      </Button>
                    </div>
                  </form>
                </Form>
              )}

              {/* ── STEP 4: Plan selection + terms ───────────── */}
              {step === 4 && (
                <Form {...form4}>
                  <form onSubmit={form4.handleSubmit(handleStep4)} className="space-y-5">
                    {errorStep1 && (
                      <div className="bg-red-50 text-red-500 text-sm p-3 rounded-md text-center">
                        {errorStep1}
                      </div>
                    )}
                    <FormField control={form4.control} name="plan" render={({ field }) => (
                      <FormItem>
                        <FormLabel>Choose Your Plan</FormLabel>
                        <RadioGroup onValueChange={field.onChange} value={field.value} className="grid grid-cols-2 gap-3 mt-1">
                          {/* Basic */}
                          <div
                            className={cn(
                              "rounded-xl border-2 p-4 cursor-pointer transition-all space-y-1",
                              field.value === "basic" ? "border-primary bg-primary/5" : "border-border hover:border-muted-foreground/40"
                            )}
                            onClick={() => field.onChange("basic")}
                          >
                            <RadioGroupItem value="basic" id="basic" className="hidden" />
                            <p className="font-semibold text-sm">Basic</p>
                            <p className="text-xl font-bold">Free</p>
                            <ul className="text-xs text-muted-foreground space-y-0.5">
                              <li>✓ Browse & book classes</li>
                              <li>✓ Session calendar</li>
                              <li>✓ Payment history</li>
                            </ul>
                          </div>
                          {/* Pro */}
                          <div
                            className={cn(
                              "rounded-xl border-2 p-4 cursor-pointer transition-all space-y-1 relative",
                              field.value === "pro" ? "border-amber-500 bg-amber-50 dark:bg-amber-950/20" : "border-border hover:border-muted-foreground/40"
                            )}
                            onClick={() => field.onChange("pro")}
                          >
                            <RadioGroupItem value="pro" id="pro" className="hidden" />
                            <Badge className="absolute top-2 right-2 bg-amber-500 text-white border-0 text-[10px]">POPULAR</Badge>
                            <p className="font-semibold text-sm">Pro</p>
                            <p className="text-xl font-bold">299 <span className="text-xs font-normal text-muted-foreground">ETB/mo</span></p>
                            <ul className="text-xs text-muted-foreground space-y-0.5">
                              <li>✓ Everything in Basic</li>
                              <li>✓ Session recordings</li>
                              <li>✓ Unlimited bookings</li>
                            </ul>
                          </div>
                        </RadioGroup>
                        <FormMessage />
                      </FormItem>
                    )} />

                    <FormField control={form4.control} name="terms" render={({ field }) => (
                      <FormItem className="flex items-start gap-2.5">
                        <FormControl>
                          <Checkbox checked={field.value} onCheckedChange={field.onChange} className="mt-0.5" />
                        </FormControl>
                        <FormLabel className="text-sm font-normal leading-relaxed">
                          I agree to the{" "}
                          <a href="#" className="underline underline-offset-2 text-primary">Terms of Service</a>{" "}
                          and{" "}
                          <a href="#" className="underline underline-offset-2 text-primary">Privacy Policy</a>
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
                        <GraduationCap className="size-4" />
                        {loadingStep1 ? "Creating…" : "Complete Profile"}
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
