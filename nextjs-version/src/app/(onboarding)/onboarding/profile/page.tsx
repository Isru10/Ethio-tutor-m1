"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useAuthStore } from "@/lib/store/useAuthStore"
import { API_BASE } from "@/lib/api"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { AlertCircle, ShieldX, Send, Loader2, CheckCircle2 } from "lucide-react"
import { toast } from "sonner"

function authHeaders() {
  return { Authorization: `Bearer ${useAuthStore.getState().accessToken}`, "Content-Type": "application/json" }
}

const STATUS_BANNER: Record<string, { icon: React.ElementType; bg: string; text: string; label: string }> = {
  pending_info: {
    icon: AlertCircle,
    bg:   "bg-amber-50 border-amber-200 dark:bg-amber-950/20 dark:border-amber-800",
    text: "text-amber-800 dark:text-amber-300",
    label: "More Info Required",
  },
  rejected: {
    icon: ShieldX,
    bg:   "bg-red-50 border-red-200 dark:bg-red-950/20 dark:border-red-800",
    text: "text-red-800 dark:text-red-300",
    label: "Profile Rejected",
  },
}

export default function OnboardingProfilePage() {
  const { user }    = useAuthStore()
  const router      = useRouter()
  const [profile, setProfile]     = useState<any>(null)
  const [loading, setLoading]     = useState(true)
  const [saving, setSaving]       = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [done, setDone]           = useState(false)

  const [form, setForm] = useState({
    bio:              "",
    qualifications:   "",
    experience_years: 0,
    languages:        "",
    hourly_rate:      0,
    payout_phone:     "",
  })

  useEffect(() => {
    if (!user) return
    fetch(`${API_BASE}/tutors/${user.user_id}`, { headers: authHeaders() })
      .then(r => r.json())
      .then(res => {
        const p = res.data
        setProfile(p)
        setForm({
          bio:              p.bio ?? "",
          qualifications:   p.qualifications ?? "",
          experience_years: p.experience_years ?? 0,
          languages:        p.languages ?? "",
          hourly_rate:      Number(p.hourly_rate ?? 0),
          payout_phone:     p.payout_phone ?? "",
        })
      })
      .finally(() => setLoading(false))
  }, [user])

  const handleSave = async () => {
    setSaving(true)
    try {
      const res  = await fetch(`${API_BASE}/tutors/profile`, {
        method: "PATCH",
        headers: authHeaders(),
        body: JSON.stringify(form),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.message)
      toast.success("Profile updated")
      setProfile((p: any) => ({ ...p, ...form }))
    } catch (err: any) {
      toast.error(err.message)
    } finally {
      setSaving(false)
    }
  }

  const handleResubmit = async () => {
    // Save first, then resubmit
    setSaving(true)
    try {
      await fetch(`${API_BASE}/tutors/profile`, {
        method: "PATCH",
        headers: authHeaders(),
        body: JSON.stringify(form),
      })
    } catch { /* ignore save errors, still try resubmit */ }
    setSaving(false)

    setSubmitting(true)
    try {
      const res  = await fetch(`${API_BASE}/tutors/resubmit`, {
        method: "POST",
        headers: authHeaders(),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.message)
      setDone(true)
      toast.success("Profile resubmitted! Our team will review it shortly.")
      setTimeout(() => router.push("/onboarding"), 2000)
    } catch (err: any) {
      toast.error(err.message)
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) return (
    <div className="px-4 lg:px-6 max-w-2xl mx-auto space-y-4">
      <Skeleton className="h-8 w-48" />
      <Skeleton className="h-24 rounded-xl" />
      <Skeleton className="h-64 rounded-xl" />
    </div>
  )

  const status     = profile?.verification_status
  const note       = profile?.verification_note
  const banner     = STATUS_BANNER[status]
  const canResubmit = status === "pending_info" || status === "rejected"

  if (done) return (
    <div className="px-4 lg:px-6 max-w-2xl mx-auto">
      <Card>
        <CardContent className="flex flex-col items-center gap-4 py-16 text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-green-100 dark:bg-green-950/30">
            <CheckCircle2 className="size-9 text-green-600" />
          </div>
          <h2 className="text-xl font-bold">Resubmitted!</h2>
          <p className="text-muted-foreground text-sm max-w-xs">
            Your updated profile has been sent for review. You&apos;ll be notified once a decision is made.
          </p>
        </CardContent>
      </Card>
    </div>
  )

  return (
    <div className="px-4 lg:px-6 max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Update Your Profile</h1>
        <p className="text-muted-foreground text-sm mt-0.5">
          Make the requested changes and resubmit for review.
        </p>
      </div>

      {/* Status banner with reviewer note */}
      {banner && (
        <div className={`rounded-xl border p-4 flex items-start gap-3 ${banner.bg}`}>
          <banner.icon className={`size-5 shrink-0 mt-0.5 ${banner.text}`} />
          <div>
            <p className={`font-semibold text-sm ${banner.text}`}>{banner.label}</p>
            {note && (
              <p className={`text-sm mt-1 leading-relaxed ${banner.text}`}>
                <span className="font-medium">Reviewer note: </span>{note}
              </p>
            )}
          </div>
        </div>
      )}

      {/* Edit form */}
      <Card>
        <CardHeader className="pb-4">
          <CardTitle className="text-base">Profile Information</CardTitle>
          <CardDescription>Update the fields below based on the reviewer&apos;s feedback.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-1.5">
            <Label>Bio <span className="text-muted-foreground font-normal text-xs">(min 30 chars)</span></Label>
            <Textarea
              rows={4} className="resize-none"
              placeholder="Tell students about your teaching style and background…"
              value={form.bio}
              onChange={e => setForm(f => ({ ...f, bio: e.target.value }))}
            />
            <p className="text-xs text-muted-foreground">{form.bio.length} characters</p>
          </div>

          <div className="space-y-1.5">
            <Label>Qualifications</Label>
            <Input
              placeholder="e.g. BSc Mathematics, Addis Ababa University"
              value={form.qualifications}
              onChange={e => setForm(f => ({ ...f, qualifications: e.target.value }))}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Experience (years)</Label>
              <Input
                type="number" min={0}
                value={form.experience_years}
                onChange={e => setForm(f => ({ ...f, experience_years: Number(e.target.value) }))}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Hourly Rate (ETB)</Label>
              <Input
                type="number" min={50}
                value={form.hourly_rate}
                onChange={e => setForm(f => ({ ...f, hourly_rate: Number(e.target.value) }))}
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label>Languages <span className="text-muted-foreground font-normal text-xs">(comma separated)</span></Label>
            <Input
              placeholder="Amharic, English"
              value={form.languages}
              onChange={e => setForm(f => ({ ...f, languages: e.target.value }))}
            />
          </div>

          <div className="space-y-1.5">
            <Label>Telebirr Payout Number</Label>
            <Input
              placeholder="09XXXXXXXX"
              value={form.payout_phone}
              onChange={e => setForm(f => ({ ...f, payout_phone: e.target.value }))}
            />
          </div>
        </CardContent>
      </Card>

      {/* Actions */}
      <div className="flex gap-3 justify-end">
        <Button variant="outline" onClick={handleSave} disabled={saving || submitting}>
          {saving ? <Loader2 className="size-4 animate-spin mr-2" /> : null}
          Save Draft
        </Button>
        {canResubmit && (
          <Button onClick={handleResubmit} disabled={saving || submitting} className="gap-2">
            {submitting ? <Loader2 className="size-4 animate-spin" /> : <Send className="size-4" />}
            {submitting ? "Submitting…" : "Save & Resubmit for Review"}
          </Button>
        )}
      </div>
    </div>
  )
}
