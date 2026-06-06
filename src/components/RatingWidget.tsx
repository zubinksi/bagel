"use client";

import { useState } from "react";

type Props = {
  bagelId: string;
  currentUserRating: number | null;
  avgRating: number | null;
  ratingCount: number;
  isOwner: boolean;
  isLoggedIn: boolean;
  onRated?: (score: number) => void;
};

export default function RatingWidget({
  bagelId,
  currentUserRating,
  avgRating,
  ratingCount,
  isOwner,
  isLoggedIn,
  onRated,
}: Props) {
  const [hovered, setHovered] = useState<number | null>(null);
  const [selected, setSelected] = useState<number | null>(currentUserRating);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function rate(score: number) {
    if (!isLoggedIn || isOwner) return;
    setLoading(true);
    setError(null);
    const res = await fetch("/api/ratings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ bagel_id: bagelId, score }),
    });
    setLoading(false);
    if (!res.ok) {
      const j = await res.json();
      setError(j.error ?? "Failed to rate");
      return;
    }
    setSelected(score);
    onRated?.(score);
  }

  const display = hovered ?? selected;

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-3">
        <div className="flex gap-1">
          {Array.from({ length: 10 }, (_, i) => i + 1).map((n) => (
            <button
              key={n}
              disabled={!isLoggedIn || isOwner || loading}
              onMouseEnter={() => !isOwner && setHovered(n)}
              onMouseLeave={() => setHovered(null)}
              onClick={() => rate(n)}
              className={[
                "w-7 h-7 rounded text-sm font-bold transition",
                isOwner || !isLoggedIn
                  ? "cursor-default"
                  : "cursor-pointer hover:scale-110",
                display && n <= display
                  ? "bg-yellow-400 text-zinc-900"
                  : "bg-zinc-700 text-zinc-400",
              ].join(" ")}
            >
              {n}
            </button>
          ))}
        </div>

        {avgRating !== null && (
          <span className="text-sm text-zinc-300">
            <span className="font-bold text-yellow-400">
              {avgRating.toFixed(1)}
            </span>
            <span className="text-zinc-500"> / 10</span>
            <span className="text-zinc-500 text-xs ml-1">
              ({ratingCount} {ratingCount === 1 ? "rating" : "ratings"})
            </span>
          </span>
        )}
      </div>

      {isOwner && (
        <p className="text-xs text-zinc-500">You can&apos;t rate your own chug</p>
      )}
      {!isLoggedIn && (
        <p className="text-xs text-zinc-500">Sign in to rate</p>
      )}
      {error && <p className="text-xs text-red-400">{error}</p>}
    </div>
  );
}
