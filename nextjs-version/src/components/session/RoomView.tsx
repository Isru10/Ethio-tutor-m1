"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import {
  LiveKitRoom, VideoConference, RoomAudioRenderer,
} from "@livekit/components-react";
import "@livekit/components-styles";
import LiveKitWhiteboard from "./LiveKitWhiteboard";
import { Button } from "@/components/ui/button";
import { Presentation, Video, StopCircle, Loader2, ChevronUp, Users } from "lucide-react";
import { cn } from "@/lib/utils";
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
  return { display: `${m}:${s}` };
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
  const [isVideoExpanded, setIsVideoExpanded] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [ending, setEnding] = useState(false);

  const { user } = useAuthStore();
  const isTutor = user?.role === "TUTOR";
  const sessionStart = useRef(new Date());
  const { display: elapsed } = useElapsedTimer(sessionStart.current);
  const remaining = useCountdown(scheduledEndTime);
  const warned5 = useRef(false);
  const warned1 = useRef(false);
  const autoEnded = useRef(false);

  // Detect mobile viewport
  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  // Reset video expand when switching to video-only mode
  useEffect(() => {
    if (mode === "video") setIsVideoExpanded(false);
  }, [mode]);

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
      window.location.href = isTutor ? "/tutor/tutor-dashboard" : `/review/${sessionId}`;
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
      className="flex flex-col h-screen w-screen bg-gray-950 overflow-hidden"
      onDisconnected={() => {
        if (!autoEnded.current) {
          window.location.href = isTutor ? "/tutor/tutor-dashboard" : "/dashboard";
        }
      }}
    >
      {/* ── HEADER ── */}
      <header className="flex items-center justify-between px-3 sm:px-5 py-2 sm:py-3 bg-gray-900 text-white shadow-md shrink-0 border-b border-gray-800">
        <div className="flex items-center gap-2 sm:gap-3">
          <div className="px-2 sm:px-3 py-1 bg-red-500/10 text-red-400 rounded-full text-[10px] sm:text-xs font-bold uppercase tracking-wider flex items-center gap-1 sm:gap-1.5">
            <span className="inline-block h-1.5 w-1.5 sm:h-2 sm:w-2 rounded-full bg-red-500 animate-pulse" />
            LIVE
          </div>
          <h1 className="text-sm sm:text-base font-semibold text-white truncate max-w-[100px] sm:max-w-none">
            {roomName.split("-").slice(0, 3).join(" ")}
          </h1>
          {/* Elapsed timer */}
          <span className="text-xs font-mono text-gray-400 bg-gray-800 px-2 py-0.5 rounded hidden sm:inline">
            {elapsed}
          </span>
          {/* Countdown */}
          {countdownDisplay && (
            <span className={`text-xs font-mono px-2 py-0.5 rounded hidden sm:inline ${isNearEnd ? "bg-red-900/60 text-red-300 animate-pulse" : "bg-gray-800 text-gray-400"}`}>
              -{countdownDisplay}
            </span>
          )}
        </div>

        <div className="flex items-center gap-1 sm:gap-2">
          {/* Show video button — mobile only, whiteboard mode, video hidden */}
          {isMobile && mode === "whiteboard" && !isVideoExpanded && (
            <Button
              size="sm"
              variant="outline"
              className="gap-1 text-[10px] h-7 px-2 border-gray-600 text-gray-300 hover:text-white hover:bg-gray-800"
              onClick={() => setIsVideoExpanded(true)}
            >
              <Users className="size-3" /> Video
            </Button>
          )}

          <Button
            size="sm"
            variant={mode === "whiteboard" ? "default" : "outline"}
            className={cn(
              "gap-1 sm:gap-1.5 text-[10px] sm:text-xs h-7 sm:h-8 px-2 sm:px-3",
              mode === "whiteboard"
                ? "bg-blue-600 hover:bg-blue-700 text-white border-blue-600"
                : "border-gray-600 text-gray-300 hover:text-white hover:bg-gray-800"
            )}
            onClick={() => { setMode("whiteboard"); setIsVideoExpanded(false); }}
          >
            <Presentation className="size-3 sm:size-3.5" />
            <span className="hidden sm:inline">Whiteboard</span>
            <span className="sm:hidden">Board</span>
          </Button>

          <Button
            size="sm"
            variant={mode === "video" ? "default" : "outline"}
            className={cn(
              "gap-1 sm:gap-1.5 text-[10px] sm:text-xs h-7 sm:h-8 px-2 sm:px-3",
              mode === "video"
                ? "bg-blue-600 hover:bg-blue-700 text-white border-blue-600"
                : "border-gray-600 text-gray-300 hover:text-white hover:bg-gray-800"
            )}
            onClick={() => setMode("video")}
          >
            <Video className="size-3 sm:size-3.5" />
            <span className="hidden sm:inline">Video Only</span>
            <span className="sm:hidden">Video</span>
          </Button>

          {/* End Session — tutor only */}
          {isTutor && (
            <Button
              size="sm"
              disabled={ending}
              className="gap-1 sm:gap-1.5 text-[10px] sm:text-xs h-7 sm:h-8 px-2 sm:px-3 bg-red-600 hover:bg-red-700 text-white border-0 ml-1 sm:ml-2"
              onClick={handleEndSession}
            >
              {ending ? <Loader2 className="size-3 sm:size-3.5 animate-spin" /> : <StopCircle className="size-3 sm:size-3.5" />}
              <span className="hidden sm:inline">{ending ? "Ending…" : "End Session"}</span>
              <span className="sm:hidden">{ending ? "…" : "End"}</span>
            </Button>
          )}
        </div>
      </header>

      {/* ── MAIN CONTENT ── */}
      <main className={cn(
        "flex flex-1 overflow-hidden relative",
        isMobile && mode === "whiteboard" ? "flex-col" : "flex-row"
      )}>
        {/* Whiteboard panel */}
        {mode === "whiteboard" && (
          <div className={cn(
            "relative overflow-hidden transition-all duration-300 ease-in-out",
            isMobile
              ? isVideoExpanded ? "h-[30%]" : "flex-1"
              : "flex-1 border-r border-gray-800"
          )}>
            <LiveKitWhiteboard />
          </div>
        )}

        {/* Video panel */}
        {(!isMobile || mode === "video" || (mode === "whiteboard" && isVideoExpanded)) && (
          <div className={cn(
            "bg-gray-950 flex flex-col transition-all duration-300 ease-in-out relative",
            mode === "whiteboard"
              ? isMobile
                ? cn("shrink-0 border-t border-gray-800", isVideoExpanded ? "h-[70%]" : "h-0")
                : "w-80 shrink-0"
              : "w-full"
          )}>
            {/* Collapse button — mobile expanded video */}
            {isMobile && mode === "whiteboard" && isVideoExpanded && (
              <div className="absolute -top-3 left-0 right-0 flex justify-center z-20">
                <button
                  onClick={() => setIsVideoExpanded(false)}
                  className="bg-gray-800 hover:bg-gray-700 text-white rounded-full px-3 py-1 flex items-center gap-1 text-xs font-medium shadow-lg border border-gray-700"
                >
                  <ChevronUp className="size-3 rotate-180" />
                  <span className="hidden sm:inline">Hide</span>
                </button>
              </div>
            )}
            <div className="flex-1 overflow-hidden">
              <VideoConference />
            </div>
          </div>
        )}

        {/* Pull-up tab — mobile, whiteboard mode, video hidden */}
        {isMobile && mode === "whiteboard" && !isVideoExpanded && (
          <div
            className="absolute bottom-0 left-0 right-0 h-8 flex items-center justify-center z-20 cursor-pointer group"
            onClick={() => setIsVideoExpanded(true)}
          >
            <div className="w-12 h-1 bg-gray-600 group-hover:bg-gray-500 rounded-full transition-colors" />
          </div>
        )}
      </main>

      <RoomAudioRenderer />

      <style jsx global>{`
        @media (max-width: 767px) {
          .lk-participant-tile { aspect-ratio: 16/9; }
          .lk-control-bar { padding: 0.5rem !important; }
          .lk-button { padding: 0.375rem !important; min-width: 2.5rem !important; }
          .lk-button-group { gap: 0.25rem !important; }
          .lk-control-bar .lk-button { font-size: 0.75rem !important; }
        }
        .lk-video-conference { height: 100% !important; width: 100% !important; }
        .lk-grid-layout { height: 100% !important; }
        body { overflow: hidden; }
      `}</style>
    </LiveKitRoom>
  );
}
