import { completeMultipartUpload } from "@vercel/blob";
import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  if (!process.env.BLOB_READ_WRITE_TOKEN) {
    return NextResponse.json({ error: "Blob storage not configured" }, { status: 500 });
  }

  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Not logged in" }, { status: 401 });

  const { bagel_id, pathname, uploadId, key, parts } = await req.json();
  if (!bagel_id || !pathname || !uploadId || !key || !parts?.length) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  const db = supabaseAdmin();
  const { data: bagel } = await db
    .from("bagels")
    .select("owner_user_id")
    .eq("id", bagel_id)
    .single();

  if (!bagel) return NextResponse.json({ error: "Bagel not found" }, { status: 404 });
  if (bagel.owner_user_id !== session.sleeper_user_id)
    return NextResponse.json({ error: "Not your bagel" }, { status: 403 });

  try {
    const blob = await completeMultipartUpload(pathname, parts, {
      uploadId,
      key,
      access: "public",
      token: process.env.BLOB_READ_WRITE_TOKEN,
    });
    await db.from("bagels").update({ video_url: blob.url, video_path: null }).eq("id", bagel_id);
    return NextResponse.json({ url: blob.url });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "MPU complete failed";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
