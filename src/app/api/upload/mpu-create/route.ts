import { createMultipartUpload } from "@vercel/blob";
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

  const { bagel_id, file_ext, content_type } = await req.json();
  if (!bagel_id) return NextResponse.json({ error: "bagel_id required" }, { status: 400 });

  const db = supabaseAdmin();
  const { data: bagel } = await db
    .from("bagels")
    .select("owner_user_id")
    .eq("id", bagel_id)
    .single();

  if (!bagel) return NextResponse.json({ error: "Bagel not found" }, { status: 404 });
  if (bagel.owner_user_id !== session.sleeper_user_id)
    return NextResponse.json({ error: "Not your bagel" }, { status: 403 });

  const pathname = `bagels/${bagel_id}-${Date.now()}.${file_ext ?? "mp4"}`;

  try {
    const { uploadId, key } = await createMultipartUpload(pathname, {
      access: "public",
      addRandomSuffix: false,
      allowOverwrite: true,
      contentType: content_type ?? "video/mp4",
      token: process.env.BLOB_READ_WRITE_TOKEN,
    });
    return NextResponse.json({ uploadId, key, pathname });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "MPU create failed";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
