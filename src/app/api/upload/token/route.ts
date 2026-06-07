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

  const { bagel_id, file_ext } = await req.json();
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

  // addRandomSuffix: false keeps the pathname predictable so the client can
  // construct the blob URL directly when iOS Safari fires onerror on the response.
  const clientToken = await generateClientTokenFromReadWriteToken({
    token: process.env.BLOB_READ_WRITE_TOKEN,
    pathname,
    addRandomSuffix: false,
    allowOverwrite: true,
    allowedContentTypes: ["video/mp4", "video/quicktime", "video/mov", "video/webm", "video/*"],
    maximumSizeInBytes: 500 * 1024 * 1024,
    validUntil: Date.now() + 30 * 60 * 1000,
  });

  // storeId is the 4th segment of the read-write token (vercel_blob_rw_<storeId>_...)
  const storeId = process.env.BLOB_READ_WRITE_TOKEN.split("_")[3] ?? "";
  const blobUrl = `https://${storeId}.public.blob.vercel-storage.com/${pathname}`;

  return NextResponse.json({ clientToken, pathname, blobUrl });
}
