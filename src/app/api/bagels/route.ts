import { NextRequest, NextResponse } from "next/server";
import { getLeague } from "@/lib/sleeper";
import { getBagelsForWeek, syncWeek } from "@/lib/data";
import { getSession } from "@/lib/auth";

export async function GET(req: NextRequest) {
  const weekParam = req.nextUrl.searchParams.get("week");
  const league = await getLeague();
  const week = weekParam ? parseInt(weekParam) : league.settings.leg;

  await syncWeek(week);

  const bagels = await getBagelsForWeek(week, league.season);
  const session = await getSession();

  return NextResponse.json({ bagels, week, season: league.season, currentWeek: league.settings.leg, session });
}
