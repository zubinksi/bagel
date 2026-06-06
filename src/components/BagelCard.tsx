"use client";

import { useState } from "react";
import Link from "next/link";
import type { Bagel } from "@/lib/supabase";
import type { SessionUser } from "@/lib/auth";
import { avatarUrl } from "@/lib/sleeper";
import RatingWidget from "./RatingWidget";
import VideoUpload from "./VideoUpload";

type Props = {
  bagel: Bagel & { avg_rating: number | null; rating_count: number };
  session: SessionUser | null;
  myRating: number | null;
  showWeek?: boolean;
};

export default function BagelCard({ bagel, session, myRating, showWeek }: Props) {
  const [videoUrl, setVideoUrl] = useState(bagel.video_url);
  const [ratingCount, setRatingCount] = useState(bagel.rating_count ?? 0);
  const [avgRating, setAvgRating] = useState(bagel.avg_rating);
  const [myScore, setMyScore] = useState(myRating);

  const owner = bagel.users;
  const isOwner = session?.sleeper_user_id === bagel.owner_user_id;
  const avatar = owner?.avatar ? avatarUrl(owner.avatar) : null;

  function handleRated(score: number) {
    const wasRated = myScore !== null;
    setMyScore(score);
    const newCount = wasRated ? ratingCount : ratingCount + 1;
    setRatingCount(newCount);
    // Optimistic avg update
    // We don't have all ratings, so just show a rough update
    setAvgRating(avgRating); // server will have real value on next load
  }

  return (
    <div className="bg-zinc-800 rounded-xl p-5 space-y-4 border border-zinc-700">
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          {avatar ? (
            <img src={avatar} alt="" className="w-10 h-10 rounded-full bg-zinc-700" />
          ) : (
            <div className="w-10 h-10 rounded-full bg-zinc-700 flex items-center justify-center text-lg">
              🏈
            </div>
          )}
          <div>
            <p className="font-semibold text-white">
              {owner?.display_name ?? owner?.username ?? "Unknown"}
            </p>
            <p className="text-sm text-zinc-400">
              {bagel.player_name}
              {showWeek && (
                <span className="ml-2 text-zinc-500">· Week {bagel.week}</span>
              )}
            </p>
          </div>
        </div>
        <div className="text-4xl font-black text-green-400 leading-none select-none">
          0
        </div>
      </div>

      {/* Video */}
      {isOwner ? (
        <VideoUpload
          bagelId={bagel.id}
          existingVideoUrl={videoUrl}
          onUploaded={(url) => setVideoUrl(url)}
        />
      ) : videoUrl ? (
        <video
          src={videoUrl}
          controls
          className="w-full max-h-64 rounded-lg bg-black"
        />
      ) : (
        <div className="bg-zinc-900 rounded-lg p-4 text-center text-zinc-500 text-sm">
          No chug video yet
        </div>
      )}

      {/* Ratings */}
      {videoUrl && (
        <RatingWidget
          bagelId={bagel.id}
          currentUserRating={myScore}
          avgRating={avgRating}
          ratingCount={ratingCount}
          isOwner={isOwner}
          isLoggedIn={!!session}
          onRated={handleRated}
        />
      )}

      <Link
        href={`/bagel/${bagel.id}`}
        className="block text-xs text-zinc-500 hover:text-zinc-300 transition"
      >
        View details →
      </Link>
    </div>
  );
}
