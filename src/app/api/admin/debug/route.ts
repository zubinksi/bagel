import { NextRequest, NextResponse } from "next/server";
import { getLeague, getLeagueUsers, getLeagueRosters, getMatchups } from "@/lib/sleeper";
import { supabaseAdmin } from "@/lib/supabase";
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
    const { data: syncedWeeks, error: syncedWeeksError } = await db.from("synced_weeks").select("*").order("week");
    const { data: bagels, error: bagelsError } = await db
      .from("bagels")
      .select("week, season, player_id, player_name, owner_user_id")
      .eq("season", league.season)
      .order("week");
    const { data: dbUsers, error: usersError } = await db.from("users").select("sleeper_user_id, username");

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
      dbErrors: {
        syncedWeeks: syncedWeeksError?.message ?? null,
        bagels: bagelsError?.message ?? null,
        users: usersError?.message ?? null,
      },
      syncedWeeks,
      bagelsInDb: bagels,
      usersInDb: dbUsers,
    });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Not logged in" }, { status: 401 });

  const { week } = await req.json();
  const db = supabaseAdmin();
  const league = await getLeague();
  const season = league.season;

  // Run each step manually so we can see exactly which step fails
  const steps: Record<string, unknown> = {};

  try {
    const [leagueUsers, rosters, matchups] = await Promise.all([
      getLeagueUsers(),
      getLeagueRosters(),
      getMatchups(week),
    ]);
    steps.fetchedFromSleeper = { users: leagueUsers.length, rosters: rosters.length, matchups: matchups.length };

    const rosterOwner = new Map(rosters.map((r) => [r.roster_id, r.owner_id]));

    const userRows = leagueUsers.map((u) => ({
      sleeper_user_id: u.user_id,
      username: u.username ?? u.display_name ?? u.user_id,
      display_name: u.display_name ?? null,
      avatar: u.avatar ?? null,
    }));
    const { error: userUpsertError } = await db.from("users").upsert(userRows, { onConflict: "sleeper_user_id" });
    steps.userUpsert = userUpsertError ? { error: userUpsertError.message, code: userUpsertError.code } : "ok";

    const { data: cachedPlayers } = await db.from("players").select("player_id, name");
    const nameCache = new Map((cachedPlayers ?? []).map((p: {player_id: string; name: string}) => [p.player_id, p.name]));

    const bagelRows: { week: number; season: string; roster_id: number; owner_user_id: string; player_id: string; player_name: string }[] = [];
    for (const matchup of matchups) {
      const ownerUserId = rosterOwner.get(matchup.roster_id);
      if (!ownerUserId) continue;
      for (const playerId of matchup.starters) {
        const pts = matchup.players_points?.[playerId] ?? 0;
        if (pts !== 0) continue;
        bagelRows.push({ week, season, roster_id: matchup.roster_id, owner_user_id: ownerUserId, player_id: playerId, player_name: nameCache.get(playerId) ?? playerId });
      }
    }
    steps.bagelsDetected = bagelRows;

    if (bagelRows.length > 0) {
      const { error: bagelUpsertError } = await db.from("bagels").upsert(bagelRows, { onConflict: "week,season,roster_id,player_id" });
      steps.bagelUpsert = bagelUpsertError ? { error: bagelUpsertError.message, code: bagelUpsertError.code } : "ok";
    }

    const { error: weekUpsertError } = await db.from("synced_weeks").upsert({ week, season, synced_at: new Date().toISOString() });
    steps.weekUpsert = weekUpsertError ? { error: weekUpsertError.message, code: weekUpsertError.code } : "ok";

    return NextResponse.json({ steps });
  } catch (err) {
    return NextResponse.json({ steps, fatalError: String(err) }, { status: 500 });
  }
}
