import { getSession } from "@/lib/auth";
import { getLeague } from "@/lib/sleeper";
import Landing from "@/components/Landing";
import HomeFeed from "@/components/HomeFeed";

export const dynamic = "force-dynamic";

export default async function Home() {
  const session = await getSession();
  if (!session) return <Landing />;

  const league = await getLeague();
  return <HomeFeed initialWeek={league.settings.leg} season={league.season} />;
}
