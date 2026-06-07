import { generateClientTokenFromReadWriteToken } from "@vercel/blob/client";
import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest): Promise<NextResponse> {
  if (!process.env.BLOB_READ_WRITE_TOKEN) {
    return NextResponse.json({ error: "Blob storage not configured" }, { status: 500 });
  }

  const body = await request.json();

  // Completion ping from Vercel Blob — return immediately.
  // The client calls /api/upload/complete to persist the URL after upload() resolves.
  if (body.type === "blob.upload-completed") {
    return NextResponse.json({ ok: true });
  }

  // Token generation request from the client (blob.generate-client-token)
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Not logged in" }, { status: 401 });

  const bagelId = body.payload?.clientPayload;
  const pathname = body.payload?.pathname;
  const multipart = body.payload?.multipart ?? false;

  if (!bagelId || !pathname) {
    return NextResponse.json({ error: "bagelId and pathname required" }, { status: 400 });
  }

  const db = supabaseAdmin();
  const { data: bagel } = await db
    .from("bagels")
    .select("owner_user_id")
    .eq("id", bagelId)
    .single();

  if (!bagel) return NextResponse.json({ error: "Bagel not found" }, { status: 404 });
  if (bagel.owner_user_id !== session.sleeper_user_id) {
    return NextResponse.json({ error: "Not your bagel" }, { status: 403 });
  }

  const clientToken = await generateClientTokenFromReadWriteToken({
    token: process.env.BLOB_READ_WRITE_TOKEN,
    pathname,
    allowedContentTypes: ["video/mp4", "video/quicktime", "video/mov", "video/webm", "video/*"],
    maximumSizeInBytes: 500 * 1024 * 1024,
    validUntil: Date.now() + 30 * 60 * 1000,
  });

  return NextResponse.json({ clientToken });
}
