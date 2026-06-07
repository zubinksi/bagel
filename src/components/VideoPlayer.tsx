"use client";

import { useState } from "react";

type Props = {
  src: string;
  canReplace?: boolean;
  bagelId?: string;
};

export default function VideoPlayer({ src, canReplace, bagelId }: Props) {
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
    <video
      src={src}
      controls
      playsInline
      className="w-full rounded-xl bg-black max-h-[480px]"
      onError={(e) => {
        const code = e.currentTarget.error?.code ?? -1;
        setErrCode(code);
      }}
    />
  );
}
