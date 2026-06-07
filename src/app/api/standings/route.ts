import { NextResponse } from "next/server";
import { getLeague } from "@/lib/sleeper";
import { getLeaderboard } from "@/lib/data";

export async function GET() {
  const league = await getLeague();
  const standings = await getLeaderboard(league.season);
  return NextResponse.json({ standings, season: league.season });
}
