"use client"

import { useState, useEffect } from "react"
import { z } from "zod"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { CalendarDays, Clock, Loader2, Pencil } from "lucide-react"
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { slotService } from "@/lib/services/slotService"
import { toast } from "sonner"

const schema = z.object({
  slot_date:   z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Required"),
  start_time:  z.string().regex(/^\d{2}:\d{2}$/, "Required"),
  end_time:    z.string().regex(/^\d{2}:\d{2}$/, "Required"),
  description: z.string().max(500).optional(),
}).refine(d => d.start_time < d.end_time, {
  message: "End time must be after start time",
  path: ["end_time"],
})

type FormValues = z.infer<typeof schema>

interface Slot {
  slot_id: number
  slot_date: string
  start_time: string
  end_time: string
  description?: string | null
  subject: { name: string }
}

interface Props {
  slot: Slot | null
  open: boolean
  onOpenChange: (v: boolean) => void
  onUpdated: () => void
}

export function EditSlotDialog({ slot, open, onOpenChange, onUpdated }: Props) {
  const [saving, setSaving] = useState(false)

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { slot_date: "", start_time: "", end_time: "", description: "" },
  })

  // Populate form when slot changes
  useEffect(() => {
    if (!slot) return
    form.reset({
      slot_date:   slot.slot_date.split("T")[0],
      start_time:  slot.start_time.slice(0, 5),
      end_time:    slot.end_time.slice(0, 5),
      description: slot.description ?? "",
    })
  }, [slot, form])

  const handleSubmit = async (data: FormValues) => {
    if (!slot) return
    setSaving(true)
    try {
      await slotService.updateSlot(slot.slot_id, {
        slot_date:   data.slot_date,
        start_time:  data.start_time,
        end_time:    data.end_time,
        description: data.description || undefined,
      })
      toast.success("Session schedule updated")
      onOpenChange(false)
      onUpdated()
    } catch (err: any) {
      toast.error(err.message)
    } finally {
      setSaving(false)
    }
  }

  if (!slot) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Pencil className="size-4" /> Edit Session Schedule
          </DialogTitle>
          <DialogDescription>
            Update the date, time, or description for <strong>{slot.subject.name}</strong>.
            Enrolled students will not be automatically notified — consider messaging them.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4 py-2">
            <FormField control={form.control} name="slot_date" render={({ field }) => (
              <FormItem>
                <FormLabel className="flex items-center gap-1.5">
                  <CalendarDays className="size-3.5" /> Date
                </FormLabel>
                <FormControl>
                  <Input type="date" min={new Date().toISOString().split("T")[0]} {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )} />

            <div className="grid grid-cols-2 gap-3">
              <FormField control={form.control} name="start_time" render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center gap-1.5">
                    <Clock className="size-3.5" /> Start
                  </FormLabel>
                  <FormControl><Input type="time" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="end_time" render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center gap-1.5">
                    <Clock className="size-3.5" /> End
                  </FormLabel>
                  <FormControl><Input type="time" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
            </div>

            <FormField control={form.control} name="description" render={({ field }) => (
              <FormItem>
                <FormLabel>Description <span className="text-muted-foreground font-normal text-xs">(optional)</span></FormLabel>
                <FormControl>
                  <textarea
                    rows={3}
                    placeholder="What will students learn?"
                    className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring resize-none"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )} />

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
              <Button type="submit" disabled={saving} className="gap-2">
                {saving ? <Loader2 className="size-4 animate-spin" /> : <Pencil className="size-4" />}
                {saving ? "Saving…" : "Save Changes"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
