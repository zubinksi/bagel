"use client";

import { useRef, useState } from "react";

type Props = {
  bagelId: string;
  existingVideoUrl: string | null;
};

type UploadStage = "idle" | "preparing" | "uploading" | "saving";

const STAGE_LABEL: Record<UploadStage, string> = {
  idle: "RECORD OR UPLOAD YOUR CHUG",
  preparing: "PREPARING...",
  uploading: "UPLOADING...",
  saving: "SAVING...",
};

export default function VideoUploadZone({ bagelId, existingVideoUrl }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [stage, setStage] = useState<UploadStage>("idle");
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [videoUrl, setVideoUrl] = useState(existingVideoUrl);

  async function handleFile(file: File) {
    if (!file.type.startsWith("video/")) {
      setError("Please select a video file");
      return;
    }
    setError(null);
    setProgress(0);

    try {
      // Step 1: Get a signed upload URL from the server (no file sent here)
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
      const { signed_url, path } = await prepRes.json();

      // Step 2: PUT the file directly to Supabase Storage (bypasses Vercel size limit)
      setStage("uploading");
      await new Promise<void>((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.open("PUT", signed_url);
        xhr.setRequestHeader("Content-Type", file.type);
        xhr.upload.onprogress = (e) => {
          if (e.lengthComputable) setProgress(Math.round((e.loaded / e.total) * 100));
        };
        xhr.onload = () => {
          if (xhr.status >= 200 && xhr.status < 300) resolve();
          else reject(new Error(`Upload failed: ${xhr.status} ${xhr.statusText}`));
        };
        xhr.onerror = () => reject(new Error("Network error during upload"));
        xhr.send(file);
      });

      // Step 3: Tell the server to record the path and get a download URL
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
      window.location.reload();
    } catch (err) {
      setStage("idle");
      setError(err instanceof Error ? err.message : "Upload failed");
    }
  }

  const busy = stage !== "idle";

  if (videoUrl) {
    return (
      <div className="space-y-3">
        <video src={videoUrl} controls className="w-full rounded-lg bg-black aspect-video" />
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
          onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); }}
        />
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Error banner — shown above the zone so it's always visible */}
      {error && (
        <div className="bg-red-900/30 border border-red-700/50 rounded-xl px-4 py-3 text-sm text-red-400">
          {error}
        </div>
      )}

      {/* Dashed upload zone */}
      <button
        onClick={() => !busy && inputRef.current?.click()}
        disabled={busy}
        className="w-full border-2 border-dashed border-zinc-700 hover:border-yellow-500 disabled:hover:border-zinc-700 rounded-xl p-8 flex flex-col items-center gap-3 transition"
      >
        <div className="w-14 h-14 rounded-full bg-zinc-800 flex items-center justify-center text-2xl">
          {busy ? "⏳" : "📷"}
        </div>
        <div className="text-center">
          <p className="font-display text-xl text-white tracking-wide">{STAGE_LABEL[stage]}</p>
          {stage === "uploading" && progress > 0 ? (
            <div className="mt-2 w-40 mx-auto h-1 bg-zinc-700 rounded-full overflow-hidden">
              <div className="h-full bg-yellow-400 rounded-full transition-all" style={{ width: `${progress}%` }} />
            </div>
          ) : (
            <p className="text-zinc-500 text-xs mt-1">MP4 / MOV · the shakier the better</p>
          )}
        </div>
      </button>

      {/* Two-button row */}
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
