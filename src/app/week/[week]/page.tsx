import { notFound } from "next/navigation";
import Link from "next/link";
import { getLeague } from "@/lib/sleeper";
import { getBagelsForWeek, syncWeek } from "@/lib/data";
import { getSession } from "@/lib/auth";
import BagelCard from "@/components/BagelCard";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ week: string }> };

export default async function WeekPage({ params }: Props) {
  const { week: weekStr } = await params;
  const week = parseInt(weekStr, 10);
  if (isNaN(week) || week < 1 || week > 18) notFound();

  const [league, session] = await Promise.all([getLeague(), getSession()]);
  const { season, settings } = league;

  if (week > settings.leg) notFound();

  // Auto-sync: always re-sync current week, skip past weeks if already done
  await syncWeek(week);

  const bagels = await getBagelsForWeek(week, season);

  const myRatings: Record<string, number> = {};
  if (session) {
    for (const b of bagels) {
      const r = b.ratings?.find((r) => r.rater_user_id === session.sleeper_user_id);
      if (r) myRatings[b.id] = r.score;
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/" className="text-zinc-400 hover:text-white text-sm transition">
          ← Home
        </Link>
        <h1 className="text-3xl font-black">
          Week {week}
          {week === settings.leg && (
            <span className="ml-2 text-base font-medium text-green-400">live</span>
          )}
        </h1>
      </div>

      {bagels.length === 0 ? (
        <div className="bg-zinc-900 rounded-xl p-10 text-center text-zinc-500">
          <div className="text-4xl mb-2">🎉</div>
          <p>No bagels this week</p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {bagels.map((bagel) => (
            <BagelCard
              key={bagel.id}
              bagel={bagel}
              session={session}
              myRating={myRatings[bagel.id] ?? null}
            />
          ))}
        </div>
      )}
    </div>
  );
}
