"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { auraTier, formatAura, initials } from "@/lib/aura";
import type { Profile } from "@/lib/types";

type Props = {
  initial: Profile[];
  limit?: number;
};

export function LiveLeaderboard({ initial, limit = 10 }: Props) {
  const [profiles, setProfiles] = useState<Profile[]>(initial);
  const [live, setLive] = useState(true);
  const [updatedAt, setUpdatedAt] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function tick() {
      if (typeof document !== "undefined" && document.visibilityState !== "visible") return;
      try {
        const res = await fetch(`/api/leaderboard?limit=${limit}`);
        if (!res.ok) throw new Error("bad response");
        const data = (await res.json()) as { profiles: Profile[]; updatedAt: string };
        if (cancelled) return;
        setProfiles(data.profiles ?? []);
        setUpdatedAt(data.updatedAt);
        setLive(true);
      } catch {
        if (!cancelled) setLive(false);
      }
    }

    const timer = setInterval(tick, 20_000);
    document.addEventListener("visibilitychange", tick);
    return () => {
      cancelled = true;
      clearInterval(timer);
      document.removeEventListener("visibilitychange", tick);
    };
  }, [limit]);

  if (profiles.length === 0) {
    return (
      <div className="px-4 py-10 text-center">
        <p className="text-[14px] font-medium">No auras on the board yet.</p>
        <p className="mx-auto mt-1.5 max-w-[15rem] text-[12px] leading-relaxed text-[#8f93ad]">
          The first profile automatically takes the #1 spot. Low effort, eternal glory.
        </p>
        <Link href="/#create" className="btn btn-ghost mt-4 !py-2 !text-[12px]">
          Claim #1
        </Link>
      </div>
    );
  }

  return (
    <div>
      <div className="divide-y divide-white/[0.05]">
        {profiles.map((profile, index) => {
          const tier = auraTier(profile.aura);
          const tone =
            profile.aura > 25 ? "score-pos" : profile.aura < -25 ? "score-neg" : "score-mid";
          return (
            <Link
              key={profile.id}
              href={`/profile/${profile.id}`}
              className="row"
              aria-label={`${profile.display_name}, ${formatAura(profile.aura)} aura`}
            >
              <span
                className="rank"
                style={
                  index === 0
                    ? { color: "#ffd166" }
                    : index === 1
                      ? { color: "#d7dbe8" }
                      : index === 2
                        ? { color: "#e09a5a" }
                        : undefined
                }
              >
                {String(index + 1).padStart(2, "0")}
              </span>

              <span className="avatar-ring block h-11 w-11">
                {profile.image_url ? (
                  /* eslint-disable-next-line @next/next/no-img-element */
                  <img
                    src={profile.image_url}
                    alt=""
                    loading="lazy"
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <span className="grid h-full w-full place-items-center text-[13px] font-semibold text-white/80">
                    {initials(profile.display_name) || "A"}
                  </span>
                )}
              </span>

              <span className="min-w-0">
                <span className="block truncate text-[13.5px] font-medium">
                  {profile.display_name}
                </span>
                <span className="mono block truncate text-[10px] uppercase tracking-[0.1em] text-[#7d81a0]">
                  {profile.vote_count} {profile.vote_count === 1 ? "vote" : "votes"} · {tier.label}
                </span>
              </span>

              <span className={`score text-[15px] ${tone}`}>{formatAura(profile.aura)}</span>
            </Link>
          );
        })}
      </div>

      <div className="mono mt-2 flex items-center justify-between px-3 text-[9.5px] uppercase tracking-[0.14em] text-[#5e6280]">
        <span className={live ? "" : "text-[#ff8abf]"}>{live ? "live" : "reconnecting"}</span>
        <span>
          {updatedAt
            ? `synced ${new Date(updatedAt).toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit",
              })}`
            : "auto-refresh · 20s"}
        </span>
      </div>
    </div>
  );
}
