"use client";

import { useState } from "react";

type Props = {
  bagelId: string;
  currentRating: number | null;
  avgRating: number | null;
  ratingCount: number;
  isOwner: boolean;
  isLoggedIn: boolean;
  onRated?: (score: number) => void;
};

export default function NumberPad({ bagelId, currentRating, avgRating, ratingCount, isOwner, isLoggedIn, onRated }: Props) {
  const [selected, setSelected] = useState<number | null>(currentRating);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(!!currentRating);

  async function submit() {
    if (!selected || loading) return;
    setLoading(true);
    setError(null);
    const res = await fetch("/api/ratings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ bagel_id: bagelId, score: selected }),
    });
    setLoading(false);
    if (!res.ok) {
      const j = await res.json();
      setError(j.error ?? "Failed to rate");
      return;
    }
    setSubmitted(true);
    onRated?.(selected);
  }

  if (isOwner) {
    return (
      <p className="text-center text-zinc-500 text-sm py-4">You can&apos;t rate your own chug</p>
    );
  }

  return (
    <div className="space-y-4">
      {/* Live avg */}
      <div className="flex items-center justify-between">
        <span className="font-display text-lg text-yellow-400">YOUR VERDICT</span>
        {avgRating !== null && (
          <span className="text-sm text-zinc-400">
            LIVE AVG <span className="text-yellow-400 font-bold">{avgRating.toFixed(1)}</span> · {ratingCount}
          </span>
        )}
      </div>

      {/* Score display */}
      <div className="text-center py-2">
        <span className="font-display text-6xl text-white">
          {selected ? selected : "—"}
        </span>
        <span className="font-display text-3xl text-zinc-500">/10</span>
        {!isLoggedIn && (
          <p className="text-zinc-500 text-xs mt-1">Sign in to rate</p>
        )}
        {isLoggedIn && !submitted && (
          <p className="text-zinc-500 text-xs mt-1 uppercase tracking-wider">Tap a number to score the chug</p>
        )}
      </div>

      {/* Number grid */}
      <div className="grid grid-cols-10 gap-1">
        {Array.from({ length: 10 }, (_, i) => i + 1).map((n) => (
          <button
            key={n}
            disabled={!isLoggedIn || loading}
            onClick={() => setSelected(n)}
            className={[
              "aspect-square rounded font-display text-xl flex items-center justify-center transition-all",
              selected === n
                ? "bg-yellow-400 text-black scale-110"
                : "bg-zinc-800 text-zinc-300 hover:bg-zinc-700",
              !isLoggedIn ? "opacity-40 cursor-not-allowed" : "cursor-pointer",
            ].join(" ")}
          >
            {n}
          </button>
        ))}
      </div>

      {/* WEAK / ELITE labels */}
      <div className="flex justify-between text-xs text-zinc-600 uppercase tracking-widest px-0.5">
        <span>Weak</span>
        <span>Elite</span>
      </div>

      {/* Submit button */}
      <button
        onClick={submit}
        disabled={!selected || loading || !isLoggedIn}
        className={[
          "w-full py-4 font-display text-xl tracking-wider rounded transition",
          selected && isLoggedIn && !loading
            ? "bg-yellow-400 text-black hover:bg-yellow-300"
            : "bg-zinc-800 text-zinc-600 cursor-not-allowed",
        ].join(" ")}
      >
        {loading ? "SUBMITTING..." : submitted ? "UPDATE SCORE" : "PICK A SCORE TO SUBMIT"}
      </button>

      <p className="text-center text-zinc-600 text-xs">One score per juror · you can change it until results close</p>

      {error && <p className="text-center text-red-400 text-sm">{error}</p>}
    </div>
  );
}
