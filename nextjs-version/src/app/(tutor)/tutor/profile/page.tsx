"use client"

import { useEffect, useState, useCallback } from "react"
import { useAuthStore } from "@/lib/store/useAuthStore"
import { API_BASE } from "@/lib/api"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Skeleton } from "@/components/ui/skeleton"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { FileUpload } from "@/components/file-upload"
import { cn } from "@/lib/utils"
import { toast } from "sonner"
import {
  Save, Star, BookOpen, Clock, Users, Wallet,
  CheckCircle2, Globe, Award, Phone, Mail,
} from "lucide-react"

// ─── Constants (same as signup) ──────────────────────────────
const DAYS        = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]
const TIME_SLOTS  = [
  "07:00 – 08:00", "08:00 – 09:00", "09:00 – 10:00", "10:00 – 11:00",
  "11:00 – 12:00", "13:00 – 14:00", "14:00 – 15:00", "15:00 – 16:00",
  "16:00 – 17:00", "17:00 – 18:00", "18:00 – 19:00", "19:00 – 20:00",
]
const LANGUAGES   = ["Amharic", "English", "Afaan Oromoo", "Tigrinya", "Somali", "Arabic"]
const EXP_OPTIONS = ["Less than 1 year", "1–2 years", "3–5 years", "6–10 years", "10+ years"]
const EXP_TO_NUM: Record<string, number> = {
  "Less than 1 year": 0, "1–2 years": 1, "3–5 years": 3, "6–10 years": 6, "10+ years": 10,
}
const NUM_TO_EXP: Record<number, string> = Object.fromEntries(
  Object.entries(EXP_TO_NUM).map(([k, v]) => [v, k])
)

function authHeaders(token: string | null) {
  return { Authorization: `Bearer ${token}`, "Content-Type": "application/json" }
}

function toggleArr(arr: string[], val: string) {
  return arr.includes(val) ? arr.filter(v => v !== val) : [...arr, val]
}

export default function TutorProfilePage() {
  const { user, accessToken } = useAuthStore()
  const [profile, setProfile] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [saving,  setSaving]  = useState(false)

  // Editable fields
  const [firstName,    setFirstName]    = useState("")
  const [lastName,     setLastName]     = useState("")
  const [phone,        setPhone]        = useState("")
  const [bio,          setBio]          = useState("")
  const [qualifications, setQualifications] = useState("")
  const [expLabel,     setExpLabel]     = useState("")
  const [hourlyRate,   setHourlyRate]   = useState("")
  const [languages,    setLanguages]    = useState<string[]>([])
  const [imageUrl,     setImageUrl]     = useState("")
  const [fileUrl,      setFileUrl]      = useState("")
  const [payoutMethod, setPayoutMethod] = useState<"telebirr" | "bank" | "">("")
  const [payoutPhone,  setPayoutPhone]  = useState("")
  const [payoutBank,   setPayoutBank]   = useState("")
  const [payoutAccount,setPayoutAccount]= useState("")
  const [availDays,    setAvailDays]    = useState<string[]>([])
  const [availTimes,   setAvailTimes]   = useState<string[]>([])
  const [maxStudents,  setMaxStudents]  = useState(5)

  const load = useCallback(async () => {
    if (!accessToken) return
    try {
      const res  = await fetch(`${API_BASE}/tutors/my-profile`, { headers: authHeaders(accessToken) })
      const data = await res.json()
      if (!res.ok) throw new Error(data.message)
      const p = data.data
      setProfile(p)
      const [fn, ...ln] = (p.user.name ?? "").split(" ")
      setFirstName(fn ?? "")
      setLastName(ln.join(" "))
      setPhone(p.user.phone ?? "")
      setBio(p.bio ?? "")
      setQualifications(p.qualifications ?? "")
      setExpLabel(NUM_TO_EXP[p.experience_years] ?? "Less than 1 year")
      setHourlyRate(String(p.hourly_rate ?? ""))
      setLanguages(p.languages ? p.languages.split(",").map((l: string) => l.trim()) : [])
      setImageUrl(p.image_profile ?? "")
      setFileUrl(p.file ?? "")
      setPayoutMethod(p.payout_method ?? "")
      setPayoutPhone(p.payout_phone ?? "")
      setPayoutBank(p.payout_bank ?? "")
      setPayoutAccount(p.payout_account ?? "")
      setAvailDays(Array.isArray(p.available_days) ? p.available_days : [])
      setAvailTimes(Array.isArray(p.available_times) ? p.available_times : [])
      setMaxStudents(p.default_max_students ?? 5)
    } catch (err: any) {
      toast.error(err.message || "Could not load profile")
    } finally {
      setLoading(false)
    }
  }, [accessToken])

  useEffect(() => { load() }, [load])

  const handleSave = async () => {
    if (!accessToken) return
    setSaving(true)
    try {
      const res = await fetch(`${API_BASE}/tutors/profile`, {
        method: "PATCH",
        headers: authHeaders(accessToken),
        body: JSON.stringify({
          bio,
          qualifications,
          experience_years: EXP_TO_NUM[expLabel] ?? 0,
          hourly_rate:      Number(hourlyRate),
          languages:        languages.join(","),
          image_profile:    imageUrl || undefined,
          file:             fileUrl  || undefined,
          payout_method:    payoutMethod || undefined,
          payout_phone:     payoutPhone  || undefined,
          payout_bank:      payoutBank   || undefined,
          payout_account:   payoutAccount || undefined,
          available_days:   availDays,
          available_times:  availTimes,
          default_max_students: maxStudents,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.message)
      toast.success("Profile updated successfully!")
      load()
    } catch (err: any) {
      toast.error(err.message || "Failed to save")
    } finally {
      setSaving(false)
    }
  }

  if (loading) return (
    <div className="px-4 lg:px-6 space-y-6">
      <Skeleton className="h-8 w-48" />
      <Skeleton className="h-32 rounded-xl" />
      <Skeleton className="h-64 rounded-xl" />
      <Skeleton className="h-48 rounded-xl" />
    </div>
  )

  const initials = `${firstName[0] ?? ""}${lastName[0] ?? ""}`.toUpperCase() || "T"
  const subjects  = profile?.teacherSubjects?.map((ts: any) => ts.subject.name) ?? []

  return (
    <div className="px-4 lg:px-6 space-y-6 pb-12">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">My Profile</h1>
        <p className="text-muted-foreground text-sm">Manage your teaching profile, availability, and payout settings.</p>
      </div>

      {/* ── Profile summary card ── */}
      <Card>
        <CardContent className="pt-5">
          <div className="flex items-start gap-4 flex-wrap">
            <Avatar className="h-16 w-16 shrink-0 border-2 border-border">
              {imageUrl && <AvatarImage src={imageUrl} alt={`${firstName} ${lastName}`} />}
              <AvatarFallback className="bg-primary/10 text-primary text-xl font-bold">{initials}</AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <p className="text-lg font-bold">{firstName} {lastName}</p>
              <div className="flex items-center gap-1.5 text-sm text-muted-foreground mt-0.5">
                <Mail className="size-3.5" /> {profile?.user?.email}
              </div>
              {phone && (
                <div className="flex items-center gap-1.5 text-sm text-muted-foreground mt-0.5">
                  <Phone className="size-3.5" /> {phone}
                </div>
              )}
              <div className="flex flex-wrap gap-1.5 mt-2">
                {subjects.slice(0, 5).map((s: string) => (
                  <Badge key={s} variant="secondary" className="text-xs">{s}</Badge>
                ))}
              </div>
            </div>
            <div className="grid grid-cols-3 gap-3 text-center shrink-0">
              <div className="rounded-lg bg-muted/50 px-3 py-2">
                <p className="text-lg font-bold flex items-center justify-center gap-1">
                  <Star className="size-4 text-amber-400 fill-amber-400" />
                  {Number(profile?.average_rating ?? 0).toFixed(1)}
                </p>
                <p className="text-[10px] text-muted-foreground">Rating</p>
              </div>
              <div className="rounded-lg bg-muted/50 px-3 py-2">
                <p className="text-lg font-bold">{profile?.experience_years ?? 0}y</p>
                <p className="text-[10px] text-muted-foreground">Experience</p>
              </div>
              <div className="rounded-lg bg-muted/50 px-3 py-2">
                <p className="text-lg font-bold">{hourlyRate}</p>
                <p className="text-[10px] text-muted-foreground">ETB/hr</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* ── Profile Photo & Credentials ── */}
      <Card>
        <CardHeader>
          <CardTitle>Profile Photo & Credentials</CardTitle>
          <CardDescription>Your photo is shown to students. Credentials are reviewed by admins.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <FileUpload
            label="Profile Photo"
            accept="image/*"
            maxSizeMB={3}
            value={imageUrl}
            onChange={setImageUrl}
            hint="JPG or PNG, max 3MB"
          />
          <FileUpload
            label="Degree / Certificate"
            accept="image/*,application/pdf"
            maxSizeMB={5}
            value={fileUrl}
            onChange={setFileUrl}
            hint="PDF or image, max 5MB"
          />
        </CardContent>
      </Card>

      {/* ── Teaching Info ── */}
      <Card>
        <CardHeader>
          <CardTitle>Teaching Information</CardTitle>
          <CardDescription>Visible to students on your public profile.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Hourly Rate (ETB)</label>
              <Input
                type="number"
                min={50}
                value={hourlyRate}
                onChange={e => setHourlyRate(e.target.value)}
                placeholder="150"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Experience</label>
              <Select value={expLabel} onValueChange={setExpLabel}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {EXP_OPTIONS.map(o => <SelectItem key={o} value={o}>{o}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium">Qualifications</label>
            <Input
              value={qualifications}
              onChange={e => setQualifications(e.target.value)}
              placeholder="e.g. BSc Mathematics, Addis Ababa University"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium">Teaching Bio</label>
            <Textarea
              rows={4}
              value={bio}
              onChange={e => setBio(e.target.value)}
              placeholder="Tell students about your teaching style and background…"
            />
            <p className="text-xs text-muted-foreground">{bio.length} characters</p>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Languages You Teach In</label>
            <div className="flex flex-wrap gap-2">
              {LANGUAGES.map(lang => {
                const sel = languages.includes(lang)
                return (
                  <Badge
                    key={lang}
                    variant={sel ? "default" : "outline"}
                    className="cursor-pointer select-none text-xs px-3 py-1"
                    onClick={() => setLanguages(toggleArr(languages, lang))}
                  >
                    {sel && <CheckCircle2 className="size-3 mr-1" />}
                    {lang}
                  </Badge>
                )
              })}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* ── Availability ── */}
      <Card>
        <CardHeader>
          <CardTitle>Availability</CardTitle>
          <CardDescription>These days and times are used when you create new sessions.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          {/* Available days */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Available Days</label>
            <div className="flex gap-2 flex-wrap">
              {DAYS.map(day => {
                const sel = availDays.includes(day)
                return (
                  <div
                    key={day}
                    className={cn(
                      "flex h-9 w-12 items-center justify-center rounded-lg border-2 cursor-pointer text-xs font-semibold transition-all select-none",
                      sel ? "border-primary bg-primary text-primary-foreground" : "border-border hover:border-primary/50"
                    )}
                    onClick={() => setAvailDays(toggleArr(availDays, day))}
                  >
                    {day}
                  </div>
                )
              })}
            </div>
          </div>

          {/* Available time slots */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Available Time Slots</label>
            <div className="grid grid-cols-2 gap-2">
              {TIME_SLOTS.map(slot => {
                const sel = availTimes.includes(slot)
                return (
                  <div
                    key={slot}
                    className={cn(
                      "flex items-center gap-2 rounded-lg border px-3 py-2 cursor-pointer text-xs transition-all select-none",
                      sel ? "border-primary bg-primary/5 text-primary font-medium" : "border-border hover:border-primary/40"
                    )}
                    onClick={() => setAvailTimes(toggleArr(availTimes, slot))}
                  >
                    {sel ? <CheckCircle2 className="size-3 shrink-0 text-primary" /> : <div className="h-3 w-3 rounded-full border border-muted-foreground/40 shrink-0" />}
                    {slot}
                  </div>
                )
              })}
            </div>
          </div>

          {/* Default max students */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Default Max Students Per Session</label>
            <div className="flex gap-2 flex-wrap">
              {[1,2,3,4,5].map(n => (
                <div
                  key={n}
                  className={cn(
                    "flex h-10 w-10 items-center justify-center rounded-lg border-2 cursor-pointer text-sm font-bold transition-all select-none",
                    maxStudents === n ? "border-primary bg-primary text-primary-foreground" : "border-border hover:border-primary/50"
                  )}
                  onClick={() => setMaxStudents(n)}
                >
                  {n}
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* ── Payout Settings ── */}
      <Card>
        <CardHeader>
          <CardTitle>Payout Settings</CardTitle>
          <CardDescription>Where your earnings are sent after each session.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-3">
            {(["telebirr", "bank"] as const).map(method => (
              <div
                key={method}
                className={cn(
                  "flex-1 flex items-center gap-2 rounded-lg border-2 px-3 py-2.5 cursor-pointer text-sm transition-all",
                  payoutMethod === method ? "border-primary bg-primary/5" : "border-border hover:border-primary/40"
                )}
                onClick={() => setPayoutMethod(method)}
              >
                <Wallet className="size-4 text-muted-foreground" />
                <span className="font-medium capitalize">{method === "telebirr" ? "Telebirr" : "Bank Transfer"}</span>
              </div>
            ))}
          </div>

          {payoutMethod === "telebirr" && (
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Telebirr Phone Number</label>
              <Input value={payoutPhone} onChange={e => setPayoutPhone(e.target.value)} placeholder="09XXXXXXXX" />
            </div>
          )}

          {payoutMethod === "bank" && (
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-sm font-medium">Bank Name</label>
                <Input value={payoutBank} onChange={e => setPayoutBank(e.target.value)} placeholder="e.g. CBE, Awash" />
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium">Account Number</label>
                <Input value={payoutAccount} onChange={e => setPayoutAccount(e.target.value)} placeholder="Account number" />
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* ── Save button ── */}
      <div className="flex items-center gap-3 pb-4">
        <Button className="gap-2 px-8" disabled={saving} onClick={handleSave}>
          {saving ? <span className="size-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Save className="size-4" />}
          {saving ? "Saving…" : "Save Changes"}
        </Button>
      </div>
    </div>
  )
}
