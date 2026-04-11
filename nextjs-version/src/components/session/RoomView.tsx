"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import {
  LiveKitRoom, VideoConference, RoomAudioRenderer,
} from "@livekit/components-react";
import "@livekit/components-styles";
import LiveKitWhiteboard from "./LiveKitWhiteboard";
import { Button } from "@/components/ui/button";
import { Presentation, Video, StopCircle, Loader2 } from "lucide-react";
import { useAuthStore } from "@/lib/store/useAuthStore";
import { API_BASE } from "@/lib/api";
import { toast } from "sonner";

interface RoomViewProps {
  token: string;
  serverUrl: string;
  roomName: string;
  sessionId?: string | number;
  scheduledEndTime?: Date;
}

function useElapsedTimer(startedAt: Date) {
  const [elapsed, setElapsed] = useState(0);
  useEffect(() => {
    const id = setInterval(
      () => setElapsed(Math.floor((Date.now() - startedAt.getTime()) / 1000)),
      1000
    );
    return () => clearInterval(id);
  }, [startedAt]);
  const m = Math.floor(elapsed / 60).toString().padStart(2, "0");
  const s = (elapsed % 60).toString().padStart(2, "0");
  return { display: `${m}:${s}`, seconds: elapsed };
}

function useCountdown(endTime?: Date) {
  const [remaining, setRemaining] = useState<number | null>(null);
  useEffect(() => {
    if (!endTime) return;
    const tick = () =>
      setRemaining(Math.max(0, Math.floor((endTime.getTime() - Date.now()) / 1000)));
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [endTime]);
  return remaining;
}

export default function RoomView({
  token, serverUrl, roomName, sessionId, scheduledEndTime,
}: RoomViewProps) {
  const [mode, setMode] = useState<"whiteboard" | "video">("whiteboard");
  const [ending, setEnding] = useState(false);
  const { user } = useAuthStore();
  const isTutor = user?.role === "TUTOR";
  const sessionStart = useRef(new Date());
  const { display: elapsed } = useElapsedTimer(sessionStart.current);
  const remaining = useCountdown(scheduledEndTime);

  const warned5 = useRef(false);
  const warned1 = useRef(false);
  const autoEnded = useRef(false);

  const endSession = useCallback(async () => {
    if (!sessionId || autoEnded.current) return;
    autoEnded.current = true;
    setEnding(true);
    try {
      const res = await fetch(`${API_BASE}/sessions/${sessionId}/end`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${useAuthStore.getState().accessToken}`,
          "Content-Type": "application/json",
        },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message ?? "Failed to end session");
      window.location.href = isTutor
        ? "/tutor/tutor-dashboard"
        : `/review/${sessionId}`;
    } catch (err: any) {
      toast.error(err.message);
      autoEnded.current = false;
      setEnding(false);
    }
  }, [sessionId, isTutor]);

  // 5-min warning + auto-end
  useEffect(() => {
    if (remaining === null) return;
    if (remaining <= 300 && remaining > 60 && !warned5.current) {
      warned5.current = true;
      toast.warning("Session ends in 5 minutes", {
        description: isTutor ? "Click 'End Session' to close the room." : "The session will end soon.",
        duration: 8000,
      });
    }
    if (remaining <= 60 && remaining > 0 && !warned1.current) {
      warned1.current = true;
      toast.warning("Session ends in 1 minute", { duration: 10000 });
    }
    if (remaining === 0 && !autoEnded.current) {
      toast.info("Session time is up. Ending automatically…");
      if (isTutor) {
        endSession();
      } else {
        setTimeout(() => { window.location.href = `/review/${sessionId}`; }, 2000);
      }
    }
  }, [remaining, isTutor, endSession, sessionId]);

  const handleEndSession = async () => {
    if (!confirm(`End session after ${elapsed}? Students will be redirected to leave a review.`)) return;
    await endSession();
  };

  const countdownDisplay = remaining !== null
    ? `${Math.floor(remaining / 60).toString().padStart(2, "0")}:${(remaining % 60).toString().padStart(2, "0")}`
    : null;
  const isNearEnd = remaining !== null && remaining <= 300;

  return (
    <LiveKitRoom
      token={token}
      serverUrl={serverUrl}
      data-lk-theme="default"
      className="flex flex-col h-screen w-screen bg-gray-950"
      onDisconnected={() => {
        if (!autoEnded.current) {
          window.location.href = isTutor ? "/tutor/tutor-dashboard" : "/dashboard";
        }
      }}
    >
      <header className="flex items-center justify-between px-5 py-3 bg-gray-900 text-white shadow-md shrink-0 border-b border-gray-800">
        <div className="flex items-center gap-3">
          <div className="px-3 py-1 bg-red-500/10 text-red-400 rounded-full text-xs font-bold uppercase tracking-wider flex items-center gap-1.5">
            <span className="inline-block h-2 w-2 rounded-full bg-red-500 animate-pulse" />
            LIVE
          </div>
          <h1 className="text-base font-semibold text-white">
            {roomName.split("-").slice(0, 3).join(" ")}
          </h1>
          <span className="text-xs font-mono text-gray-400 bg-gray-800 px-2 py-0.5 rounded">
            {elapsed}
          </span>
          {countdownDisplay && (
            <span className={`text-xs font-mono px-2 py-0.5 rounded ${isNearEnd ? "bg-red-900/60 text-red-300 animate-pulse" : "bg-gray-800 text-gray-400"}`}>
              -{countdownDisplay}
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant={mode === "whiteboard" ? "default" : "outline"}
            className="gap-1.5 text-xs"
            onClick={() => setMode("whiteboard")}
          >
            <Presentation className="size-3.5" /> Whiteboard
          </Button>
          <Button
            size="sm"
            variant={mode === "video" ? "default" : "outline"}
            className="gap-1.5 text-xs"
            onClick={() => setMode("video")}
          >
            <Video className="size-3.5" /> Video Only
          </Button>
          {isTutor && (
            <Button
              size="sm"
              disabled={ending}
              className="gap-1.5 text-xs bg-red-600 hover:bg-red-700 text-white border-0 ml-2"
              onClick={handleEndSession}
            >
              {ending
                ? <Loader2 className="size-3.5 animate-spin" />
                : <StopCircle className="size-3.5" />}
              {ending ? "Ending…" : "End Session"}
            </Button>
          )}
        </div>
      </header>

      <main className="flex flex-1 overflow-hidden">
        {mode === "whiteboard" && (
          <div className="flex-1 h-full border-r border-gray-800 relative">
            <LiveKitWhiteboard />
          </div>
        )}
        <div className={`h-full bg-gray-950 flex flex-col ${mode === "whiteboard" ? "w-80 shrink-0" : "w-full"}`}>
          <VideoConference />
        </div>
      </main>

      <RoomAudioRenderer />
    </LiveKitRoom>
  );
}
