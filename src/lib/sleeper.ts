const BASE = "https://api.sleeper.app/v1";
const LEAGUE_ID = process.env.SLEEPER_LEAGUE_ID!;

async function get<T>(path: string): Promise<T> {
  const res = await fetch(`${BASE}${path}`, { next: { revalidate: 60 } });
  if (!res.ok) throw new Error(`Sleeper API error ${res.status}: ${path}`);
  return res.json();
}

export type SleeperUser = {
  user_id: string;
  username: string;
  display_name: string;
  avatar: string | null;
  metadata?: Record<string, string>;
  is_owner?: boolean;
};

export type SleeperRoster = {
  roster_id: number;
  owner_id: string;
  players: string[];
  starters: string[];
};

export type SleeperMatchup = {
  roster_id: number;
  matchup_id: number;
  points: number;
  starters: string[];
  starters_points: number[];
  players: string[];
  players_points: Record<string, number>;
};

export type SleeperLeague = {
  league_id: string;
  season: string;
  status: string; // "pre_draft" | "drafting" | "in_season" | "complete"
  sport: string;
  total_rosters: number;
  settings: { leg: number }; // leg = current week
};

export type SleeperPlayer = {
  first_name: string;
  last_name: string;
  full_name?: string;
  position: string;
  team: string | null;
};

export function getLeague() {
  return get<SleeperLeague>(`/league/${LEAGUE_ID}`);
}

export function getLeagueUsers() {
  return get<SleeperUser[]>(`/league/${LEAGUE_ID}/users`);
}

export function getLeagueRosters() {
  return get<SleeperRoster[]>(`/league/${LEAGUE_ID}/rosters`);
}

export function getMatchups(week: number) {
  return get<SleeperMatchup[]>(`/league/${LEAGUE_ID}/matchups/${week}`);
}

export function getUserByUsername(username: string) {
  return get<SleeperUser>(`/user/${username}`);
}

// Returns all NFL players — large payload, use sparingly
export function getAllPlayers(): Promise<Record<string, SleeperPlayer>> {
  return get<Record<string, SleeperPlayer>>(`/players/nfl`);
}

export function avatarUrl(avatarId: string | null) {
  if (!avatarId) return null;
  return `https://sleepercdn.com/avatars/thumbs/${avatarId}`;
}
