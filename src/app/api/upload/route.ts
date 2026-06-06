import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase";

const BUCKET = "bagel-videos";
const MAX_MB = 500;

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Not logged in" }, { status: 401 });
  }

  const form = await req.formData();
  const file = form.get("file") as File | null;
  const bagelId = form.get("bagel_id") as string | null;

  if (!file || !bagelId) {
    return NextResponse.json({ error: "file and bagel_id required" }, { status: 400 });
  }
  if (file.size > MAX_MB * 1024 * 1024) {
    return NextResponse.json({ error: `File exceeds ${MAX_MB}MB limit` }, { status: 413 });
  }

  const db = supabaseAdmin();

  // Verify the bagel belongs to this user
  const { data: bagel } = await db
    .from("bagels")
    .select("id, owner_user_id, video_path")
    .eq("id", bagelId)
    .single();

  if (!bagel) {
    return NextResponse.json({ error: "Bagel not found" }, { status: 404 });
  }
  if (bagel.owner_user_id !== session.sleeper_user_id) {
    return NextResponse.json({ error: "Not your bagel" }, { status: 403 });
  }

  // Delete old video if replacing
  if (bagel.video_path) {
    await db.storage.from(BUCKET).remove([bagel.video_path]);
  }

  const ext = file.name.split(".").pop() ?? "mp4";
  const path = `${session.sleeper_user_id}/${bagelId}.${ext}`;
  const bytes = await file.arrayBuffer();

  const { error: uploadError } = await db.storage
    .from(BUCKET)
    .upload(path, bytes, { contentType: file.type, upsert: true });

  if (uploadError) {
    return NextResponse.json({ error: uploadError.message }, { status: 500 });
  }

  const { data: signed } = await db.storage
    .from(BUCKET)
    .createSignedUrl(path, 60 * 60 * 24 * 365); // 1 year

  await db
    .from("bagels")
    .update({ video_path: path, video_url: signed?.signedUrl ?? null })
    .eq("id", bagelId);

  return NextResponse.json({ video_url: signed?.signedUrl });
}
