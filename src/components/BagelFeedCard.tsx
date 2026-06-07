"use client";

import Link from "next/link";
import { teamColor } from "@/lib/teamColors";
import type { Bagel } from "@/lib/supabase";

type Props = {
  bagel: Bagel & { avg_rating: number | null; rating_count: number };
};

export default function BagelFeedCard({ bagel }: Props) {
  const owner = bagel.users;
  const { bg, text } = teamColor((bagel as any).team ?? null);
  const hasChug = !!bagel.video_url;

  return (
    <Link href={`/bagel/${bagel.id}`} className="block">
      <div className="relative rounded-xl overflow-hidden border border-zinc-800 active:opacity-80 transition h-[88px]">

        {/* Video thumbnail background */}
        {hasChug && (
          <>
            <video
              src={`/api/video/${bagel.id}`}
              muted
              playsInline
              preload="metadata"
              className="absolute inset-0 w-full h-full object-cover"
            />
            {/* gradient: opaque left (text) → fade right (video shows through) */}
            <div className="absolute inset-0 bg-gradient-to-r from-black/95 via-black/70 to-black/20" />
          </>
        )}

        {/* Dark background for no-video cards */}
        {!hasChug && <div className="absolute inset-0 bg-[#111113]" />}

        {/* Card content */}
        <div className="relative flex items-stretch h-full">
          {/* Team color sidebar */}
          <div
            className="w-16 flex flex-col items-center justify-center p-2 shrink-0"
            style={{ backgroundColor: bg, color: text }}
          >
            <span className="font-display text-[10px] opacity-70 leading-none">
              {(bagel as any).position ?? ""}
            </span>
            <span className="font-display text-sm leading-none font-bold mt-0.5">
              {(bagel as any).team ?? "?"}
            </span>
          </div>

          {/* Text */}
          <div className="flex-1 px-4 py-3 flex flex-col justify-center min-w-0">
            <p className="font-display text-xl text-white leading-tight truncate">
              {bagel.player_name}
            </p>
            <p className="text-zinc-400 text-sm truncate">
              {owner?.display_name ?? owner?.username}
            </p>
            <div className="mt-1 flex items-center gap-1.5">
              {hasChug ? (
                <>
                  <span className="w-2 h-2 rounded-full bg-green-400 inline-block shrink-0" />
                  <span className="text-green-400 text-xs font-medium">
                    CHUG POSTED{bagel.avg_rating ? ` · ${bagel.avg_rating.toFixed(1)}/10` : ""}
                  </span>
                </>
              ) : (
                <>
                  <span className="w-2 h-2 rounded-full bg-red-500 inline-block shrink-0" />
                  <span className="text-red-400 text-xs font-medium">CHUG PENDING</span>
                </>
              )}
            </div>
          </div>
        </div>

      </div>
    </Link>
  );
}
