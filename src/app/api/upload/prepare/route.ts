import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase";

const BUCKET = "bagel-videos";

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Not logged in" }, { status: 401 });

  const { bagel_id, file_ext } = await req.json();
  if (!bagel_id) return NextResponse.json({ error: "bagel_id required" }, { status: 400 });

  const db = supabaseAdmin();
  const { data: bagel } = await db
    .from("bagels")
    .select("id, owner_user_id, video_path")
    .eq("id", bagel_id)
    .single();

  if (!bagel) return NextResponse.json({ error: "Bagel not found" }, { status: 404 });
  if (bagel.owner_user_id !== session.sleeper_user_id)
    return NextResponse.json({ error: "Not your bagel" }, { status: 403 });

  // Delete old video if replacing
  if (bagel.video_path) {
    await db.storage.from(BUCKET).remove([bagel.video_path]);
  }

  // Ensure the bucket exists (creates it if not, ignores error if it already does)
  await db.storage.createBucket(BUCKET, { public: false }).catch(() => {});

  const ext = file_ext ?? "mp4";
  const path = `${session.sleeper_user_id}/${bagel_id}.${ext}`;

  const { data, error } = await db.storage.from(BUCKET).createSignedUploadUrl(path);
  if (error || !data) {
    return NextResponse.json({ error: error?.message ?? "Failed to create upload URL" }, { status: 500 });
  }

  return NextResponse.json({ signed_url: data.signedUrl, token: data.token, path });
}
