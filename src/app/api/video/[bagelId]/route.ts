import { issueSignedToken, presignUrl } from "@vercel/blob";
import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";

export const dynamic = "force-dynamic";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ bagelId: string }> },
) {
  if (!process.env.BLOB_READ_WRITE_TOKEN) {
    return NextResponse.json({ error: "Blob storage not configured" }, { status: 500 });
  }

  const { bagelId } = await params;
  const db = supabaseAdmin();
  const { data: bagel } = await db
    .from("bagels")
    .select("video_path")
    .eq("id", bagelId)
    .single();

  if (!bagel?.video_path) {
    return NextResponse.json({ error: "Video not found" }, { status: 404 });
  }

  const validUntil = Date.now() + 3_600_000; // 1 hour

  try {
    const signedToken = await issueSignedToken({
      pathname: bagel.video_path,
      operations: ["get"],
      validUntil,
      token: process.env.BLOB_READ_WRITE_TOKEN,
    });

    const { presignedUrl } = await presignUrl(signedToken, {
      operation: "get",
      pathname: bagel.video_path,
      validUntil,
      access: "private",
    });

    return NextResponse.redirect(presignedUrl, 307);
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Failed to generate video URL";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
