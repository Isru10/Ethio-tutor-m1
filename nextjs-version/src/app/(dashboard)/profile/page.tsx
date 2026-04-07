"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { z } from "zod"
import { useState } from "react"
import { CheckCircle2, Save } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import {
  Form, FormControl, FormField, FormItem, FormLabel, FormMessage,
} from "@/components/ui/form"
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select"
import { useAuthStore } from "@/store/authStore"
import { studentProfiles, grades as gradesData } from "@/lib/mockData"

// ── Schema (identical pattern to settings/account) ─────────
const profileSchema = z.object({
  firstName:    z.string().min(1, "First name is required"),
  lastName:     z.string().min(1, "Last name is required"),
  email:        z.string().email("Invalid email"),
  phone:        z.string().min(9, "Enter a valid phone number"),
  gradeId:      z.string().min(1, "Select your grade"),
  learningGoals: z.string().min(5, "Tell us your goals"),
})

type ProfileValues = z.infer<typeof profileSchema>

export default function ProfilePage() {
  const { user, isPro } = useAuthStore()
  const [saved, setSaved] = useState(false)

  const profile = studentProfiles.find(
    (sp) => sp.user_id === user?.user_id && sp.tenant_id === user?.tenant_id
  )
  const [firstName, lastName] = (user?.name ?? "").split(" ")
  const myGrades = gradesData.filter((g) => g.tenant_id === user?.tenant_id)
  const initials = user?.name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2) ?? "?"

  const form = useForm<ProfileValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      firstName:     firstName ?? "",
      lastName:      lastName  ?? "",
      email:         user?.email ?? "",
      phone:         "+251911000004",
      gradeId:       profile?.grade_id?.toString() ?? "",
      learningGoals: profile?.learning_goals ?? "",
    },
  })

  function onSubmit(_data: ProfileValues) {
    // In production: call PATCH /api/v1/profile
    setSaved(true)
    setTimeout(() => setSaved(false), 3000)
  }

  return (
    <div className="space-y-6 px-4 lg:px-6">
      {/* Heading */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight">My Profile</h1>
        <p className="text-muted-foreground text-sm">
          Manage your personal information and learning preferences.
        </p>
      </div>

      {/* Avatar summary card */}
      <Card>
        <CardContent className="pt-5">
          <div className="flex items-center gap-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary text-primary-foreground text-xl font-bold">
              {initials}
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-semibold">{user?.name}</p>
              <p className="text-muted-foreground text-sm truncate">{user?.email}</p>
            </div>
            <div className="flex gap-2 flex-wrap">
              <Badge variant="outline" className="capitalize">{user?.role?.toLowerCase()}</Badge>
              {isPro() ? (
                <Badge className="bg-amber-500 hover:bg-amber-600 text-white border-0">PRO</Badge>
              ) : (
                <Badge variant="secondary">Basic</Badge>
              )}
            </div>
          </div>

          <div className="mt-4 grid grid-cols-2 gap-4 text-center">
            <div className="rounded-lg bg-muted/50 py-3">
              <p className="text-xl font-bold">{profile?.total_spent?.toLocaleString() ?? 0}</p>
              <p className="text-xs text-muted-foreground">ETB Spent</p>
            </div>
            <div className="rounded-lg bg-muted/50 py-3">
              <p className="text-xl font-bold">
                {myGrades.find((g) => g.grade_id === profile?.grade_id)?.grade_name ?? "—"}
              </p>
              <p className="text-xs text-muted-foreground">Current Grade</p>
            </div>
          </div>

          {!isPro() && (
            <div className="mt-4 rounded-xl bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 px-4 py-3 flex items-center justify-between gap-3">
              <div>
                <p className="text-xs font-semibold text-amber-700 dark:text-amber-400">Upgrade to Pro</p>
                <p className="text-xs text-muted-foreground">Unlock recordings & unlimited bookings</p>
              </div>
              <Button size="sm" className="bg-amber-500 hover:bg-amber-600 text-white border-0 shrink-0">
                Upgrade Now
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Edit form — same pattern as settings/account */}
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          {/* Personal Info */}
          <Card>
            <CardHeader>
              <CardTitle>Personal Information</CardTitle>
              <CardDescription>Update your name, phone, and contact details.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <FormField control={form.control} name="firstName" render={({ field }) => (
                  <FormItem>
                    <FormLabel>First Name</FormLabel>
                    <FormControl><Input {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="lastName" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Last Name</FormLabel>
                    <FormControl><Input {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
              </div>
              <FormField control={form.control} name="email" render={({ field }) => (
                <FormItem>
                  <FormLabel>Email Address</FormLabel>
                  <FormControl><Input type="email" disabled className="bg-muted/40" {...field} /></FormControl>
                  <p className="text-xs text-muted-foreground">Email cannot be changed here.</p>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="phone" render={({ field }) => (
                <FormItem>
                  <FormLabel>Phone Number</FormLabel>
                  <FormControl><Input {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
            </CardContent>
          </Card>

          {/* Learning Preferences */}
          <Card>
            <CardHeader>
              <CardTitle>Learning Preferences</CardTitle>
              <CardDescription>Help us match you with the best tutors.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <FormField control={form.control} name="gradeId" render={({ field }) => (
                <FormItem>
                  <FormLabel>Grade Level</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger><SelectValue placeholder="Select grade" /></SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {myGrades.map((g) => (
                        <SelectItem key={g.grade_id} value={g.grade_id.toString()}>
                          {g.grade_name} · {g.level_group}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="learningGoals" render={({ field }) => (
                <FormItem>
                  <FormLabel>Learning Goals</FormLabel>
                  <FormControl>
                    <Textarea rows={3} placeholder="Describe what you want to achieve…" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )} />
            </CardContent>
          </Card>

          {/* Danger Zone (same as settings/account) */}
          <Card>
            <CardHeader>
              <CardTitle>Danger Zone</CardTitle>
              <CardDescription>Irreversible and destructive actions.</CardDescription>
            </CardHeader>
            <CardContent>
              <Separator className="mb-4" />
              <div className="flex flex-wrap gap-2 items-center justify-between">
                <div>
                  <h4 className="font-semibold text-sm">Delete Account</h4>
                  <p className="text-sm text-muted-foreground">Permanently delete your account and all associated data.</p>
                </div>
                <Button variant="destructive" type="button">Delete Account</Button>
              </div>
            </CardContent>
          </Card>

          {/* Save */}
          <div className="flex items-center gap-3">
            <Button type="submit" className="gap-2" disabled={saved}>
              {saved ? <CheckCircle2 className="size-4" /> : <Save className="size-4" />}
              {saved ? "Saved!" : "Save Changes"}
            </Button>
            <Button type="reset" variant="outline" onClick={() => form.reset()}>Cancel</Button>
            {saved && <span className="text-sm text-green-600 dark:text-green-400">Profile updated successfully.</span>}
          </div>
        </form>
      </Form>
    </div>
  )
}
