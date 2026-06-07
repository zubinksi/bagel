"use client";

import { useState } from "react";

export default function VideoPlayer({ src }: { src: string }) {
  const [errCode, setErrCode] = useState<number | null>(null);

  if (errCode !== null) {
    return (
      <div className="w-full rounded-xl bg-[#111113] border border-zinc-800 p-4 space-y-3">
        <p className="text-red-400 text-sm font-display tracking-wide">
          VIDEO ERROR {errCode}
        </p>
        <p className="text-zinc-500 text-xs break-all">{src}</p>
        <a
          href={src}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-block text-yellow-400 text-xs underline"
        >
          Open video URL directly ↗
        </a>
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
        const code = (e.currentTarget.error?.code) ?? -1;
        setErrCode(code);
      }}
    />
  );
}
