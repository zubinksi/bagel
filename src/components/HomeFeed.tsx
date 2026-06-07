"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import type { Bagel } from "@/lib/supabase";
import BagelFeedCard from "./BagelFeedCard";

type WeekData = { week: number; bagel_count: number };
type SessionUser = { sleeper_user_id: string; username: string; display_name: string | null };

type StandingsRow = {
  owner_user_id: string;
  display_name: string | null;
  username: string;
  avatar: string | null;
  bagels: number;
  avg_rating?: number | null;
};

export default function HomeFeed({ initialWeek, season }: { initialWeek: number; season: string }) {
  const [weeks, setWeeks] = useState<WeekData[]>([]);
  const [selectedWeek, setSelectedWeek] = useState(initialWeek);
  const [bagels, setBagels] = useState<(Bagel & { avg_rating: number | null; rating_count: number })[]>([]);
  const [standings, setStandings] = useState<StandingsRow[]>([]);
  const [session, setSession] = useState<SessionUser | null>(null);
  const [loadingBagels, setLoadingBagels] = useState(true);
  const weekScrollRef = useRef<HTMLDivElement>(null);

  // Load everything on mount
  useEffect(() => {
    Promise.all([
      fetch("/api/weeks").then((r) => r.json()),
      fetch("/api/auth/me").then((r) => r.json()),
      fetch("/api/standings").then((r) => r.json()),
    ]).then(([weeksData, sessionData, standingsData]) => {
      setWeeks(weeksData.weeks ?? []);
      setSession(sessionData);
      setStandings(standingsData.standings ?? []);
    });
  }, []);

  // Load bagels when week changes
  useEffect(() => {
    setLoadingBagels(true);
    fetch(`/api/bagels?week=${selectedWeek}`)
      .then((r) => r.json())
      .then((data) => {
        setBagels(data.bagels ?? []);
        setLoadingBagels(false);
      });
  }, [selectedWeek]);

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    window.location.reload();
  }

  const weekBagelCount = bagels.length;
  const chugsPosted = bagels.filter((b) => b.video_url).length;

  return (
    <div className="pb-8">
      {/* Header */}
      <div className="flex items-center justify-between px-4 pt-5 pb-4">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full border-2 border-yellow-400 flex items-center justify-center">
            <span className="font-display text-sm text-yellow-400 leading-none">0</span>
          </div>
          <span className="font-display text-2xl text-white tracking-wide">BAGEL WATCH</span>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 bg-red-500/20 border border-red-500/50 rounded-full px-3 py-1">
            <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
            <span className="font-display text-sm text-red-400 tracking-wider">LIVE · WEEK {initialWeek}</span>
          </div>
          <button onClick={logout} className="text-zinc-500 hover:text-zinc-300 text-xs transition">
            {session?.display_name ?? session?.username ?? "Sign out"}
          </button>
        </div>
      </div>

      {/* Week summary card */}
      <div className="mx-4 mb-4 bg-[#111113] rounded-2xl p-5 border border-zinc-800">
        <p className="text-zinc-500 text-xs uppercase tracking-widest mb-1">Goose eggs this week</p>
        <div className="flex items-end justify-between">
          <div>
            <h2 className="font-display text-5xl text-white leading-none">WEEK {selectedWeek}</h2>
            <p className="text-zinc-400 text-sm mt-1">
              {weekBagelCount} starters · {chugsPosted} chugs posted
            </p>
          </div>
          <div className="text-right">
            <span className="font-display text-6xl text-yellow-400 leading-none">{weekBagelCount}</span>
            <p className="text-zinc-500 text-xs uppercase tracking-widest">Bagels</p>
          </div>
        </div>
      </div>

      {/* Week browser - horizontal scroll, most recent first */}
      {weeks.length > 0 && (
        <div className="mb-4">
          <div className="flex items-center justify-between px-4 mb-2">
            <span className="text-zinc-500 text-xs uppercase tracking-widest">Browse Weeks</span>
            <span className="text-zinc-600 text-xs">{season} Season</span>
          </div>
          <div ref={weekScrollRef} className="flex gap-2 overflow-x-auto px-4 pb-1 scrollbar-none" style={{ scrollbarWidth: "none" }}>
            {weeks.map((w) => (
              <button
                key={w.week}
                onClick={() => setSelectedWeek(w.week)}
                className={[
                  "shrink-0 flex flex-col items-center justify-center w-16 h-16 rounded-xl transition",
                  selectedWeek === w.week
                    ? "bg-yellow-400 text-black"
                    : "bg-[#111113] text-white border border-zinc-800",
                ].join(" ")}
              >
                <span className="font-display text-2xl leading-none">{w.week}</span>
                <span className={`text-xs leading-none mt-0.5 ${selectedWeek === w.week ? "text-black/60" : "text-zinc-500"}`}>
                  {w.bagel_count} BGL
                </span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Bagel feed */}
      <div className="px-4 mb-6">
        <div className="flex items-center justify-between mb-3">
          <span className="text-zinc-400 text-xs uppercase tracking-widest">Week {selectedWeek} Box Scores</span>
          <span className="text-yellow-400 text-xs">{weekBagelCount} BAGELS</span>
        </div>
        {loadingBagels ? (
          <div className="flex items-center justify-center py-12 text-zinc-600">
            <span className="font-display text-2xl animate-pulse">LOADING...</span>
          </div>
        ) : bagels.length === 0 ? (
          <div className="bg-[#111113] rounded-xl p-10 text-center border border-zinc-800">
            <div className="font-display text-5xl text-zinc-700 mb-2">0</div>
            <p className="text-zinc-500 text-sm">No bagels this week</p>
          </div>
        ) : (
          <div className="space-y-2">
            {bagels.map((bagel) => (
              <BagelFeedCard key={bagel.id} bagel={bagel} />
            ))}
          </div>
        )}
      </div>

      {/* Season standings */}
      {standings.length > 0 && (
        <div className="px-4">
          <div className="flex items-center justify-between mb-3">
            <span className="text-zinc-400 text-xs uppercase tracking-widest">Season Standings</span>
            <span className="text-zinc-600 text-xs">{season}</span>
          </div>
          <div className="bg-[#111113] rounded-xl border border-zinc-800 overflow-hidden">
            <div className="grid grid-cols-[auto_1fr_auto_auto] gap-0 text-zinc-600 text-[10px] uppercase tracking-widest border-b border-zinc-800 px-4 py-2">
              <span className="w-6">#</span>
              <span className="px-3">Owner</span>
              <span className="w-10 text-center">BGL</span>
              <span className="w-10 text-center">PEN</span>
            </div>
            {standings.map((row, i) => (
              <div key={row.owner_user_id} className="grid grid-cols-[auto_1fr_auto_auto] items-center gap-0 px-4 py-3 border-b border-zinc-800/50 last:border-0">
                <span className="w-6 text-zinc-500 font-display text-lg">{i + 1}</span>
                <div className="px-3 flex items-center gap-2">
                  <div className="w-7 h-7 rounded-full bg-zinc-700 flex items-center justify-center text-xs font-display">
                    {(row.display_name ?? row.username).slice(0, 2).toUpperCase()}
                  </div>
                  <span className="font-display text-base text-white truncate">
                    {row.display_name ?? row.username}
                  </span>
                </div>
                <span className={`w-10 text-center font-display text-xl ${i === 0 ? "text-yellow-400" : "text-white"}`}>
                  {row.bagels}
                </span>
                <span className="w-10 text-center text-zinc-500 text-sm">
                  {row.avg_rating ? row.avg_rating.toFixed(1) : "—"}
                </span>
              </div>
            ))}
          </div>
          <p className="text-center text-zinc-700 text-xs mt-3">
            ▲ climbing the shame board · ▼ cleaning up their act
          </p>
        </div>
      )}
    </div>
  );
}
