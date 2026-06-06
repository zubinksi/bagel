import { notFound } from "next/navigation";
import Link from "next/link";
import { getBagel } from "@/lib/data";
import { getSession } from "@/lib/auth";
import { avatarUrl } from "@/lib/sleeper";
import RatingWidget from "@/components/RatingWidget";
import VideoUpload from "@/components/VideoUpload";
import VideoPlayer from "@/components/VideoPlayer";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ id: string }> };

export default async function BagelPage({ params }: Props) {
  const { id } = await params;
  const [bagel, session] = await Promise.all([getBagel(id), getSession()]);

  if (!bagel) notFound();

  const isOwner = session?.sleeper_user_id === bagel.owner_user_id;
  const owner = bagel.users;
  const avatar = owner?.avatar ? avatarUrl(owner.avatar) : null;
  const ratings = bagel.ratings ?? [];

  const myRating = session
    ? ratings.find((r) => r.rater_user_id === session.sleeper_user_id)?.score ?? null
    : null;

  return (
    <div className="space-y-8 max-w-2xl mx-auto">
      <div className="flex items-center gap-4">
        <Link
          href={`/week/${bagel.week}`}
          className="text-zinc-400 hover:text-white text-sm transition"
        >
          ← Week {bagel.week}
        </Link>
      </div>

      {/* Header */}
      <div className="flex items-center gap-4">
        {avatar ? (
          <img src={avatar} alt="" className="w-14 h-14 rounded-full bg-zinc-700" />
        ) : (
          <div className="w-14 h-14 rounded-full bg-zinc-700 flex items-center justify-center text-2xl">
            🏈
          </div>
        )}
        <div>
          <h1 className="text-2xl font-black text-white">
            {owner?.display_name ?? owner?.username}
          </h1>
          <p className="text-zinc-400">
            {bagel.player_name} · Week {bagel.week} · <span className="text-green-400 font-bold">0 pts</span>
          </p>
        </div>
        <div className="ml-auto text-6xl font-black text-green-400 select-none">0</div>
      </div>

      {/* Video */}
      <div>
        <h2 className="text-lg font-bold mb-3">Chug Video</h2>
        {isOwner ? (
          <VideoUpload
            bagelId={bagel.id}
            existingVideoUrl={bagel.video_url}
            onUploaded={() => {}}
          />
        ) : bagel.video_url ? (
          <VideoPlayer src={bagel.video_url} />
        ) : (
          <div className="bg-zinc-900 rounded-xl p-10 text-center text-zinc-500">
            <div className="text-4xl mb-2">🍺</div>
            <p>No chug video posted yet</p>
          </div>
        )}
      </div>

      {/* Ratings */}
      {bagel.video_url && (
        <div>
          <h2 className="text-lg font-bold mb-3">Rate the Chug</h2>
          <RatingWidget
            bagelId={bagel.id}
            currentUserRating={myRating}
            avgRating={bagel.avg_rating}
            ratingCount={bagel.rating_count}
            isOwner={isOwner}
            isLoggedIn={!!session}
          />
        </div>
      )}

      {/* Individual ratings */}
      {ratings.length > 0 && (
        <div>
          <h2 className="text-lg font-bold mb-3">All Ratings</h2>
          <div className="space-y-2">
            {ratings
              .sort((a, b) => b.score - a.score)
              .map((r) => {
                const raterAvatar = r.users?.avatar ? avatarUrl(r.users.avatar) : null;
                return (
                  <div
                    key={r.id}
                    className="flex items-center justify-between bg-zinc-900 rounded-lg px-4 py-3"
                  >
                    <div className="flex items-center gap-2">
                      {raterAvatar ? (
                        <img src={raterAvatar} alt="" className="w-7 h-7 rounded-full" />
                      ) : (
                        <div className="w-7 h-7 rounded-full bg-zinc-700 flex items-center justify-center text-xs">
                          🏈
                        </div>
                      )}
                      <span className="text-sm text-zinc-300">
                        {r.users?.display_name ?? r.users?.username ?? r.rater_user_id}
                      </span>
                    </div>
                    <div className="flex items-center gap-1">
                      <span className="font-bold text-yellow-400 text-lg">{r.score}</span>
                      <span className="text-zinc-500 text-sm">/10</span>
                    </div>
                  </div>
                );
              })}
          </div>
        </div>
      )}
    </div>
  );
}
