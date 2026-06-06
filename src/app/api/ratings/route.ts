import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase";

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Not logged in" }, { status: 401 });
  }

  const { bagel_id, score } = await req.json();
  if (!bagel_id || typeof score !== "number" || score < 1 || score > 10) {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }

  const db = supabaseAdmin();

  // Prevent self-rating
  const { data: bagel } = await db
    .from("bagels")
    .select("owner_user_id")
    .eq("id", bagel_id)
    .single();

  if (!bagel) {
    return NextResponse.json({ error: "Bagel not found" }, { status: 404 });
  }
  if (bagel.owner_user_id === session.sleeper_user_id) {
    return NextResponse.json({ error: "You can't rate your own bagel" }, { status: 403 });
  }

  const { data, error } = await db
    .from("ratings")
    .upsert(
      {
        bagel_id,
        rater_user_id: session.sleeper_user_id,
        score,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "bagel_id,rater_user_id" }
    )
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}
