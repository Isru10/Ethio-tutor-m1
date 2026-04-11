"use client";

import { useEffect, useState, Suspense } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { joinSessionApi } from "@/lib/services/sessionService";
import { useAuthStore } from "@/lib/store/useAuthStore";
import { API_BASE } from "@/lib/api";
import RoomView from "@/components/session/RoomView";
import { Loader2, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";



function SessionContent() {
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();
  const sessionId = params.id as string;
  const urlToken  = searchParams.get("token") || undefined;
  const urlServer = searchParams.get("url")   || undefined;

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sessionData, setSessionData] = useState<{
    token: string; serverUrl: string; roomName: string; scheduledEndTime?: Date
  } | null>(null);

  useEffect(() => {
    async function init() {
      if (!sessionId) return;
      try {
        setLoading(true);
        const raw = await fetch(`${API_BASE}/sessions/${sessionId}`, {
          headers: { Authorization: `Bearer ${useAuthStore.getState().accessToken ?? ""}` }
        });
        const body = await raw.json();
        const slot = body.data?.slot;
        // Build scheduled end time from session start_time + slot duration
        // This is correct even if the tutor starts late
        let scheduledEndTime: Date | undefined;
        if (body.data?.start_time && slot?.slot_date && slot?.start_time && slot?.end_time) {
          const slotStart = slot.start_time.slice(0, 5); // "HH:mm"
          const slotEnd   = slot.end_time.slice(0, 5);
          const [sh, sm]  = slotStart.split(":").map(Number);
          const [eh, em]  = slotEnd.split(":").map(Number);
          const durationMs = ((eh * 60 + em) - (sh * 60 + sm)) * 60 * 1000;
          // scheduledEnd = actual session start_time + planned duration
          const sessionActualStart = new Date(body.data.start_time);
          scheduledEndTime = new Date(sessionActualStart.getTime() + durationMs);
        }

        if (urlToken && urlServer) {
          const roomName = body.data?.room_name ?? sessionId;
          setSessionData({ token: urlToken, serverUrl: urlServer, roomName, scheduledEndTime });
          return;
        }

        // STUDENT path: call /join to get a participant token
        // TUTOR rejoin path: if user is a tutor, they need a fresh token via startSession
        // We detect tutor by checking if the session's teacher_id matches current user
        const currentUser = useAuthStore.getState().user;
        const isTutorRejoin = body.data?.teacher_id === currentUser?.user_id;

        if (isTutorRejoin) {
          // Tutor rejoining — find their confirmed booking for this slot and restart
          const slotId = body.data?.slot_id;
          const bookingRes = await fetch(`${API_BASE}/bookings/tutor`, {
            headers: { Authorization: `Bearer ${useAuthStore.getState().accessToken ?? ""}` }
          });
          const bookingBody = await bookingRes.json();
          const bookings: any[] = bookingBody.data ?? [];
          const match = bookings.find((b: any) =>
            (b.slot?.slot_id ?? b.slot_id) === slotId &&
            (b.status === "confirmed" || b.status === "completed")
          );
          if (!match) throw new Error("Could not find your booking to rejoin.");
          const startRes = await fetch(`${API_BASE}/sessions/start`, {
            method: "POST",
            headers: { Authorization: `Bearer ${useAuthStore.getState().accessToken ?? ""}`, "Content-Type": "application/json" },
            body: JSON.stringify({ bookingId: match.booking_id }),
          });
          const startBody = await startRes.json();
          if (!startRes.ok) throw new Error(startBody.message ?? "Failed to rejoin session");
          const d = startBody.data;
          setSessionData({ token: d.token, serverUrl: d.liveKitUrl, roomName: d.roomName, scheduledEndTime });
          return;
        }

        const data = await joinSessionApi(sessionId, urlToken);
        setSessionData({
          token:     data.token,
          serverUrl: data.liveKitUrl,
          roomName:  data.roomName,
          scheduledEndTime,
        });
      } catch (err: any) {
        setError(err.message || "Could not connect to the session.");
      } finally {
        setLoading(false);
      }
    }
    init();
  }, [sessionId]);

  if (loading) {
    return (
      <div className="w-full h-full flex items-center justify-center flex-col gap-4 bg-gray-50 text-gray-900">
        <Loader2 className="w-10 h-10 animate-spin text-blue-600" />
        <h2 className="text-xl font-semibold">Connecting to securely encrypted session...</h2>
        <p className="text-gray-500">Authenticating with LiveKit and loading Whiteboard</p>
      </div>
    );
  }

  if (error || !sessionData) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-gray-50 p-4">
        <div className="max-w-md w-full bg-white rounded-xl shadow-lg border border-red-100 p-8 text-center flex flex-col items-center">
          <div className="w-16 h-16 bg-red-100 text-red-600 rounded-full flex items-center justify-center mb-6">
            <AlertCircle className="w-8 h-8" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Access Denied</h2>
          <p className="text-gray-600 mb-8">{error}</p>
          <Button onClick={() => router.push("/dashboard")} className="w-full">
            Return to Dashboard
          </Button>
        </div>
      </div>
    );
  }

  return (
    <RoomView 
      token={sessionData.token} 
      serverUrl={sessionData.serverUrl} 
      roomName={sessionData.roomName}
      sessionId={sessionId}
      scheduledEndTime={sessionData.scheduledEndTime}
    />
  );
}

export default function SessionPage() {
  return (
    <Suspense fallback={<div className="w-full h-full flex items-center justify-center"><Loader2 className="animate-spin" /></div>}>
      <SessionContent />
    </Suspense>
  )
}
