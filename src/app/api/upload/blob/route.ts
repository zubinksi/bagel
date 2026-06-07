import { handleUpload, type HandleUploadBody } from "@vercel/blob/client";
import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest): Promise<NextResponse> {
  // Surface missing env var immediately so it shows in Vercel logs
  if (!process.env.BLOB_READ_WRITE_TOKEN) {
    console.error("[upload/blob] BLOB_READ_WRITE_TOKEN is not set");
    return NextResponse.json({ error: "Blob storage not configured (missing BLOB_READ_WRITE_TOKEN)" }, { status: 500 });
  }

  const body = (await request.json()) as HandleUploadBody;
  console.log("[upload/blob] request type:", (body as any).type);

  try {
    const jsonResponse = await handleUpload({
      body,
      request,
      onBeforeGenerateToken: async (_pathname, clientPayload) => {
        const session = await getSession();
        if (!session) throw new Error("Not logged in");

        const bagelId = clientPayload;
        const db = supabaseAdmin();
        const { data: bagel } = await db
          .from("bagels")
          .select("owner_user_id")
          .eq("id", bagelId)
          .single();

        if (!bagel) throw new Error("Bagel not found");
        if (bagel.owner_user_id !== session.sleeper_user_id)
          throw new Error("Not your bagel");

        return {
          allowedContentTypes: ["video/mp4", "video/quicktime", "video/mov", "video/webm", "video/*"],
          maximumSizeInBytes: 500 * 1024 * 1024,
          tokenPayload: JSON.stringify({ bagelId }),
        };
      },
      onUploadCompleted: async ({ blob, tokenPayload }) => {
        const { bagelId } = JSON.parse(tokenPayload ?? "{}");
        if (!bagelId) return;
        const db = supabaseAdmin();
        await db
          .from("bagels")
          .update({ video_url: blob.url, video_path: blob.pathname })
          .eq("id", bagelId);
      },
    });

    return NextResponse.json(jsonResponse);
  } catch (error) {
    console.error("[upload/blob] error:", (error as Error).message);
    return NextResponse.json({ error: (error as Error).message }, { status: 400 });
  }
}
