"use client";

import { useEffect, useRef, useState } from "react";
import { upload } from "@vercel/blob/client";

type Props = {
  bagelId: string;
  existingVideoUrl: string | null;
};

type Stage = "idle" | "uploading" | "saving";

export default function VideoUploadZone({ bagelId, existingVideoUrl }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [stage, setStage] = useState<Stage>("idle");
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [videoUrl, setVideoUrl] = useState(existingVideoUrl);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Animated progress bar — eases toward 90% cap while upload is in flight
  useEffect(() => {
    if (stage === "uploading") {
      setProgress(2);
      timerRef.current = setInterval(() => {
        setProgress((p) => {
          if (p >= 90) { clearInterval(timerRef.current!); return p; }
          return p + (90 - p) * 0.03;
        });
      }, 400);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [stage]);

  async function handleFile(file: File) {
    if (!file.type.startsWith("video/")) {
      setError("Please select a video file");
      return;
    }
    setError(null);
    setProgress(0);

    try {
      setStage("uploading");
      const ext = file.name.split(".").pop() ?? "mp4";
      const pathname = `bagels/${bagelId}-${Date.now()}.${ext}`;

      // multipart: true splits the file into 8MB chunks — required for large files on iOS.
      // handleUploadUrl generates the token; our route returns {ok:true} for blob.upload-completed
      // immediately so there's no completion-callback hang.
      const blob = await upload(pathname, file, {
        access: "public",
        handleUploadUrl: "/api/upload/blob",
        clientPayload: bagelId,
        multipart: true,
      });

      setStage("saving");
      await fetch("/api/upload/complete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bagel_id: bagelId, video_url: blob.url }),
      });

      setVideoUrl(blob.url);
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
          {stage === "uploading" ? (
            <>
              <p className="font-display text-xl text-white tracking-wide">UPLOADING...</p>
              <div className="mt-3 w-full max-w-[200px] mx-auto h-1.5 bg-zinc-700 rounded-full overflow-hidden">
                <div
                  className="h-full bg-yellow-400 rounded-full transition-all duration-500"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </>
          ) : stage === "saving" ? (
            <p className="font-display text-xl text-white tracking-wide">SAVING...</p>
          ) : (
            <>
              <p className="font-display text-xl text-white tracking-wide">RECORD OR UPLOAD YOUR CHUG</p>
              <p className="text-zinc-500 text-xs mt-1">MP4 / MOV · up to 500MB · the shakier the better</p>
            </>
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
