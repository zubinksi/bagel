import { NextRequest, NextResponse } from "next/server";
import { getLeague } from "@/lib/sleeper";
import { getBagelsForWeek, syncWeek } from "@/lib/data";
import { getSession } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase";

export async function GET(req: NextRequest) {
  const weekParam = req.nextUrl.searchParams.get("week");
  const league = await getLeague();
  const week = weekParam ? parseInt(weekParam) : league.settings.leg;

  await syncWeek(week);

  const bagels = await getBagelsForWeek(week, league.season);

  // Enrich with position + team from the players cache
  const playerIds = bagels.map((b) => b.player_id).filter(Boolean);
  const playerMap = new Map<string, { position: string | null; team: string | null }>();
  if (playerIds.length > 0) {
    const db = supabaseAdmin();
    const { data: players } = await db
      .from("players")
      .select("player_id, position, team")
      .in("player_id", playerIds);
    for (const p of players ?? []) {
      playerMap.set(p.player_id, { position: p.position ?? null, team: p.team ?? null });
    }
  }

  const enriched = bagels.map((b) => ({
    ...b,
    position: playerMap.get(b.player_id)?.position ?? null,
    team: playerMap.get(b.player_id)?.team ?? null,
  }));

  const session = await getSession();
  return NextResponse.json({ bagels: enriched, week, season: league.season, currentWeek: league.settings.leg, session });
}
