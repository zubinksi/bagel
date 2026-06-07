"use client";

export default function VideoPlayer({ src }: { src: string }) {
  return (
    <video
      src={src}
      controls
      playsInline
      className="w-full rounded-xl bg-black max-h-[480px]"
    />
  );
}
