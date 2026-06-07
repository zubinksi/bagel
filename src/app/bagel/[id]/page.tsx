import { notFound } from "next/navigation";
import Link from "next/link";
import { getBagel } from "@/lib/data";
import { getSession } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase";
import { teamColor } from "@/lib/teamColors";
import NumberPad from "@/components/NumberPad";
import VideoUploadZone from "@/components/VideoUploadZone";
import VideoPlayer from "@/components/VideoPlayer";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ id: string }> };

export default async function BagelPage({ params }: Props) {
  const { id } = await params;
  const [bagel, session] = await Promise.all([getBagel(id), getSession()]);
  if (!bagel) notFound();

  // Get player info from cache
  const db = supabaseAdmin();
  const { data: player } = await db
    .from("players")
    .select("name, position, team")
    .eq("player_id", bagel.player_id)
    .maybeSingle();

  const isOwner = session?.sleeper_user_id === bagel.owner_user_id;
  const owner = bagel.users;
  const ratings = bagel.ratings ?? [];
  const myRating = session ? ratings.find((r) => r.rater_user_id === session.sleeper_user_id) ?? null : null;
  const { bg, text } = teamColor(player?.team ?? null);

  const sortedRatings = [...ratings].sort((a, b) => b.score - a.score);
  const maxScore = sortedRatings[0]?.score ?? 10;

  return (
    <div className="min-h-screen pb-8">
      {/* Header */}
      <div className="flex items-center gap-4 px-4 pt-5 pb-4">
        <Link href="/" className="text-zinc-500 font-display text-sm tracking-wider flex items-center gap-1">
          ← WEEK {bagel.week}
          {!isOwner && bagel.video_url && <span className="text-zinc-700"> · BOX SCORE</span>}
          {!isOwner && !bagel.video_url && <span className="text-zinc-700"> · RATE THE CHUG</span>}
        </Link>
      </div>

      {/* Owner upload view (Screen 2) */}
      {isOwner && !bagel.video_url ? (
        <div className="px-4 space-y-5">
          {/* YOU GOT BAGELED banner */}
          <div className="bg-red-900/30 border border-red-700/50 rounded-xl p-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-red-500" />
              <span className="font-display text-2xl text-white tracking-wide">YOU GOT BAGELED</span>
            </div>
            <span className="font-display text-4xl text-yellow-400">0</span>
          </div>

          {/* Player card */}
          <div className="flex items-center gap-3 bg-[#111113] rounded-xl overflow-hidden border border-zinc-800">
            <div className="w-20 h-20 flex flex-col items-center justify-center shrink-0" style={{ backgroundColor: bg, color: text }}>
              {player?.position && <span className="text-[10px] opacity-70">{player.position}</span>}
              <span className="font-display text-base font-bold">{player?.team ?? "?"}</span>
            </div>
            <div>
              <p className="font-display text-2xl text-white">{bagel.player_name}</p>
              <p className="text-zinc-400 text-sm">
                {player?.position} · started Week {bagel.week}
              </p>
            </div>
          </div>

          {/* Rules */}
          <div>
            <p className="font-display text-sm text-red-400 tracking-widest mb-2">THE RULES OF PENANCE</p>
            <p className="text-zinc-300 text-sm leading-relaxed">
              You started a player who scored a clean <span className="text-yellow-400 font-semibold">zero</span>.
              League law demands a chug. Film it, post it, take your rating like a champion.
            </p>
          </div>

          {/* Upload zone */}
          <VideoUploadZone
            bagelId={bagel.id}
            existingVideoUrl={bagel.video_url}
          />
        </div>
      ) : (
        /* Non-owner or owner with video: full box score view */
        <div className="px-4 space-y-5">
          {/* Player stats card */}
          <div className="bg-[#111113] rounded-xl overflow-hidden border border-zinc-800">
            <div className="flex items-stretch">
              <div className="w-20 flex flex-col items-center justify-center shrink-0 py-4" style={{ backgroundColor: bg, color: text }}>
                {owner?.username && (
                  <span className="text-[10px] opacity-60 font-display">
                    {owner.username.slice(0, 2).toUpperCase()}
                  </span>
                )}
                {player?.team && <span className="font-display text-base font-bold">{player.team}</span>}
              </div>
              <div className="flex-1 p-4">
                {player?.position && (
                  <p className="font-display text-xs text-yellow-400 tracking-widest mb-1">{player.position}</p>
                )}
                <p className="font-display text-3xl text-white leading-tight">{bagel.player_name}</p>
                <p className="text-zinc-500 text-xs mt-0.5">
                  {owner?.display_name ?? owner?.username} · bageled Week {bagel.week}
                </p>
              </div>
              <div className="flex flex-col items-center justify-center px-4 shrink-0 border-l border-zinc-800">
                <span className="font-display text-5xl text-yellow-400 leading-none">0</span>
                <span className="text-zinc-600 text-xs uppercase tracking-wider mt-0.5">Final</span>
              </div>
            </div>

            {/* Stats row */}
            <div className="border-t border-zinc-800 grid grid-cols-4 divide-x divide-zinc-800">
              {[
                { label: "SNAPS", value: (bagel as any).snaps ?? "—" },
                { label: "TOUCHES", value: (bagel as any).touches ?? "—" },
                { label: "PROJ", value: (bagel as any).proj_pts != null ? (bagel as any).proj_pts.toFixed(1) : "—" },
                { label: "ACTUAL", value: "0.0", red: true },
              ].map((stat) => (
                <div key={stat.label} className="flex flex-col items-center py-3">
                  <span className={`font-display text-2xl leading-none ${stat.red ? "text-red-400" : "text-white"}`}>
                    {stat.value}
                  </span>
                  <span className="text-zinc-600 text-[10px] uppercase tracking-wider mt-0.5">{stat.label}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Video / upload */}
          <div>
            <p className="font-display text-sm text-zinc-500 tracking-widest mb-3">
              ▶ {isOwner ? "THE REPLAY · CHUG CAM" : "CHUG CAM"}
            </p>
            {bagel.video_url ? (
              <VideoPlayer src={bagel.video_url} />
            ) : isOwner ? (
              <VideoUploadZone
                bagelId={bagel.id}
                existingVideoUrl={null}
              />
            ) : (
              <div className="aspect-video bg-[#111113] border border-zinc-800 rounded-xl flex flex-col items-center justify-center gap-2">
                <span className="text-4xl">🍺</span>
                <p className="text-zinc-500 text-sm">No chug posted yet</p>
              </div>
            )}
          </div>

          {/* Judges' scorecard */}
          {sortedRatings.length > 0 && (
            <div>
              <div className="flex items-center justify-between mb-3">
                <p className="font-display text-sm text-yellow-400 tracking-widest">JUDGES&apos; SCORECARD</p>
                <span className="text-sm text-zinc-400">
                  <span className="text-yellow-400 font-display text-xl">{bagel.avg_rating?.toFixed(1)}</span>
                  <span className="text-zinc-600"> AVG · {bagel.rating_count}</span>
                </span>
              </div>
              <div className="space-y-2">
                {sortedRatings.map((r) => {
                  const rater = r.users;
                  const barWidth = `${(r.score / maxScore) * 100}%`;
                  return (
                    <div key={r.id} className="flex items-center gap-3 bg-[#111113] rounded-xl px-4 py-3">
                      <div className="w-8 h-8 rounded-full bg-zinc-700 flex items-center justify-center text-xs font-display shrink-0">
                        {((rater?.display_name ?? rater?.username) ?? "?").slice(0, 2).toUpperCase()}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-display text-base text-white truncate">
                          {rater?.display_name ?? rater?.username ?? r.rater_user_id}
                        </p>
                        <div className="mt-1 h-1 bg-zinc-800 rounded-full overflow-hidden">
                          <div className="h-full bg-yellow-400 rounded-full transition-all" style={{ width: barWidth }} />
                        </div>
                      </div>
                      <span className="font-display text-2xl text-yellow-400 shrink-0">{r.score}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Rating widget */}
          {bagel.video_url && !isOwner && (
            <div className="bg-[#111113] rounded-xl p-5 border border-zinc-800">
              <NumberPad
                bagelId={bagel.id}
                currentRating={myRating?.score ?? null}
                avgRating={bagel.avg_rating ?? null}
                ratingCount={bagel.rating_count ?? 0}
                isOwner={isOwner}
                isLoggedIn={!!session}
              />
            </div>
          )}
        </div>
      )}
    </div>
  );
}
