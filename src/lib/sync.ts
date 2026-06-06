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

  // Fetch matchup and roster data — no player name lookup here (too slow)
  const [leagueUsers, rosters, matchups] = await Promise.all([
    getLeagueUsers(),
    getLeagueRosters(),
    getMatchups(week),
  ]);

  const rosterOwner = new Map<number, string>();
  for (const r of rosters) rosterOwner.set(r.roster_id, r.owner_id);

  const userRows = leagueUsers.map((u) => ({
    sleeper_user_id: u.user_id,
    username: u.username ?? u.display_name ?? u.user_id,
    display_name: u.display_name ?? null,
    avatar: u.avatar ?? null,
  }));
  await db.from("users").upsert(userRows, { onConflict: "sleeper_user_id" });

  // Load player name cache from DB
  const { data: cachedPlayers } = await db.from("players").select("player_id, name");
  const nameCache = new Map<string, string>(
    (cachedPlayers ?? []).map((p) => [p.player_id, p.name])
  );

  const bagelRows: {
    week: number;
    season: string;
    roster_id: number;
    owner_user_id: string;
    player_id: string;
    player_name: string;
  }[] = [];

  // Use players_points map for reliable 0-score detection
  for (const matchup of matchups) {
    const ownerUserId = rosterOwner.get(matchup.roster_id);
    if (!ownerUserId) continue;

    for (const playerId of matchup.starters) {
      const pts = matchup.players_points?.[playerId] ?? 0;
      if (pts !== 0) continue;

      bagelRows.push({
        week,
        season,
        roster_id: matchup.roster_id,
        owner_user_id: ownerUserId,
        player_id: playerId,
        player_name: nameCache.get(playerId) ?? playerId, // use cached name or ID as fallback
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

  // After writing bagels, asynchronously try to enrich any player names we're missing
  // This won't block the response and won't fail the sync if it times out
  const missingIds = bagelRows
    .filter((b) => !nameCache.has(b.player_id))
    .map((b) => b.player_id);

  if (missingIds.length > 0) {
    enrichPlayerNames(missingIds, db).catch(() => {});
  }

  return { synced: bagelRows.length, matchups: matchups.length };
}

/** Fetch the full players list and cache names for the given IDs in Supabase */
async function enrichPlayerNames(
  playerIds: string[],
  db: ReturnType<typeof supabaseAdmin>
) {
  const allPlayers = await getAllPlayers();
  const rows = playerIds
    .filter((id) => allPlayers[id])
    .map((id) => {
      const p = allPlayers[id];
      return {
        player_id: id,
        name: p.full_name ?? `${p.first_name} ${p.last_name}`,
        position: p.position ?? null,
        team: p.team ?? null,
      };
    });

  if (rows.length > 0) {
    await db.from("players").upsert(rows, { onConflict: "player_id" });
    // Update the bagels rows that had the player_id as a placeholder name
    for (const row of rows) {
      await db
        .from("bagels")
        .update({ player_name: row.name })
        .eq("player_id", row.player_id)
        .eq("player_name", row.player_id); // only update if still using ID as name
    }
  }
}
