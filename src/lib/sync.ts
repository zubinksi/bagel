import { supabaseAdmin } from "./supabase";
import {
  getLeague,
  getLeagueUsers,
  getLeagueRosters,
  getMatchups,
  getAllPlayers,
} from "./sleeper";

export async function runSync(week: number) {
  const db = supabaseAdmin();

  const league = await getLeague();
  const season = league.season;
  const currentWeek = league.settings.leg;

  if (week > currentWeek) return { skipped: "week not yet played" };

  // Past weeks only sync once; current week always re-syncs
  const { data: existing } = await db
    .from("synced_weeks")
    .select("week")
    .eq("week", week)
    .eq("season", season)
    .maybeSingle();

  if (existing && week < currentWeek) return { skipped: "already synced" };

  const [leagueUsers, rosters, matchups, players] = await Promise.all([
    getLeagueUsers(),
    getLeagueRosters(),
    getMatchups(week),
    getAllPlayers(),
  ]);

  const rosterOwner = new Map<number, string>();
  for (const r of rosters) rosterOwner.set(r.roster_id, r.owner_id);

  const userRows = leagueUsers.map((u) => ({
    sleeper_user_id: u.user_id,
    username: u.username,
    display_name: u.display_name,
    avatar: u.avatar ?? null,
  }));
  await db.from("users").upsert(userRows, { onConflict: "sleeper_user_id" });

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

  // For the current week, remove any bagels whose scores updated above 0
  if (week === currentWeek && matchups.length > 0) {
    const keepers = new Set(bagelRows.map((b) => `${b.roster_id}|${b.player_id}`));
    const { data: stored } = await db
      .from("bagels")
      .select("id, roster_id, player_id")
      .eq("week", week)
      .eq("season", season);

    const toDelete = (stored ?? [])
      .filter((b) => !keepers.has(`${b.roster_id}|${b.player_id}`))
      .map((b) => b.id);

    if (toDelete.length > 0) {
      await db.from("bagels").delete().in("id", toDelete);
    }
  }

  await db
    .from("synced_weeks")
    .upsert({ week, season, synced_at: new Date().toISOString() });

  return { synced: bagelRows.length };
}
