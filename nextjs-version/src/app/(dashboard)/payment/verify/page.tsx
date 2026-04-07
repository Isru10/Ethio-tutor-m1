"use client"

import { useEffect, useState } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import { CheckCircle2, XCircle, Loader2, Calendar, ArrowRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { paymentService } from "@/lib/services/paymentService"

type VerifyState = "loading" | "paid" | "failed" | "error"

export default function PaymentVerifyPage() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const txRef = searchParams.get("tx_ref")

  const [state, setState] = useState<VerifyState>("loading")
  const [bookingId, setBookingId] = useState<number | null>(null)
  const [errorMsg, setErrorMsg] = useState<string>("")

  useEffect(() => {
    if (!txRef) { setState("error"); setErrorMsg("No transaction reference found."); return }

    paymentService.verify(txRef)
      .then((result) => {
        setBookingId(result.bookingId)
        setState(result.status === "paid" ? "paid" : "failed")
      })
      .catch((err) => {
        setState("error")
        setErrorMsg(err.message ?? "Verification failed. Please contact support.")
      })
  }, [txRef])

  return (
    <div className="min-h-screen bg-muted/30 flex items-center justify-center px-4">
      <Card className="w-full max-w-md">
        <CardContent className="pt-10 pb-10">

          {/* ── Loading ── */}
          {state === "loading" && (
            <div className="flex flex-col items-center gap-4 text-center">
              <Loader2 className="size-14 text-primary animate-spin" />
              <h2 className="text-xl font-bold">Verifying your payment…</h2>
              <p className="text-sm text-muted-foreground">Please wait, do not close this page.</p>
            </div>
          )}

          {/* ── Success ── */}
          {state === "paid" && (
            <div className="flex flex-col items-center gap-5 text-center">
              <div className="flex h-20 w-20 items-center justify-center rounded-full bg-green-100 dark:bg-green-950/30">
                <CheckCircle2 className="size-11 text-green-600" />
              </div>
              <div className="space-y-1">
                <h2 className="text-2xl font-bold">Payment Successful!</h2>
                <p className="text-sm text-muted-foreground">
                  Your booking is confirmed. The tutor will start the session at the scheduled time.
                </p>
              </div>
              {txRef && (
                <p className="text-xs text-muted-foreground bg-muted rounded-lg px-3 py-1.5 font-mono">
                  Ref: {txRef}
                </p>
              )}
              <div className="flex flex-col gap-2 w-full pt-2">
                <Button className="w-full gap-2" onClick={() => router.push("/sessions")}>
                  <Calendar className="size-4" />
                  View My Sessions
                </Button>
                <Button variant="outline" className="w-full gap-2" onClick={() => router.push("/bookings")}>
                  View All Bookings <ArrowRight className="size-4" />
                </Button>
              </div>
            </div>
          )}

          {/* ── Failed ── */}
          {(state === "failed" || state === "error") && (
            <div className="flex flex-col items-center gap-5 text-center">
              <div className="flex h-20 w-20 items-center justify-center rounded-full bg-red-100 dark:bg-red-950/30">
                <XCircle className="size-11 text-red-500" />
              </div>
              <div className="space-y-1">
                <h2 className="text-2xl font-bold">Payment Failed</h2>
                <p className="text-sm text-muted-foreground">
                  {state === "error"
                    ? errorMsg
                    : "Your payment could not be completed. Your booking has been cancelled and no charge was made."}
                </p>
              </div>
              {txRef && (
                <p className="text-xs text-muted-foreground bg-muted rounded-lg px-3 py-1.5 font-mono">
                  Ref: {txRef}
                </p>
              )}
              <div className="rounded-xl border border-amber-200 bg-amber-50 dark:bg-amber-950/20 dark:border-amber-800 px-4 py-3 text-sm text-amber-800 dark:text-amber-300 text-left space-y-1 w-full">
                <p className="font-semibold">What happened?</p>
                <ul className="list-disc list-inside space-y-0.5 text-xs">
                  <li>Internet or power interruption during checkout</li>
                  <li>Payment was declined by your bank</li>
                  <li>Session timed out on the payment page</li>
                </ul>
              </div>
              <div className="flex flex-col gap-2 w-full pt-2">
                <Button className="w-full gap-2" onClick={() => router.push("/browse")}>
                  Try Booking Again
                </Button>
                <Button variant="outline" className="w-full" onClick={() => router.push("/dashboard")}>
                  Back to Dashboard
                </Button>
              </div>
            </div>
          )}

        </CardContent>
      </Card>
    </div>
  )
}
