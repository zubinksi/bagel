"use client";

import { useEffect, useRef, useState } from "react";
import { createBrowserClient } from "@/lib/supabase-browser";

const BUCKET = "bagel-videos";

type Props = {
  bagelId: string;
  existingVideoUrl: string | null;
};

type Stage = "idle" | "preparing" | "uploading" | "saving";

const LABEL: Record<Stage, string> = {
  idle: "RECORD OR UPLOAD YOUR CHUG",
  preparing: "PREPARING...",
  uploading: "UPLOADING...",
  saving: "SAVING...",
};

export default function VideoUploadZone({ bagelId, existingVideoUrl }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [stage, setStage] = useState<Stage>("idle");
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [videoUrl, setVideoUrl] = useState(existingVideoUrl);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Animate a fake progress bar while uploading (real progress not available via SDK)
  useEffect(() => {
    if (stage === "uploading") {
      setProgress(5);
      timerRef.current = setInterval(() => {
        setProgress((p) => {
          if (p >= 90) { clearInterval(timerRef.current!); return p; }
          return p + Math.random() * 8;
        });
      }, 600);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
      if (stage === "saving") setProgress(95);
      if (stage === "idle") setProgress(0);
    }
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [stage]);

  async function handleFile(file: File) {
    if (!file.type.startsWith("video/")) {
      setError("Please select a video file");
      return;
    }
    setError(null);

    try {
      // Step 1: Ask the server for a signed upload URL
      setStage("preparing");
      const ext = file.name.split(".").pop() ?? "mp4";
      const prepRes = await fetch("/api/upload/prepare", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bagel_id: bagelId, file_ext: ext }),
      });
      if (!prepRes.ok) {
        const j = await prepRes.json().catch(() => ({}));
        throw new Error(j.error ?? `Server error ${prepRes.status}`);
      }
      const { token, path } = await prepRes.json();

      // Step 2: Upload directly from browser to Supabase Storage (no Vercel size limit)
      setStage("uploading");
      const supabase = createBrowserClient();
      const { error: uploadError } = await supabase.storage
        .from(BUCKET)
        .uploadToSignedUrl(path, token, file, { upsert: true });
      if (uploadError) throw new Error(uploadError.message);

      // Step 3: Tell the server to persist the path and get a long-lived download URL
      setStage("saving");
      const completeRes = await fetch("/api/upload/complete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bagel_id: bagelId, path }),
      });
      if (!completeRes.ok) {
        const j = await completeRes.json().catch(() => ({}));
        throw new Error(j.error ?? `Save error ${completeRes.status}`);
      }
      const { video_url } = await completeRes.json();
      setVideoUrl(video_url);
      setProgress(100);
      setTimeout(() => window.location.reload(), 300);
    } catch (err) {
      setStage("idle");
      setError(err instanceof Error ? err.message : "Upload failed");
    }
  }

  const busy = stage !== "idle";

  if (videoUrl) {
    return (
      <div className="space-y-3">
        <video src={videoUrl} controls playsInline className="w-full rounded-lg bg-black aspect-video" />
        <button
          onClick={() => inputRef.current?.click()}
          className="w-full py-3 border border-zinc-700 rounded text-zinc-400 text-sm hover:border-zinc-500 transition font-display tracking-wider"
        >
          REPLACE VIDEO
        </button>
        <input
          ref={inputRef}
          type="file"
          accept="video/*"
          className="hidden"
          onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); e.target.value = ""; }}
        />
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {error && (
        <div className="bg-red-900/30 border border-red-700/50 rounded-xl px-4 py-3 text-sm text-red-400">
          {error}
        </div>
      )}

      <button
        onClick={() => !busy && inputRef.current?.click()}
        disabled={busy}
        className="w-full border-2 border-dashed border-zinc-700 hover:border-yellow-500 disabled:hover:border-zinc-700 rounded-xl p-8 flex flex-col items-center gap-3 transition"
      >
        <div className="w-14 h-14 rounded-full bg-zinc-800 flex items-center justify-center text-2xl">
          {busy ? "⏳" : "📷"}
        </div>
        <div className="text-center w-full">
          <p className="font-display text-xl text-white tracking-wide">{LABEL[stage]}</p>
          {busy && progress > 0 ? (
            <div className="mt-3 w-full max-w-[200px] mx-auto h-1 bg-zinc-700 rounded-full overflow-hidden">
              <div
                className="h-full bg-yellow-400 rounded-full transition-all duration-500"
                style={{ width: `${Math.min(progress, 100)}%` }}
              />
            </div>
          ) : (
            <p className="text-zinc-500 text-xs mt-1">MP4 / MOV · the shakier the better</p>
          )}
        </div>
      </button>

      <div className="grid grid-cols-2 gap-3">
        <button
          onClick={() => !busy && inputRef.current?.click()}
          disabled={busy}
          className="py-4 bg-yellow-400 hover:bg-yellow-300 text-black font-display text-xl tracking-wider rounded flex items-center justify-center gap-2 disabled:opacity-40"
        >
          📷 RECORD
        </button>
        <button
          onClick={() => !busy && inputRef.current?.click()}
          disabled={busy}
          className="py-4 bg-zinc-800 hover:bg-zinc-700 text-white font-display text-xl tracking-wider rounded flex items-center justify-center gap-2 disabled:opacity-40"
        >
          ↑ UPLOAD
        </button>
      </div>

      <input
        ref={inputRef}
        type="file"
        accept="video/*"
        className="hidden"
        onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); e.target.value = ""; }}
      />
    </div>
  );
}
