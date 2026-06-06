"use client";

import { useRef, useState } from "react";

type Props = {
  bagelId: string;
  existingVideoUrl: string | null;
  onUploaded: (url: string) => void;
};

export default function VideoUpload({ bagelId, existingVideoUrl, onUploaded }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [preview, setPreview] = useState<string | null>(existingVideoUrl);

  async function handleFile(file: File) {
    if (!file.type.startsWith("video/")) {
      setError("Please select a video file");
      return;
    }
    setError(null);
    setUploading(true);

    const form = new FormData();
    form.append("file", file);
    form.append("bagel_id", bagelId);

    const res = await fetch("/api/upload", { method: "POST", body: form });
    setUploading(false);

    if (!res.ok) {
      const j = await res.json();
      setError(j.error ?? "Upload failed");
      return;
    }

    const { video_url } = await res.json();
    setPreview(video_url);
    onUploaded(video_url);
  }

  return (
    <div className="space-y-3">
      {preview ? (
        <div className="space-y-2">
          <video
            src={preview}
            controls
            className="w-full max-h-72 rounded-lg bg-black"
          />
          <button
            onClick={() => inputRef.current?.click()}
            className="text-sm text-zinc-400 hover:text-white underline transition"
          >
            Replace video
          </button>
        </div>
      ) : (
        <button
          onClick={() => inputRef.current?.click()}
          disabled={uploading}
          className="w-full border-2 border-dashed border-zinc-600 hover:border-green-500 rounded-lg p-6 text-center text-zinc-400 hover:text-white transition"
        >
          {uploading ? (
            <span>Uploading...</span>
          ) : (
            <>
              <div className="text-3xl mb-1">🍺</div>
              <div className="font-medium">Upload your chug video</div>
              <div className="text-xs mt-1">MP4, MOV, up to 500MB</div>
            </>
          )}
        </button>
      )}

      <input
        ref={inputRef}
        type="file"
        accept="video/*"
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) handleFile(f);
        }}
      />

      {error && <p className="text-sm text-red-400">{error}</p>}
    </div>
  );
}
