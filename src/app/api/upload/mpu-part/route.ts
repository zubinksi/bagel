import { uploadPart } from "@vercel/blob";
import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  if (!process.env.BLOB_READ_WRITE_TOKEN) {
    return NextResponse.json({ error: "Blob storage not configured" }, { status: 500 });
  }

  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Not logged in" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const uploadId = searchParams.get("uploadId");
  const key = searchParams.get("key");
  const pathname = searchParams.get("pathname");
  const partNumber = parseInt(searchParams.get("partNumber") ?? "0", 10);

  if (!uploadId || !key || !pathname || !partNumber) {
    return NextResponse.json({ error: "uploadId, key, pathname, partNumber required" }, { status: 400 });
  }

  // Stream the request body directly to Vercel Blob — no full-body buffering
  const body = await req.arrayBuffer();

  try {
    const result = await uploadPart(pathname, body, {
      uploadId,
      key,
      partNumber,
      access: "private",
      token: process.env.BLOB_READ_WRITE_TOKEN,
    });
    return NextResponse.json({ etag: result.etag, partNumber });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "MPU part upload failed";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
