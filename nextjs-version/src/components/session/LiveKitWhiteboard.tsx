"use client";

import { useEffect, useState } from "react";
import { Tldraw, useEditor, Editor } from "tldraw";
import "tldraw/tldraw.css";
import { useRoomContext } from "@livekit/components-react";
import { DataPacket_Kind, RoomEvent } from "livekit-client";

// The wrapper ensures the Editor hooks are rendered INSIDE <Tldraw>
export default function LiveKitWhiteboard() {
  return (
    <div className="w-full h-full relative" style={{ zIndex: 10 }}>
      <Tldraw persistenceKey="ethiotutor-whiteboard">
        <WhiteboardSync />
      </Tldraw>
    </div>
  );
}

function WhiteboardSync() {
  const editor = useEditor();
  const room = useRoomContext();
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    if (!editor || !room) return;
    setIsReady(true);

    // ─── 1. SEND LOCAL CHANGES TO OTHERS via LiveKit DataChannel ───
    const cleanupListen = editor.store.listen(
      ({ changes }) => {
        // We only broadcast changes if they are made locally by the user (not remote syncs)
        const payload = JSON.stringify({ type: "tldraw-sync", changes });
        const encoder = new TextEncoder();
        
        try {
          // Send over DataChannel (reliable so we don't drop draw strokes)
          room.localParticipant.publishData(encoder.encode(payload), {
            reliable: true,
          });
        } catch (err) {
          console.error("Failed to publish whiteboard data:", err);
        }
      },
      { source: "user", scope: "document" } // only trigger for local user edits
    );

    // ─── 2. RECEIVE REMOTE CHANGES FROM OTHERS ───
    const handleDataReceived = (payload: Uint8Array, participant?: any) => {
      // Ignore our own messages just in case
      if (participant?.identity === room.localParticipant.identity) return;

      try {
        const decoder = new TextDecoder();
        const msg = JSON.parse(decoder.decode(payload));

        if (msg.type === "tldraw-sync" && msg.changes) {
          // Merge the changes into the tldraw store seamlessly
          editor.store.mergeRemoteChanges(() => {
            const { added, updated, removed } = msg.changes;
            if (added)   for (const record of Object.values(added))   editor.store.put([record as any]);
            if (updated) for (const [, record] of Object.values(updated) as any[]) editor.store.put([record]);
            if (removed) for (const id of Object.values(removed))     editor.store.remove([id as any]);
          });
        }
      } catch (err) {
        console.error("Error parsing incoming whiteboard data", err);
      }
    };

    room.on(RoomEvent.DataReceived, handleDataReceived);

    return () => {
      cleanupListen();
      room.off(RoomEvent.DataReceived, handleDataReceived);
    };
  }, [editor, room]);

  return null; // This component has no UI, it just connects Editor ↔ LiveKit
}
