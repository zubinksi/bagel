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
      <div className="bg-[#111113] rounded-xl overflow-hidden border border-zinc-800 active:opacity-80 transition">
        <div className="flex items-stretch">
          {/* Team color sidebar */}
          <div className="w-16 flex flex-col items-center justify-center p-2 shrink-0" style={{ backgroundColor: bg, color: text }}>
            <span className="font-display text-[10px] opacity-70 leading-none">{(bagel as any).position ?? ""}</span>
            <span className="font-display text-sm leading-none font-bold mt-0.5">{(bagel as any).team ?? "?"}</span>
          </div>

          {/* Content */}
          <div className="flex-1 px-4 py-3 flex items-center justify-between gap-3">
            <div className="min-w-0">
              <p className="font-display text-xl text-white leading-tight truncate">{bagel.player_name}</p>
              <p className="text-zinc-400 text-sm truncate">
                {owner?.display_name ?? owner?.username}
              </p>
              <div className="mt-1 flex items-center gap-1.5">
                {hasChug ? (
                  <>
                    <span className="w-2 h-2 rounded-full bg-green-400 inline-block" />
                    <span className="text-green-400 text-xs font-medium">
                      CHUG POSTED{bagel.avg_rating ? ` · ${bagel.avg_rating.toFixed(1)}/10` : ""}
                    </span>
                  </>
                ) : (
                  <>
                    <span className="w-2 h-2 rounded-full bg-red-500 inline-block" />
                    <span className="text-red-400 text-xs font-medium">BEER CHUG PENDING</span>
                  </>
                )}
              </div>
            </div>
            <div className="shrink-0 text-right">
              <span className="font-display text-4xl text-yellow-400 leading-none">0</span>
              <p className="text-zinc-500 text-xs">PTS</p>
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
}
