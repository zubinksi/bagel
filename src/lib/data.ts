import { supabaseAdmin } from "./supabase";
import type { Bagel, Rating } from "./supabase";

/** Trigger a sync for the given week via internal API call */
export async function syncWeek(week: number) {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  try {
    await fetch(`${baseUrl}/api/sync/${week}`, { method: "POST" });
  } catch {
    // sync failure is non-fatal — we still show whatever is in the DB
  }
}

/** Fetch all bagels for a week, with owner user and aggregated ratings */
export async function getBagelsForWeek(week: number, season: string) {
  const db = supabaseAdmin();
  const { data } = await db
    .from("bagels")
    .select("*, users(*), ratings(id, rater_user_id, score)")
    .eq("week", week)
    .eq("season", season)
    .order("created_at");

  return (data ?? []).map(withStats);
}

/** Fetch a single bagel with full rating details */
export async function getBagel(id: string) {
  const db = supabaseAdmin();
  const { data } = await db
    .from("bagels")
    .select("*, users(*), ratings(*, users(*))")
    .eq("id", id)
    .single();

  if (!data) return null;
  return withStats(data);
}

/** Season leaderboard: bagel counts per user */
export async function getLeaderboard(season: string) {
  const db = supabaseAdmin();
  const { data } = await db
    .from("bagels")
    .select("owner_user_id, users(username, display_name, avatar), ratings(score)")
    .eq("season", season);

  if (!data) return [];

  const map = new Map<
    string,
    {
      owner_user_id: string;
      display_name: string | null;
      username: string;
      avatar: string | null;
      bagels: number;
      videos: number;
      avg_rating: number | null;
    }
  >();

  for (const row of data as unknown as (Bagel & { users: { username: string; display_name: string | null; avatar: string | null }; ratings: { score: number }[] })[]) {
    const uid = row.owner_user_id;
    if (!map.has(uid)) {
      map.set(uid, {
        owner_user_id: uid,
        display_name: row.users?.display_name ?? null,
        username: row.users?.username ?? uid,
        avatar: row.users?.avatar ?? null,
        bagels: 0,
        videos: 0,
        avg_rating: null,
      });
    }
    const entry = map.get(uid)!;
    entry.bagels++;
  }

  return Array.from(map.values()).sort((a, b) => b.bagels - a.bagels);
}

/** Get all synced weeks for a season */
export async function getSyncedWeeks(season: string): Promise<number[]> {
  const db = supabaseAdmin();
  const { data } = await db
    .from("synced_weeks")
    .select("week")
    .eq("season", season)
    .order("week");
  return (data ?? []).map((r) => r.week);
}

function withStats(
  row: Bagel & { ratings?: Rating[] }
): Bagel & { avg_rating: number | null; rating_count: number } {
  const ratings = row.ratings ?? [];
  const scores = ratings.map((r) => r.score);
  const avg = scores.length ? scores.reduce((a, b) => a + b, 0) / scores.length : null;
  return { ...row, avg_rating: avg ? parseFloat(avg.toFixed(1)) : null, rating_count: scores.length };
}
