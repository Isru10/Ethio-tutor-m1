"use client"

import { useEffect, useState, useCallback } from "react"
import { useAuthStore } from "@/lib/store/useAuthStore"
import { API_BASE } from "@/lib/api"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { Wallet, ShieldAlert, CheckCircle2, Loader2 } from "lucide-react"
import { toast } from "sonner"

function authHeaders() {
  const token = useAuthStore.getState().accessToken
  return { Authorization: `Bearer ${token}`, "Content-Type": "application/json" }
}

async function apiPost(url: string) {
  const res = await fetch(url, { method: "POST", headers: authHeaders() })
  const data = await res.json()
  if (!res.ok) throw new Error(data.message ?? "Request failed")
  return data
}

export default function AdminPayoutsPage() {
  const { user } = useAuthStore()
  const [payouts, setPayouts] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [actionId, setActionId] = useState<number | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    const res = await fetch(`${API_BASE}/transactions/admin/payouts/eligible`, { headers: authHeaders() })
    const data = await res.json()
    setPayouts(data.data ?? [])
    setLoading(false)
  }, [])

  useEffect(() => { if (user) load() }, [user, load])

  const handle = async (id: number, action: "release" | "dispute") => {
    try {
      setActionId(id)
      await apiPost(`${API_BASE}/transactions/admin/payouts/${id}/${action}`)
      toast.success(action === "release" ? "Payout sent to tutor via Telebirr" : "Transaction flagged as disputed")
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
        <h1 className="text-2xl font-bold tracking-tight">Eligible Payouts</h1>
        <p className="text-muted-foreground text-sm">Sessions completed 24h+ ago. Release or dispute each payout.</p>
      </div>

      <div className="px-4 lg:px-6">
        {loading ? (
          <div className="space-y-3">
            {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-20 rounded-xl" />)}
          </div>
        ) : payouts.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-16 gap-3">
              <Wallet className="size-10 text-muted-foreground/30" />
              <p className="text-muted-foreground text-sm">No eligible payouts right now.</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {payouts.map((tx: any) => (
              <Card key={tx.transaction_id}>
                <CardContent className="pt-4 pb-4">
                  <div className="flex items-center justify-between gap-4 flex-wrap">
                    <div className="space-y-0.5">
                      <p className="font-semibold text-sm">{tx.teacher?.user?.name ?? "Tutor"}</p>
                      <p className="text-xs text-muted-foreground">
                        {tx.booking?.slot?.subject?.name} · Student: {tx.student?.user?.name}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Telebirr: {tx.teacher?.payout_phone ?? "not set"}
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="text-right">
                        <p className="font-bold text-base">{Number(tx.teacher_earnings).toFixed(0)} ETB</p>
                        <p className="text-xs text-muted-foreground">85% of {Number(tx.total_amount).toFixed(0)} ETB</p>
                      </div>
                      <Button
                        size="sm"
                        className="gap-1.5 bg-green-600 hover:bg-green-700 text-white"
                        disabled={actionId === tx.transaction_id}
                        onClick={() => handle(tx.transaction_id, "release")}
                      >
                        {actionId === tx.transaction_id
                          ? <Loader2 className="size-3.5 animate-spin" />
                          : <CheckCircle2 className="size-3.5" />}
                        Release
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="gap-1.5 text-destructive border-destructive/40 hover:bg-destructive/10"
                        disabled={actionId === tx.transaction_id}
                        onClick={() => handle(tx.transaction_id, "dispute")}
                      >
                        <ShieldAlert className="size-3.5" />
                        Dispute
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
