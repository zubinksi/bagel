"use client";

import { useEffect, useRef } from "react";
import { teamColor } from "@/lib/teamColors";
import type { Bagel } from "@/lib/supabase";
import VideoPlayer from "./VideoPlayer";
import VideoUploadZone from "./VideoUploadZone";
import NumberPad from "./NumberPad";

type Props = {
  bagel: Bagel & { avg_rating: number | null; rating_count: number; my_rating?: number | null };
  isExpanded: boolean;
  onToggle: () => void;
  isOwner: boolean;
  isLoggedIn: boolean;
};

export default function BagelFeedCard({ bagel, isExpanded, onToggle, isOwner, isLoggedIn }: Props) {
  const owner = bagel.users;
  const { bg, text } = teamColor((bagel as any).team ?? null);
  const hasChug = !!bagel.video_url;
  const cardRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isExpanded) {
      setTimeout(() => cardRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" }), 50);
    }
  }, [isExpanded]);

  return (
    <div ref={cardRef} className="rounded-xl overflow-hidden border border-zinc-800">
      {/* Header row — tap to expand/collapse */}
      <button
        onClick={onToggle}
        className="w-full bg-[#111113] active:bg-zinc-800/80 transition-colors text-left"
      >
        <div className="flex items-stretch">
          {/* Team colour sidebar */}
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

          {/* Player + status */}
          <div className="flex-1 px-4 py-3 min-w-0">
            <p className="font-display text-xl text-white leading-tight truncate">{bagel.player_name}</p>
            <p className="text-zinc-400 text-sm truncate">{owner?.display_name ?? owner?.username}</p>
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

          {/* Chevron */}
          <div className="flex items-center pr-4 shrink-0">
            <span
              className={`text-zinc-500 text-lg leading-none transition-transform duration-200 inline-block ${isExpanded ? "rotate-180" : ""}`}
            >
              ▾
            </span>
          </div>
        </div>
      </button>

      {/* Expanded body */}
      {isExpanded && (
        <div className="border-t border-zinc-800 bg-zinc-900/40 p-3 space-y-3">
          {hasChug ? (
            <>
              <VideoPlayer
                src={`/api/video/${bagel.id}`}
                canReplace={isOwner}
                bagelId={bagel.id}
                week={bagel.week}
                playerName={bagel.player_name}
                playerPosition={(bagel as any).position}
              />
              <div className="bg-[#111113] rounded-xl p-4 border border-zinc-800">
                <NumberPad
                  bagelId={bagel.id}
                  currentRating={(bagel as any).my_rating ?? null}
                  avgRating={bagel.avg_rating ?? null}
                  ratingCount={bagel.rating_count ?? 0}
                  isOwner={isOwner}
                  isLoggedIn={isLoggedIn}
                />
              </div>
            </>
          ) : isOwner ? (
            <VideoUploadZone bagelId={bagel.id} existingVideoUrl={null} />
          ) : (
            <div className="py-8 text-center text-zinc-600 text-sm">No chug posted yet</div>
          )}
        </div>
      )}
    </div>
  );
}
