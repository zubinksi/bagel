import Link from "next/link";
import { getLeague } from "@/lib/sleeper";
import { getLeaderboard, getSyncedWeeks, getBagelsForWeek, syncWeek } from "@/lib/data";
import { getSession } from "@/lib/auth";
import BagelCard from "@/components/BagelCard";
import { avatarUrl } from "@/lib/sleeper";

export const dynamic = "force-dynamic";

export default async function Home() {
  const [league, session] = await Promise.all([getLeague(), getSession()]);
  const { season, settings } = league;
  const currentWeek = settings.leg;

  // Auto-sync current week on load
  await syncWeek(currentWeek);

  const [leaderboard, syncedWeeks, currentBagels] = await Promise.all([
    getLeaderboard(season),
    getSyncedWeeks(season),
    getBagelsForWeek(currentWeek, season),
  ]);

  // Get this user's ratings for current week bagels
  const myRatings: Record<string, number> = {};
  if (session) {
    for (const b of currentBagels) {
      const r = b.ratings?.find((r) => r.rater_user_id === session.sleeper_user_id);
      if (r) myRatings[b.id] = r.score;
    }
  }

  return (
    <div className="space-y-10">
      {/* Hero */}
      <div className="text-center space-y-2">
        <h1 className="text-5xl font-black tracking-tight">
          <span className="text-green-400">Bagel</span> Board
        </h1>
        <p className="text-zinc-400">
          {season} Season · Starters with 0 pts must post a beer chug
        </p>
      </div>

      {/* Season leaderboard */}
      <section>
        <h2 className="text-lg font-bold mb-3 text-zinc-200">Season Standings</h2>
        <div className="bg-zinc-900 rounded-xl overflow-hidden border border-zinc-800">
          {leaderboard.length === 0 ? (
            <p className="p-6 text-zinc-500 text-sm text-center">No bagels yet this season.</p>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-zinc-800 text-zinc-400">
                  <th className="px-4 py-3 text-left">#</th>
                  <th className="px-4 py-3 text-left">Owner</th>
                  <th className="px-4 py-3 text-center">🥯 Bagels</th>
                </tr>
              </thead>
              <tbody>
                {leaderboard.map((row, i) => {
                  const av = row.avatar ? avatarUrl(row.avatar) : null;
                  return (
                    <tr key={row.owner_user_id} className="border-b border-zinc-800 last:border-0">
                      <td className="px-4 py-3 text-zinc-500 font-mono">{i + 1}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          {av ? (
                            <img src={av} alt="" className="w-7 h-7 rounded-full bg-zinc-700" />
                          ) : (
                            <div className="w-7 h-7 rounded-full bg-zinc-700 flex items-center justify-center text-xs">
                              🏈
                            </div>
                          )}
                          <span className="font-medium text-white">
                            {row.display_name ?? row.username}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span
                          className={`font-bold text-lg ${
                            i === 0 ? "text-red-400" : "text-zinc-200"
                          }`}
                        >
                          {row.bagels}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </section>

      {/* Week nav */}
      {syncedWeeks.length > 0 && (
        <section>
          <h2 className="text-lg font-bold mb-3 text-zinc-200">Browse by Week</h2>
          <div className="flex flex-wrap gap-2">
            {syncedWeeks.map((w) => (
              <Link
                key={w}
                href={`/week/${w}`}
                className={`px-4 py-1.5 rounded-full text-sm font-medium transition border ${
                  w === currentWeek
                    ? "bg-green-600 border-green-600 text-white"
                    : "border-zinc-700 text-zinc-300 hover:border-zinc-400"
                }`}
              >
                Week {w}
                {w === currentWeek && " (live)"}
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* This week's bagels */}
      <section>
        <h2 className="text-lg font-bold mb-3 text-zinc-200">
          Week {currentWeek} Bagels
        </h2>
        {currentBagels.length === 0 ? (
          <div className="bg-zinc-900 rounded-xl p-8 text-center text-zinc-500">
            <div className="text-4xl mb-2">🎉</div>
            <p>No bagels this week (yet)</p>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2">
            {currentBagels.map((bagel) => (
              <BagelCard
                key={bagel.id}
                bagel={bagel}
                session={session}
                myRating={myRatings[bagel.id] ?? null}
              />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
