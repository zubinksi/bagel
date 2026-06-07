import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  if (!process.env.BLOB_READ_WRITE_TOKEN) {
    return NextResponse.json({ error: "Blob storage not configured" }, { status: 500 });
  }

  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Not logged in" }, { status: 401 });

  const { pathname } = await req.json();
  if (!pathname) return NextResponse.json({ error: "pathname required" }, { status: 400 });

  const storeId = process.env.BLOB_READ_WRITE_TOKEN.split("_")[3] ?? "";
  const url = `https://${storeId}.public.blob.vercel-storage.com/${pathname}`;

  // HEAD the CDN URL directly — faster and more consistent than list()
  try {
    const headRes = await fetch(url, { method: "HEAD" });
    if (headRes.ok) {
      return NextResponse.json({ url });
    }
  } catch {
    // network error hitting CDN — fall through to return 404
  }

  return NextResponse.json({ error: "Blob not found", url }, { status: 404 });
}
