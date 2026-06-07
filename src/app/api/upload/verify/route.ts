import { list } from "@vercel/blob";
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

  const { blobs } = await list({
    token: process.env.BLOB_READ_WRITE_TOKEN,
    prefix: pathname,
    limit: 1,
  });

  if (!blobs.length) {
    return NextResponse.json({ error: "Blob not found" }, { status: 404 });
  }

  return NextResponse.json({ url: blobs[0].url });
}
