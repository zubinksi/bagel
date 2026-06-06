import { NextRequest, NextResponse } from "next/server";
import { createSession } from "@/lib/auth";
import { getUserByUsername, getLeagueUsers } from "@/lib/sleeper";
import { supabaseAdmin } from "@/lib/supabase";

export async function POST(req: NextRequest) {
  const { username } = await req.json();
  if (!username?.trim()) {
    return NextResponse.json({ error: "Username required" }, { status: 400 });
  }

  // Look up user on Sleeper
  let sleeperUser;
  try {
    sleeperUser = await getUserByUsername(username.trim().toLowerCase());
  } catch {
    return NextResponse.json({ error: "Sleeper user not found" }, { status: 404 });
  }

  // Confirm they're in this league
  const leagueUsers = await getLeagueUsers();
  const inLeague = leagueUsers.some((u) => u.user_id === sleeperUser.user_id);
  if (!inLeague) {
    return NextResponse.json(
      { error: "That Sleeper account is not in this league" },
      { status: 403 }
    );
  }

  // Upsert into our users table
  const db = supabaseAdmin();
  const resolvedUsername =
    sleeperUser.username ?? sleeperUser.display_name ?? sleeperUser.user_id;

  await db.from("users").upsert(
    {
      sleeper_user_id: sleeperUser.user_id,
      username: resolvedUsername,
      display_name: sleeperUser.display_name ?? null,
      avatar: sleeperUser.avatar ?? null,
    },
    { onConflict: "sleeper_user_id" }
  );

  await createSession({
    sleeper_user_id: sleeperUser.user_id,
    username: resolvedUsername,
    display_name: sleeperUser.display_name ?? null,
  });

  return NextResponse.json({ ok: true });
}
