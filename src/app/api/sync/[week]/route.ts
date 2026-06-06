import { NextRequest, NextResponse } from "next/server";
import { runSync } from "@/lib/sync";

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ week: string }> }
) {
  const { week: weekStr } = await params;
  const week = parseInt(weekStr, 10);
  if (isNaN(week) || week < 1 || week > 18) {
    return NextResponse.json({ error: "Invalid week" }, { status: 400 });
  }
  const result = await runSync(week);
  return NextResponse.json(result);
}
