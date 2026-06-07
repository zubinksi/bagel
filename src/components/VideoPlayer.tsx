"use client";

import { useState } from "react";

type Props = {
  src: string;
  canReplace?: boolean;
  bagelId?: string;
  week?: number;
  playerName?: string;
  playerPosition?: string;
};

export default function VideoPlayer({ src, canReplace, bagelId, week, playerName, playerPosition }: Props) {
  const [errCode, setErrCode] = useState<number | null>(null);
  const [clearing, setClearing] = useState(false);

  async function handleReupload() {
    if (!bagelId || clearing) return;
    setClearing(true);
    try {
      await fetch("/api/video/clear", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bagel_id: bagelId }),
      });
    } finally {
      window.location.reload();
    }
  }

  if (errCode !== null) {
    return (
      <div className="w-full rounded-xl bg-[#111113] border border-zinc-800 p-5 space-y-4">
        <div>
          <p className="text-red-400 font-display tracking-wide">VIDEO FAILED TO LOAD</p>
          <p className="text-zinc-600 text-xs mt-1">Error {errCode}</p>
        </div>
        {canReplace && bagelId ? (
          <button
            onClick={handleReupload}
            disabled={clearing}
            className="w-full py-3 bg-yellow-400 hover:bg-yellow-300 disabled:opacity-50 text-black font-display text-lg tracking-wider rounded"
          >
            {clearing ? "CLEARING..." : "RE-UPLOAD VIDEO"}
          </button>
        ) : (
          <p className="text-zinc-500 text-sm">The owner needs to re-upload the video.</p>
        )}
      </div>
    );
  }

  return (
    <div className="relative w-full rounded-xl overflow-hidden bg-black">
      <video
        src={src}
        controls
        playsInline
        className="w-full max-h-[480px] block"
        onError={(e) => {
          const code = e.currentTarget.error?.code ?? -1;
          setErrCode(code);
        }}
      />

      {/* Bagel Cam overlay */}
      <div className="absolute inset-0 pointer-events-none select-none">
        {/* Corner brackets */}
        <div className="absolute top-2 left-2 w-5 h-5 border-t border-l border-white/25" />
        <div className="absolute top-2 right-2 w-5 h-5 border-t border-r border-white/25" />
        <div className="absolute bottom-2 left-2 w-5 h-5 border-b border-l border-white/25" />
        <div className="absolute bottom-2 right-2 w-5 h-5 border-b border-r border-white/25" />

        {/* Top row */}
        <div className="absolute top-3 left-3 right-3 flex justify-between items-center">
          <span className="font-mono text-[10px] text-white/60 tracking-widest uppercase">
            Bagel Cam
          </span>
          <span className="font-mono text-[10px] text-white/60 tracking-wider flex items-center gap-1">
            <span className="inline-block w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
            REC
          </span>
        </div>

        {/* Bottom row — above native controls (~44px) */}
        {(playerName || week) && (
          <div className="absolute bottom-12 left-3 space-y-0.5">
            {playerName && (
              <p className="font-mono text-[10px] text-white/60 tracking-widest uppercase leading-tight">
                {playerPosition ? `${playerPosition} · ` : ""}{playerName}
              </p>
            )}
            {week && (
              <p className="font-mono text-[10px] text-white/60 tracking-widest uppercase leading-tight">
                Week {week}
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
