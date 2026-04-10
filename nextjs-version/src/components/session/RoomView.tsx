"use client";

import { useState, useEffect } from "react";
import {
  LiveKitRoom,
  VideoConference,
  RoomAudioRenderer,
} from "@livekit/components-react";
import "@livekit/components-styles";
import LiveKitWhiteboard from "./LiveKitWhiteboard";
import { Button } from "@/components/ui/button";
import { Presentation, Video, ChevronUp, Users } from "lucide-react";
import { cn } from "@/lib/utils";

interface RoomViewProps {
  token: string;
  serverUrl: string;
  roomName: string;
}

export default function RoomView({
  token,
  serverUrl,
  roomName,
}: RoomViewProps) {
  const [mode, setMode] = useState<"whiteboard" | "video">("whiteboard");
  const [isVideoExpanded, setIsVideoExpanded] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  // Detect mobile viewport
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768); // md breakpoint
    };

    checkMobile();
    window.addEventListener("resize", checkMobile);

    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  // Reset expand state when switching modes
  useEffect(() => {
    if (mode === "video") {
      setIsVideoExpanded(false);
    }
  }, [mode]);

  return (
    <LiveKitRoom
      token={token}
      serverUrl={serverUrl}
      data-lk-theme="default"
      className="flex flex-col h-screen w-screen bg-gray-950 overflow-hidden"
      onDisconnected={() => {
        window.location.href = "/dashboard";
      }}
    >
      {/* ── HEADER (Always visible with toggle and video indicator) ── */}
      <header className="flex items-center justify-between px-3 sm:px-5 py-2 sm:py-3 bg-gray-900 text-white shadow-md shrink-0 border-b border-gray-800">
        <div className="flex items-center gap-2 sm:gap-3">
          <div className="px-2 sm:px-3 py-1 bg-red-500/10 text-red-400 rounded-full text-[10px] sm:text-xs font-bold uppercase tracking-wider flex items-center gap-1 sm:gap-1.5">
            <span className="inline-block h-1.5 w-1.5 sm:h-2 sm:w-2 rounded-full bg-red-500 animate-pulse" />
            <span className="hidden xs:inline">LIVE</span>
          </div>
          <h1 className="text-sm sm:text-base font-semibold text-white truncate max-w-[120px] sm:max-w-none">
            {roomName.split("-").slice(0, 3).join(" ")}
          </h1>
        </div>

        <div className="flex items-center gap-1 sm:gap-2">
          {/* Show Participants button - Only on mobile when video is hidden */}
          {isMobile && mode === "whiteboard" && !isVideoExpanded && (
            <Button
              size="sm"
              variant="outline"
              className="gap-1 sm:gap-1.5 text-[10px] sm:text-xs h-7 sm:h-8 px-2 sm:px-3 border-gray-600 text-gray-300 hover:text-white hover:bg-gray-800"
              onClick={() => setIsVideoExpanded(true)}
            >
              <Users className="size-3 sm:size-3.5" />
              <span className="hidden xs:inline">Show Video</span>
              <span className="xs:hidden">Video</span>
            </Button>
          )}

          {/* Toggle buttons - Always visible */}
          <Button
            size="sm"
            variant={mode === "whiteboard" ? "default" : "outline"}
            className={cn(
              "gap-1 sm:gap-1.5 text-[10px] sm:text-xs h-7 sm:h-8 px-2 sm:px-3",
              mode === "whiteboard"
                ? "bg-blue-600 hover:bg-blue-700 text-white border-blue-600"
                : "border-gray-600 text-gray-300 hover:text-white hover:bg-gray-800",
            )}
            onClick={() => {
              setMode("whiteboard");
              setIsVideoExpanded(false); // Hide video when switching to whiteboard
            }}
          >
            <Presentation className="size-3 sm:size-3.5" />
            <span className="hidden xs:inline">Whiteboard</span>
            <span className="xs:hidden">Board</span>
          </Button>
          <Button
            size="sm"
            variant={mode === "video" ? "default" : "outline"}
            className={cn(
              "gap-1 sm:gap-1.5 text-[10px] sm:text-xs h-7 sm:h-8 px-2 sm:px-3",
              mode === "video"
                ? "bg-blue-600 hover:bg-blue-700 text-white border-blue-600"
                : "border-gray-600 text-gray-300 hover:text-white hover:bg-gray-800",
            )}
            onClick={() => setMode("video")}
          >
            <Video className="size-3 sm:size-3.5" />
            <span className="hidden xs:inline">Video Only</span>
            <span className="xs:hidden">Video</span>
          </Button>
        </div>
      </header>

      {/* ── MAIN CONTENT ── */}
      <main
        className={cn(
          "flex flex-1 overflow-hidden relative",
          // On mobile, stack vertically. On desktop, side by side
          isMobile && mode === "whiteboard" ? "flex-col" : "flex-row",
        )}
      >
        {/* Whiteboard panel - Always shown when mode is whiteboard */}
        {mode === "whiteboard" && (
          <div
            className={cn(
              "relative overflow-hidden transition-all duration-300 ease-in-out",
              isMobile
                ? isVideoExpanded
                  ? "h-[30%]" // When video expanded, whiteboard takes 30%
                  : "flex-1" // When video hidden, whiteboard takes full height
                : "flex-1 border-r border-gray-800", // Desktop: whiteboard takes full available width
            )}
          >
            <LiveKitWhiteboard />
          </div>
        )}

        {/* Video panel - Hidden by default on mobile whiteboard mode */}
        {(!isMobile ||
          mode === "video" ||
          (mode === "whiteboard" && isVideoExpanded)) && (
          <div
            className={cn(
              "bg-gray-950 flex flex-col transition-all duration-300 ease-in-out relative",
              mode === "whiteboard"
                ? isMobile
                  ? cn(
                      "shrink-0 border-t border-gray-800",
                      isVideoExpanded ? "h-[70%]" : "h-0",
                    )
                  : "w-80 shrink-0" // Desktop: fixed width for video panel
                : "w-full", // Video-only mode: full width
            )}
          >
            {/* Drag handle / collapse button for expanded video */}
            {isMobile && mode === "whiteboard" && isVideoExpanded && (
              <div className="absolute -top-3 left-0 right-0 flex justify-center z-20">
                <button
                  onClick={() => setIsVideoExpanded(false)}
                  className="bg-gray-800 hover:bg-gray-700 text-white rounded-full px-3 py-1 flex items-center gap-1 text-xs font-medium shadow-lg border border-gray-700 transition-all"
                  aria-label="Hide video panel"
                >
                  <ChevronUp className="size-3 rotate-180" />
                  <span className="hidden sm:inline">Hide</span>
                </button>
              </div>
            )}

            {/* VideoConference - Only rendered when visible */}
            <div className="flex-1 overflow-hidden">
              <VideoConference />
            </div>
          </div>
        )}

        {/* Bottom edge pull tab - Only shown on mobile when video is hidden */}
        {isMobile && mode === "whiteboard" && !isVideoExpanded && (
          <div
            className="absolute bottom-0 left-0 right-0 h-8 flex items-center justify-center z-20 cursor-pointer group"
            onClick={() => setIsVideoExpanded(true)}
          >
            <div className="w-12 h-1 bg-gray-600 group-hover:bg-gray-500 rounded-full mb-1 transition-colors" />
            <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
              <div className="bg-gray-800/90 text-white text-[10px] px-2 py-0.5 rounded-full backdrop-blur-sm">
                Pull up for video
              </div>
            </div>
          </div>
        )}
      </main>

      <RoomAudioRenderer />

      {/* Global styles for responsive LiveKit components */}
      <style jsx global>{`
        /* Mobile optimizations */
        @media (max-width: 767px) {
          .lk-participant-tile {
            aspect-ratio: 16/9;
          }

          .lk-control-bar {
            padding: 0.5rem !important;
          }

          .lk-button {
            padding: 0.375rem !important;
            min-width: 2.5rem !important;
          }

          .lk-button-group {
            gap: 0.25rem !important;
          }

          .lk-control-bar .lk-button {
            font-size: 0.75rem !important;
          }

          /* Hide less critical controls on very small screens */
          @media (max-width: 480px) {
            .lk-control-bar .lk-button[data-lk-action="chat"] {
              display: none !important;
            }
          }
        }

        /* Custom breakpoint for extra small screens */
        @media (min-width: 480px) {
          .xs\\:inline {
            display: inline !important;
          }
        }

        /* Smooth transitions */
        .transition-all {
          transition-property: all;
          transition-timing-function: cubic-bezier(0.4, 0, 0.2, 1);
          transition-duration: 300ms;
        }

        /* Ensure LiveKit components fill their containers */
        .lk-video-conference {
          height: 100% !important;
          width: 100% !important;
        }

        .lk-grid-layout {
          height: 100% !important;
        }

        /* Better touch targets for mobile */
        @media (max-width: 767px) {
          button,
          .lk-button {
            min-height: 44px;
            min-width: 44px;
          }
        }

        /* Prevent body scroll */
        body {
          overflow: hidden;
        }

        /* Group hover effect for pull tab */
        .group:hover .group-hover\\:opacity-100 {
          opacity: 1;
        }
        .group:hover .group-hover\\:bg-gray-500 {
          background-color: rgb(107 114 128);
        }
      `}</style>
    </LiveKitRoom>
  );
}
