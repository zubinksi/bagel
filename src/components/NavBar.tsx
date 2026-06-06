"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import type { SessionUser } from "@/lib/auth";

export default function NavBar() {
  const [user, setUser] = useState<SessionUser | null | undefined>(undefined);

  useEffect(() => {
    fetch("/api/auth/me")
      .then((r) => r.json())
      .then(setUser);
  }, []);

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    window.location.href = "/login";
  }

  return (
    <nav className="bg-zinc-900 border-b border-zinc-800 px-4 py-3 flex items-center justify-between">
      <Link href="/" className="flex items-center gap-2 text-white font-bold text-xl">
        <span className="text-3xl">🥯</span>
        <span>Bagel Board</span>
      </Link>

      <div className="flex items-center gap-4">
        {user === undefined ? null : user ? (
          <>
            <span className="text-zinc-400 text-sm hidden sm:block">
              {user.display_name ?? user.username}
            </span>
            <button
              onClick={logout}
              className="text-sm text-zinc-400 hover:text-white transition"
            >
              Sign out
            </button>
          </>
        ) : (
          <Link
            href="/login"
            className="text-sm bg-green-600 hover:bg-green-500 text-white px-3 py-1.5 rounded-md transition"
          >
            Sign in
          </Link>
        )}
      </div>
    </nav>
  );
}
