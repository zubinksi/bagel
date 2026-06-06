import { NextRequest, NextResponse } from "next/server";
import { getLeague, getLeagueUsers, getLeagueRosters, getMatchups } from "@/lib/sleeper";
import { supabaseAdmin } from "@/lib/supabase";
import { runSync } from "@/lib/sync";
import { getSession } from "@/lib/auth";

export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Not logged in" }, { status: 401 });

  const weekParam = req.nextUrl.searchParams.get("week");

  try {
    const league = await getLeague();
    const week = weekParam ? parseInt(weekParam) : league.settings.leg;
    const [users, rosters, matchups] = await Promise.all([
      getLeagueUsers(),
      getLeagueRosters(),
      getMatchups(week),
    ]);

    const db = supabaseAdmin();
    const { data: syncedWeeks } = await db.from("synced_weeks").select("*").order("week");
    const { data: bagels } = await db
      .from("bagels")
      .select("week, season, player_id, player_name, owner_user_id")
      .eq("season", league.season)
      .order("week");

    // Show score breakdown for requested week
    const rosterOwner = new Map(rosters.map((r) => [r.roster_id, r.owner_id]));
    const scoreBreakdown = matchups.map((m) => ({
      roster_id: m.roster_id,
      owner: rosterOwner.get(m.roster_id),
      total_points: m.points,
      starters: m.starters.map((pid) => ({
        player_id: pid,
        points: m.players_points?.[pid] ?? "missing",
      })),
    }));

    return NextResponse.json({
      league: { season: league.season, currentWeek: league.settings.leg, status: league.status },
      queryWeek: week,
      matchupCount: matchups.length,
      scoreBreakdown,
      syncedWeeks,
      bagelsInDb: bagels,
    });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Not logged in" }, { status: 401 });

  const { week } = await req.json();
  try {
    const result = await runSync(week);
    return NextResponse.json({ ok: true, result });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
