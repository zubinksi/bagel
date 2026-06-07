import { NextResponse } from "next/server";
import { getLeague } from "@/lib/sleeper";
import { supabaseAdmin } from "@/lib/supabase";

export async function GET() {
  const league = await getLeague();
  const db = supabaseAdmin();
  const { count: totalBagels } = await db.from("bagels").select("*", { count: "exact", head: true });
  const { count: totalChugs } = await db.from("bagels").select("*", { count: "exact", head: true }).not("video_url", "is", null);
  return NextResponse.json({
    season: league.season,
    currentWeek: league.settings.leg,
    status: league.status,
    totalBagels: totalBagels ?? 0,
    totalChugs: totalChugs ?? 0,
  });
}
