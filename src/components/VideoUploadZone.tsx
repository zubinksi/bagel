"use client";

import { useRef, useState } from "react";

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

      // Get a client upload token + the predictable blob URL (addRandomSuffix:false)
      const tokenRes = await fetch("/api/upload/token", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bagel_id: bagelId, file_ext: ext }),
      });
      if (!tokenRes.ok) {
        const j = await tokenRes.json().catch(() => ({}));
        throw new Error(j.error ?? `Token error ${tokenRes.status}`);
      }
      const { clientToken, pathname, blobUrl } = await tokenRes.json();

      // XHR gives real upload progress. iOS Safari fires onerror on the *response*
      // even when the server has received every byte — the upload itself succeeds.
      // In that case we fall back to the pre-computed blobUrl instead of the response.
      const storeId = clientToken.split("_")[3] ?? "";
      const uploadUrl = `https://vercel.com/api/blob/?pathname=${encodeURIComponent(pathname)}`;

      const finalUrl = await new Promise<string>((resolve, reject) => {
        let bytesSent = 0;
        const xhr = new XMLHttpRequest();
        xhr.open("PUT", uploadUrl, true);
        xhr.setRequestHeader("Authorization", `Bearer ${clientToken}`);
        xhr.setRequestHeader("x-vercel-blob-access", "public");
        xhr.setRequestHeader("x-api-version", "12");
        xhr.setRequestHeader("x-vercel-blob-store-id", storeId);

        xhr.upload.addEventListener("progress", (e) => {
          if (e.lengthComputable) {
            bytesSent = e.loaded;
            setProgress(Math.min(99, Math.round((e.loaded / e.total) * 99)));
          }
        });

        xhr.onload = () => {
          if (xhr.status >= 200 && xhr.status < 300) {
            try {
              resolve((JSON.parse(xhr.responseText) as { url: string }).url);
            } catch {
              resolve(blobUrl); // parse failed but upload succeeded
            }
          } else {
            reject(new Error(`Upload failed (${xhr.status}): ${xhr.responseText.slice(0, 200)}`));
          }
        };

        xhr.onerror = () => {
          // iOS Safari triggers onerror on the response even after all bytes are sent.
          // If ≥99% was sent, the blob is already stored — use the pre-computed URL.
          if (bytesSent >= file.size * 0.99) {
            resolve(blobUrl);
          } else {
            reject(new Error("Upload failed — check your connection and try again"));
          }
        };

        xhr.send(file);
      });

      setStage("saving");

      // Verify the blob actually landed in storage before saving the URL.
      // If iOS Safari onerror fired even though the upload failed, the blob won't
      // be there and list() returns empty — we must fail here rather than save a dead URL.
      const verifyRes = await fetch("/api/upload/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pathname }),
      });
      if (!verifyRes.ok) {
        throw new Error("Upload didn't land — please try again");
      }
      const { url: verifiedUrl } = await verifyRes.json();

      await fetch("/api/upload/complete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bagel_id: bagelId, video_url: verifiedUrl }),
      });

      setVideoUrl(finalUrl);
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
              <p className="font-display text-xl text-white tracking-wide">
                {progress > 0 ? `UPLOADING ${progress}%` : "UPLOADING..."}
              </p>
              <div className="mt-3 w-full max-w-[200px] mx-auto h-1.5 bg-zinc-700 rounded-full overflow-hidden">
                <div
                  className="h-full bg-yellow-400 rounded-full transition-all duration-500"
                  style={{ width: `${Math.max(2, progress)}%` }}
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
