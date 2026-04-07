"use client";

import { useEffect, useState, Suspense } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { joinSessionApi } from "@/lib/services/sessionService";
import { useAuthStore } from "@/lib/store/useAuthStore";
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
  const [sessionData, setSessionData] = useState<{ token: string; serverUrl: string; roomName: string } | null>(null);

  useEffect(() => {
    async function init() {
      if (!sessionId) return;
      
      try {
        setLoading(true);

        // TUTOR path: token already in URL (from startSessionApi redirect)
        if (urlToken && urlServer) {
          // fetch roomName from backend so we can label it
          const raw = await fetch(`http://localhost:5000/api/v1/sessions/${sessionId}`, {
            headers: { Authorization: `Bearer ${useAuthStore.getState().accessToken ?? ""}` }
          });
          const body = await raw.json();
          const roomName = body.data?.room_name ?? sessionId;
          setSessionData({ token: urlToken, serverUrl: urlServer, roomName });
          return;
        }

        // STUDENT path: call /join to get a participant token
        const data = await joinSessionApi(sessionId, urlToken);
        setSessionData({
          token:     data.token,
          serverUrl: data.liveKitUrl,
          roomName:  data.roomName
        });
      } catch (err: any) {
        console.error("Failed to join session:", err);
        setError(err.message || "Could not connect to the session. Are you sure you have a confirmed booking?");
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
