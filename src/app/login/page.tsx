"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function LoginPage() {
  const [username, setUsername] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const res = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username: username.trim() }),
    });
    setLoading(false);
    if (!res.ok) {
      const j = await res.json();
      setError(j.error ?? "Login failed");
      return;
    }
    router.push("/");
    router.refresh();
  }

  return (
    <div className="min-h-screen flex flex-col px-6 py-12">
      {/* Back */}
      <Link href="/" className="text-zinc-500 text-sm mb-8 flex items-center gap-1">
        ← Back
      </Link>

      {/* Zero badge */}
      <div className="flex justify-center mb-6">
        <div className="w-16 h-16 rounded-full border-4 border-yellow-400 flex items-center justify-center">
          <span className="font-display text-3xl text-yellow-400 leading-none">0</span>
        </div>
      </div>

      <h1 className="font-display text-5xl text-center text-white mb-2">SIGN IN</h1>
      <p className="text-center text-zinc-400 text-sm mb-10">Enter your Sleeper username to claim your identity</p>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-zinc-400 text-xs uppercase tracking-widest mb-2">
            Sleeper Username
          </label>
          <input
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="your_username"
            autoCapitalize="off"
            autoCorrect="off"
            className="w-full bg-[#111113] border border-zinc-700 rounded-xl px-5 py-4 text-white text-lg placeholder-zinc-600 focus:outline-none focus:border-yellow-500 transition"
          />
        </div>

        {error && (
          <div className="bg-red-500/10 border border-red-500/30 rounded-xl px-4 py-3 text-sm text-red-400">
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={loading || !username.trim()}
          className="w-full bg-yellow-400 hover:bg-yellow-300 disabled:opacity-40 disabled:cursor-not-allowed text-black font-display text-2xl tracking-wider py-5 rounded-xl transition"
        >
          {loading ? "CHECKING..." : "SIGN IN WITH SLEEPER"}
        </button>
      </form>

      <p className="text-center text-zinc-600 text-xs mt-8">
        You must be a member of the league to sign in.<br />
        No password — your Sleeper account is your identity.
      </p>
    </div>
  );
}
