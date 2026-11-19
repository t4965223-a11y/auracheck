import Link from "next/link";
import { LiveLeaderboard } from "@/components/LiveLeaderboard";
import { getLeaderboard, getProfileCount } from "@/lib/queries";

export const revalidate = 10;

export default async function LeaderboardPage() {
  const [profiles, count] = await Promise.all([getLeaderboard(100), getProfileCount()]);

  return (
    <div className="shell pt-12 pb-10 sm:pt-16">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <span className="chip">
            <span className="live-dot" />
            live · updates every few seconds
          </span>
          <h1 className="mt-4 text-4xl font-bold tracking-[-0.04em] sm:text-5xl">
            Global <span className="neon-text">Aura</span> Leaderboard
          </h1>
          <p className="mt-3 max-w-lg text-[13.5px] leading-relaxed text-[#9a9eb8]">
            Every aura, ranked from radiant to radioactive. Scores are clamped to ±1000 and one
            visitor gets one vote per profile.
          </p>
        </div>
        <Link href="/#create" className="btn btn-primary">
          Check my aura
        </Link>
      </div>

      <div className="mt-8 grid gap-3 sm:grid-cols-3">
        {[
          { k: "ranked profiles", v: count.toLocaleString() },
          { k: "ceiling", v: "+1000" },
          { k: "floor", v: "−1000" },
        ].map((stat) => (
          <div
            key={stat.k}
            className="rounded-2xl border border-white/[0.07] bg-white/[0.03] px-4 py-3"
          >
            <p className="mono text-[9.5px] uppercase tracking-[0.16em] text-[#7d81a0]">{stat.k}</p>
            <p className="mt-1 text-lg font-semibold tracking-tight">{stat.v}</p>
          </div>
        ))}
      </div>

      <div className="glass mt-4 p-2 sm:p-3">
        <LiveLeaderboard initial={profiles} limit={100} />
      </div>

      <p className="mono mt-6 text-center text-[10.5px] uppercase tracking-[0.16em] text-[#5e6280]">
        cached at the edge · no paywall, ever
      </p>
    </div>
  );
}
