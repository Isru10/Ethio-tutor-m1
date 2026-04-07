"use client";

import { useState } from "react";
import {
  LiveKitRoom,
  VideoConference,
  RoomAudioRenderer,
} from "@livekit/components-react";
import "@livekit/components-styles";
import LiveKitWhiteboard from "./LiveKitWhiteboard";
import { Button } from "@/components/ui/button";
import { Presentation, Video } from "lucide-react";

interface RoomViewProps {
  token: string;
  serverUrl: string;
  roomName: string;
}

export default function RoomView({ token, serverUrl, roomName }: RoomViewProps) {
  const [mode, setMode] = useState<"whiteboard" | "video">("whiteboard");

  return (
    <LiveKitRoom
      token={token}
      serverUrl={serverUrl}
      data-lk-theme="default"
      className="flex flex-col h-screen w-screen bg-gray-950"
      onDisconnected={() => {
        window.location.href = "/dashboard";
      }}
    >
      {/* ── HEADER ── */}
      <header className="flex items-center justify-between px-5 py-3 bg-gray-900 text-white shadow-md shrink-0 border-b border-gray-800">
        <div className="flex items-center gap-3">
          <div className="px-3 py-1 bg-red-500/10 text-red-400 rounded-full text-xs font-bold uppercase tracking-wider flex items-center gap-1.5">
            <span className="inline-block h-2 w-2 rounded-full bg-red-500 animate-pulse" />
            LIVE
          </div>
          <h1 className="text-base font-semibold text-white">
            {roomName.split("-").slice(0, 3).join(" ")}
          </h1>
        </div>

        {/* Toggle buttons */}
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant={mode === "whiteboard" ? "default" : "outline"}
            className="gap-1.5 text-xs"
            onClick={() => setMode("whiteboard")}
          >
            <Presentation className="size-3.5" />
            Whiteboard
          </Button>
          <Button
            size="sm"
            variant={mode === "video" ? "default" : "outline"}
            className="gap-1.5 text-xs"
            onClick={() => setMode("video")}
          >
            <Video className="size-3.5" />
            Video Only
          </Button>
        </div>
      </header>

      {/* ── MAIN CONTENT ── */}
      <main className="flex flex-1 overflow-hidden">

        {/* Whiteboard panel (hidden in video-only mode) */}
        {mode === "whiteboard" && (
          <div className="flex-1 h-full border-r border-gray-800 relative">
            <LiveKitWhiteboard />
          </div>
        )}

        {/* Video + controls — VideoConference owns the LayoutContext internally */}
        <div
          className={`h-full bg-gray-950 flex flex-col ${
            mode === "whiteboard" ? "w-80 shrink-0" : "w-full"
          }`}
        >
          {/*
            VideoConference already includes:
            - ParticipantTile grid
            - ControlBar (mic, camera, screen-share, chat, leave)
            - LayoutContextProvider (so no external ControlBar needed)
          */}
          <VideoConference />
        </div>

      </main>

      <RoomAudioRenderer />
    </LiveKitRoom>
  );
}
