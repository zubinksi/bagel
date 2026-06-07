import { NextRequest, NextResponse } from "next/server";
import { getBagel } from "@/lib/data";

export const dynamic = "force-dynamic";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const bagel = await getBagel(id);
  if (!bagel) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ bagel });
}
