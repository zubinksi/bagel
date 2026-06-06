"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

export default function AdminPage() {
  const [data, setData] = useState<Record<string, unknown> | null>(null);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [syncResult, setSyncResult] = useState<string | null>(null);
  const [week, setWeek] = useState<number | null>(null);
  const [queryWeek, setQueryWeek] = useState<string>("");

  async function load(w?: string) {
    setLoading(true);
    const url = w ? `/api/admin/debug?week=${w}` : "/api/admin/debug";
    const res = await fetch(url);
    const json = await res.json();
    setData(json);
    if (!w && json.league) setWeek(json.league.currentWeek);
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  async function triggerSync(w: number) {
    setSyncing(true);
    setSyncResult(null);
    const res = await fetch("/api/admin/debug", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ week: w }),
    });
    const json = await res.json();
    setSyncResult(JSON.stringify(json, null, 2));
    setSyncing(false);
    await load(String(w));
  }

  return (
    <div className="space-y-6 font-mono text-sm">
      <div className="flex items-center gap-4">
        <Link href="/" className="text-zinc-400 hover:text-white text-xs">← Home</Link>
        <h1 className="text-xl font-bold">Admin / Debug</h1>
      </div>

      {loading && <p className="text-zinc-400">Loading...</p>}

      {data && !loading && (
        <>
          {/* League info */}
          <section className="bg-zinc-900 rounded-lg p-4 space-y-1">
            <p className="text-zinc-400 text-xs uppercase tracking-wide mb-2">League</p>
            <pre className="text-green-400 text-xs">{JSON.stringify(data.league, null, 2)}</pre>
          </section>

          {/* Sync all weeks */}
          <section className="bg-zinc-900 rounded-lg p-4 space-y-3">
            <p className="text-zinc-400 text-xs uppercase tracking-wide">Sync a Week</p>
            <div className="flex gap-2 flex-wrap">
              {Array.from({ length: (data.league as {currentWeek: number}).currentWeek }, (_, i) => i + 1).map((w) => (
                <button
                  key={w}
                  onClick={() => triggerSync(w)}
                  disabled={syncing}
                  className="px-3 py-1 bg-zinc-700 hover:bg-green-700 rounded text-xs disabled:opacity-50"
                >
                  Week {w}
                </button>
              ))}
            </div>
            {syncing && <p className="text-yellow-400 text-xs">Syncing...</p>}
            {syncResult && (
              <pre className="text-xs bg-zinc-950 p-3 rounded overflow-auto max-h-40">{syncResult}</pre>
            )}
          </section>

          {/* Inspect a specific week */}
          <section className="bg-zinc-900 rounded-lg p-4 space-y-3">
            <p className="text-zinc-400 text-xs uppercase tracking-wide">
              Sleeper Matchup Data — Week {(data.queryWeek as number)}
            </p>
            <div className="flex gap-2">
              <input
                type="number"
                value={queryWeek}
                onChange={(e) => setQueryWeek(e.target.value)}
                placeholder="week number"
                className="bg-zinc-800 border border-zinc-700 rounded px-2 py-1 text-xs w-24"
              />
              <button
                onClick={() => load(queryWeek)}
                className="px-3 py-1 bg-zinc-700 hover:bg-zinc-500 rounded text-xs"
              >
                Inspect
              </button>
            </div>
            <p className="text-zinc-500 text-xs">{data.matchupCount as number} matchups returned</p>
            <pre className="text-xs bg-zinc-950 p-3 rounded overflow-auto max-h-96">
              {JSON.stringify(data.scoreBreakdown, null, 2)}
            </pre>
          </section>

          {/* DB state */}
          <section className="bg-zinc-900 rounded-lg p-4 space-y-2">
            <p className="text-zinc-400 text-xs uppercase tracking-wide">Synced Weeks in DB</p>
            <pre className="text-xs bg-zinc-950 p-3 rounded overflow-auto max-h-32">
              {JSON.stringify(data.syncedWeeks, null, 2)}
            </pre>
          </section>

          <section className="bg-zinc-900 rounded-lg p-4 space-y-2">
            <p className="text-zinc-400 text-xs uppercase tracking-wide">Bagels in DB</p>
            <pre className="text-xs bg-zinc-950 p-3 rounded overflow-auto max-h-64">
              {JSON.stringify(data.bagelsInDb, null, 2)}
            </pre>
          </section>
        </>
      )}
    </div>
  );
}
