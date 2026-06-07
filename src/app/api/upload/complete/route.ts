import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase";

const BUCKET = "bagel-videos";

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Not logged in" }, { status: 401 });

  const { bagel_id, video_url, path } = await req.json();
  if (!bagel_id) return NextResponse.json({ error: "bagel_id required" }, { status: 400 });

  const db = supabaseAdmin();
  const { data: bagel } = await db
    .from("bagels")
    .select("id, owner_user_id")
    .eq("id", bagel_id)
    .single();

  if (!bagel) return NextResponse.json({ error: "Bagel not found" }, { status: 404 });
  if (bagel.owner_user_id !== session.sleeper_user_id)
    return NextResponse.json({ error: "Not your bagel" }, { status: 403 });

  // Vercel Blob: URL is passed directly
  if (video_url) {
    await db.from("bagels").update({ video_url, video_path: path ?? null }).eq("id", bagel_id);
    return NextResponse.json({ video_url });
  }

  // Supabase Storage (legacy): generate a signed URL from path
  if (!path) return NextResponse.json({ error: "video_url or path required" }, { status: 400 });

  const { data: signed, error: signError } = await db.storage
    .from(BUCKET)
    .createSignedUrl(path, 60 * 60 * 24 * 365);

  if (signError || !signed?.signedUrl) {
    return NextResponse.json({ error: signError?.message ?? "Failed to create download URL" }, { status: 500 });
  }

  await db.from("bagels").update({ video_path: path, video_url: signed.signedUrl }).eq("id", bagel_id);
  return NextResponse.json({ video_url: signed.signedUrl });
}
