import { NextRequest, NextResponse } from "next/server";
import { getLeague } from "@/lib/sleeper";
import { getBagelsForWeek, syncWeek } from "@/lib/data";
import { getSession } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase";

export async function GET(req: NextRequest) {
  const weekParam = req.nextUrl.searchParams.get("week");
  const [league, session] = await Promise.all([getLeague(), getSession()]);
  const week = weekParam ? parseInt(weekParam) : league.settings.leg;

  await syncWeek(week);

  const bagels = await getBagelsForWeek(week, league.season);

  const db = supabaseAdmin();
  const playerIds = bagels.map((b) => b.player_id).filter(Boolean);

  // Fetch player data and current user's ratings in parallel
  const [playersResult, ratingsResult] = await Promise.all([
    playerIds.length > 0
      ? db.from("players").select("player_id, position, team").in("player_id", playerIds)
      : Promise.resolve({ data: [] }),
    session && bagels.length > 0
      ? db
          .from("ratings")
          .select("bagel_id, score")
          .eq("rater_user_id", session.sleeper_user_id)
          .in("bagel_id", bagels.map((b) => b.id))
      : Promise.resolve({ data: [] }),
  ]);

  const playerMap = new Map<string, { position: string | null; team: string | null }>();
  for (const p of playersResult.data ?? []) {
    playerMap.set(p.player_id, { position: p.position ?? null, team: p.team ?? null });
  }

  const myRatingMap = new Map<string, number>();
  for (const r of ratingsResult.data ?? []) {
    myRatingMap.set(r.bagel_id, r.score);
  }

  const enriched = bagels.map((b) => ({
    ...b,
    position: playerMap.get(b.player_id)?.position ?? null,
    team: playerMap.get(b.player_id)?.team ?? null,
    my_rating: myRatingMap.get(b.id) ?? null,
  }));

  return NextResponse.json({ bagels: enriched, week, season: league.season, currentWeek: league.settings.leg, session });
}
