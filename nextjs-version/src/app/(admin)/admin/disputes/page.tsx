"use client"

import { useEffect, useState, useCallback } from "react"
import { useAuthStore } from "@/lib/store/useAuthStore"
import { API_BASE } from "@/lib/api"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { ShieldAlert, ThumbsUp, ThumbsDown, Loader2 } from "lucide-react"
import { toast } from "sonner"
import { PermissionGuard } from "@/components/permission-guard"

function authHeaders() {
  const token = useAuthStore.getState().accessToken
  return { Authorization: `Bearer ${token}`, "Content-Type": "application/json" }
}

export default function AdminDisputesPage() {
  return (
    <PermissionGuard permission="manage_disputes">
      <DisputesContent />
    </PermissionGuard>
  )
}

function DisputesContent() {
  const { user } = useAuthStore()
  const [disputes, setDisputes] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [actionId, setActionId] = useState<number | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    const res = await fetch(`${API_BASE}/transactions/admin/all?status=paid`, { headers: authHeaders() })
    const data = await res.json()
    setDisputes((data.data ?? []).filter((t: any) => t.payout_status === "disputed"))
    setLoading(false)
  }, [])

  useEffect(() => { if (user) load() }, [user, load])

  const resolve = async (id: number, side: "tutor" | "student") => {
    try {
      setActionId(id)
      const res = await fetch(`${API_BASE}/transactions/admin/payouts/${id}/resolve-${side}`, {
        method: "POST", headers: authHeaders(),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.message)
      toast.success(side === "tutor" ? "Resolved: payout sent to tutor" : "Resolved: student refunded")
      load()
    } catch (err: any) {
      toast.error(err.message)
    } finally {
      setActionId(null)
    }
  }

  return (
    <>
      <div className="px-4 lg:px-6">
        <h1 className="text-2xl font-bold tracking-tight">Disputes</h1>
        <p className="text-muted-foreground text-sm">Transactions flagged for review. Resolve in favour of tutor or student.</p>
      </div>

      <div className="px-4 lg:px-6">
        {loading ? (
          <div className="space-y-3">
            {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-20 rounded-xl" />)}
          </div>
        ) : disputes.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-16 gap-3">
              <ShieldAlert className="size-10 text-muted-foreground/30" />
              <p className="text-muted-foreground text-sm">No active disputes.</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {disputes.map((tx: any) => (
              <Card key={tx.transaction_id}>
                <CardContent className="pt-4 pb-4">
                  <div className="flex items-center justify-between gap-4 flex-wrap">
                    <div className="space-y-0.5">
                      <p className="font-semibold text-sm">
                        {tx.student?.user?.name} vs {tx.teacher?.user?.name}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {tx.booking?.slot?.subject?.name} · {Number(tx.total_amount).toFixed(0)} ETB paid
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Tutor Telebirr: {tx.teacher?.payout_phone ?? "not set"}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        className="gap-1.5 bg-green-600 hover:bg-green-700 text-white"
                        disabled={actionId === tx.transaction_id}
                        onClick={() => resolve(tx.transaction_id, "tutor")}
                      >
                        {actionId === tx.transaction_id ? <Loader2 className="size-3.5 animate-spin" /> : <ThumbsUp className="size-3.5" />}
                        Pay Tutor
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="gap-1.5 text-destructive border-destructive/40 hover:bg-destructive/10"
                        disabled={actionId === tx.transaction_id}
                        onClick={() => resolve(tx.transaction_id, "student")}
                      >
                        <ThumbsDown className="size-3.5" />
                        Refund Student
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </>
  )
}
