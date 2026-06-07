import { createClient } from "@supabase/supabase-js";

export type User = {
  sleeper_user_id: string;
  username: string;
  display_name: string | null;
  avatar: string | null;
};

export type Bagel = {
  id: string;
  week: number;
  season: string;
  roster_id: number;
  owner_user_id: string;
  player_id: string;
  player_name: string;
  video_url: string | null;
  video_path: string | null;
  created_at: string;
  proj_pts?: number | null;
  snaps?: number | null;
  touches?: number | null;
  users?: User;
  ratings?: Rating[];
  avg_rating?: number | null;
  rating_count?: number;
};

export type Rating = {
  id: string;
  bagel_id: string;
  rater_user_id: string;
  score: number;
  updated_at: string;
  users?: User;
};

// Lazy clients — created on first call so env vars are read at runtime, not build time
let _anon: ReturnType<typeof createClient> | null = null;

export function supabase() {
  if (!_anon) {
    _anon = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );
  }
  return _anon;
}

// Server-side only — bypasses RLS
export function supabaseAdmin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}
