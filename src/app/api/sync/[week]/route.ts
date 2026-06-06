import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import {
  getLeague,
  getLeagueUsers,
  getLeagueRosters,
  getMatchups,
  getAllPlayers,
} from "@/lib/sleeper";

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ week: string }> }
) {
  const { week: weekStr } = await params;
  const week = parseInt(weekStr, 10);
  if (isNaN(week) || week < 1 || week > 18) {
    return NextResponse.json({ error: "Invalid week" }, { status: 400 });
  }

  const db = supabaseAdmin();

  const league = await getLeague();
  const season = league.season;
  const currentWeek = league.settings.leg;

  // Don't sync a week that hasn't started yet
  if (week > currentWeek) {
    return NextResponse.json({ skipped: "week not yet played" });
  }

  // Skip if already synced (for completed past weeks we never re-sync)
  const { data: existing } = await db
    .from("synced_weeks")
    .select("week")
    .eq("week", week)
    .eq("season", season)
    .maybeSingle();

  // Always re-sync the current week (scores still coming in)
  if (existing && week < currentWeek) {
    return NextResponse.json({ skipped: "already synced" });
  }

  const [leagueUsers, rosters, matchups, players] = await Promise.all([
    getLeagueUsers(),
    getLeagueRosters(),
    getMatchups(week),
    getAllPlayers(),
  ]);

  // Build a map from roster_id → sleeper_user_id
  const rosterOwner = new Map<number, string>();
  for (const r of rosters) {
    rosterOwner.set(r.roster_id, r.owner_id);
  }

  // Upsert all league users into our DB
  const userRows = leagueUsers.map((u) => ({
    sleeper_user_id: u.user_id,
    username: u.username,
    display_name: u.display_name,
    avatar: u.avatar ?? null,
  }));
  await db.from("users").upsert(userRows, { onConflict: "sleeper_user_id" });

  // Find bagels: starters with exactly 0.00 points
  const bagelRows: {
    week: number;
    season: string;
    roster_id: number;
    owner_user_id: string;
    player_id: string;
    player_name: string;
  }[] = [];

  for (const matchup of matchups) {
    const ownerUserId = rosterOwner.get(matchup.roster_id);
    if (!ownerUserId) continue;

    for (let i = 0; i < matchup.starters.length; i++) {
      const playerId = matchup.starters[i];
      // "DEF" / "K" slots use team abbrev as ID — include them
      const pts = matchup.starters_points?.[i] ?? 0;
      if (pts !== 0) continue;

      const p = players[playerId];
      const playerName =
        p?.full_name ?? (p ? `${p.first_name} ${p.last_name}` : playerId);

      bagelRows.push({
        week,
        season,
        roster_id: matchup.roster_id,
        owner_user_id: ownerUserId,
        player_id: playerId,
        player_name: playerName,
      });
    }
  }

  if (bagelRows.length > 0) {
    await db
      .from("bagels")
      .upsert(bagelRows, { onConflict: "week,season,roster_id,player_id" });
  }

  // Delete bagels that were removed (e.g. score was updated above 0)
  if (week === currentWeek && matchups.length > 0) {
    const keepers = bagelRows.map(
      (b) => `${b.roster_id}|${b.player_id}`
    );
    const { data: stored } = await db
      .from("bagels")
      .select("id, roster_id, player_id")
      .eq("week", week)
      .eq("season", season);

    const toDelete = (stored ?? [])
      .filter((b) => !keepers.includes(`${b.roster_id}|${b.player_id}`))
      .map((b) => b.id);

    if (toDelete.length > 0) {
      await db.from("bagels").delete().in("id", toDelete);
    }
  }

  await db
    .from("synced_weeks")
    .upsert({ week, season, synced_at: new Date().toISOString() });

  return NextResponse.json({ synced: bagelRows.length });
}
