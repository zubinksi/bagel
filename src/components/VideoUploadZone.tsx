"use client";

import { useRef, useState } from "react";

type Props = {
  bagelId: string;
  existingVideoUrl: string | null;
  onUploaded: (url: string) => void;
};

export default function VideoUploadZone({ bagelId, existingVideoUrl, onUploaded }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [videoUrl, setVideoUrl] = useState(existingVideoUrl);

  async function handleFile(file: File) {
    if (!file.type.startsWith("video/")) { setError("Please select a video file"); return; }
    setError(null);
    setUploading(true);
    const form = new FormData();
    form.append("file", file);
    form.append("bagel_id", bagelId);
    const res = await fetch("/api/upload", { method: "POST", body: form });
    setUploading(false);
    if (!res.ok) { const j = await res.json(); setError(j.error ?? "Upload failed"); return; }
    const { video_url } = await res.json();
    setVideoUrl(video_url);
    onUploaded(video_url);
  }

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
        <input ref={inputRef} type="file" accept="video/*" className="hidden"
          onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); }} />
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Dashed upload zone */}
      <button
        onClick={() => inputRef.current?.click()}
        disabled={uploading}
        className="w-full border-2 border-dashed border-zinc-700 hover:border-yellow-500 rounded-xl p-8 flex flex-col items-center gap-3 transition"
      >
        <div className="w-14 h-14 rounded-full bg-zinc-800 flex items-center justify-center text-2xl">
          📷
        </div>
        <div className="text-center">
          <p className="font-display text-xl text-white tracking-wide">
            {uploading ? "UPLOADING..." : "RECORD OR UPLOAD YOUR CHUG"}
          </p>
          <p className="text-zinc-500 text-xs mt-1">MP4 / MOV · up to 500MB · the shakier the better</p>
        </div>
      </button>

      {/* Two-button row */}
      <div className="grid grid-cols-2 gap-3">
        <button
          onClick={() => inputRef.current?.click()}
          disabled={uploading}
          className="py-4 bg-yellow-400 hover:bg-yellow-300 text-black font-display text-xl tracking-wider rounded flex items-center justify-center gap-2 disabled:opacity-50"
        >
          📷 RECORD
        </button>
        <button
          onClick={() => inputRef.current?.click()}
          disabled={uploading}
          className="py-4 bg-zinc-800 hover:bg-zinc-700 text-white font-display text-xl tracking-wider rounded flex items-center justify-center gap-2 disabled:opacity-50"
        >
          ↑ UPLOAD
        </button>
      </div>

      <input ref={inputRef} type="file" accept="video/*" className="hidden"
        onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); }} />
      {error && <p className="text-red-400 text-sm text-center">{error}</p>}
    </div>
  );
}
