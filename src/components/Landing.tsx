import Link from "next/link";
import { supabaseAdmin } from "@/lib/supabase";
import { getLeague } from "@/lib/sleeper";

export default async function Landing() {
  const db = supabaseAdmin();
  const league = await getLeague();

  const { count: totalBagels } = await db.from("bagels").select("*", { count: "exact", head: true });
  const { count: totalChugs } = await db.from("bagels").select("*", { count: "exact", head: true }).not("video_url", "is", null);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6 py-12 text-center">
      {/* Zero badge */}
      <div className="w-20 h-20 rounded-full border-4 border-yellow-400 flex items-center justify-center mb-6">
        <span className="font-display text-4xl text-yellow-400 leading-none">0</span>
      </div>

      {/* Title */}
      <h1 className="font-display text-7xl text-white leading-none tracking-wide mb-3">
        BAGEL<br />WATCH
      </h1>
      <p className="text-zinc-400 text-base max-w-xs leading-relaxed mb-10">
        The league&apos;s official record of every starter who scored zero points — and the beer chugs that follow.
      </p>

      {/* Stats */}
      <div className="flex w-full max-w-xs mb-10">
        <div className="flex-1 flex flex-col items-center py-4">
          <span className="font-display text-4xl text-yellow-400">{totalBagels ?? 0}</span>
          <span className="text-zinc-500 text-xs uppercase tracking-widest mt-1">Bagels</span>
        </div>
        <div className="w-px bg-zinc-800" />
        <div className="flex-1 flex flex-col items-center py-4">
          <span className="font-display text-4xl text-yellow-400">{totalChugs ?? 0}</span>
          <span className="text-zinc-500 text-xs uppercase tracking-widest mt-1">Chugs</span>
        </div>
        <div className="w-px bg-zinc-800" />
        <div className="flex-1 flex flex-col items-center py-4">
          <span className="font-display text-4xl text-yellow-400">0</span>
          <span className="text-zinc-500 text-xs uppercase tracking-widest mt-1">Excuses</span>
        </div>
      </div>

      {/* CTA */}
      <Link
        href="/login"
        className="w-full max-w-xs bg-yellow-400 hover:bg-yellow-300 text-black font-display text-2xl tracking-wider py-5 rounded-xl flex items-center justify-center gap-3 transition"
      >
        <span>👤</span> SIGN IN WITH SLEEPER
      </Link>
      <p className="text-zinc-600 text-xs mt-4">
        Connect your league · {league.season} season live now
      </p>
    </div>
  );
}
