import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { getLeague } from "@/lib/sleeper";

export async function GET() {
  const db = supabaseAdmin();
  const league = await getLeague();

  // Get bagel counts per week
  const { data } = await db
    .from("bagels")
    .select("week")
    .eq("season", league.season);

  const counts: Record<number, number> = {};
  for (const row of data ?? []) {
    counts[row.week] = (counts[row.week] ?? 0) + 1;
  }

  const { data: syncedWeeks } = await db
    .from("synced_weeks")
    .select("week")
    .eq("season", league.season)
    .order("week", { ascending: false });

  const weeks = (syncedWeeks ?? []).map((r) => ({
    week: r.week,
    bagel_count: counts[r.week] ?? 0,
  }));

  return NextResponse.json({ weeks, season: league.season, currentWeek: league.settings.leg });
}
