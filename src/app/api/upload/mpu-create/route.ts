import { generateClientTokenFromReadWriteToken } from "@vercel/blob/client";
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
    const clientToken = await generateClientTokenFromReadWriteToken({
      pathname,
      addRandomSuffix: false,
      allowOverwrite: true,
      allowedContentTypes: ["video/*"],
      validUntil: Date.now() + 30 * 60 * 1000, // 30 min — enough for large uploads
      token: process.env.BLOB_READ_WRITE_TOKEN,
    });
    return NextResponse.json({ clientToken, pathname });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Token generation failed";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
