import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { AuraCertificate } from "@/components/AuraCertificate";
import { ReportButton } from "@/components/ReportButton";
import { VotePanel } from "@/components/VotePanel";
import { auraTier, formatAura, initials } from "@/lib/aura";
import { getAuraRank, getProfile } from "@/lib/queries";

export const revalidate = 10;

type PageProps = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params;
  const profile = await getProfile(id);
  if (!profile) return { title: "Aura not found — AuraCheck" };
  if (profile.hidden) return { title: "Hidden aura — AuraCheck" };
  return {
    title: `${profile.display_name} · ${formatAura(profile.aura)} aura — AuraCheck`,
  };
}

export default async function ProfilePage({ params }: PageProps) {
  const { id } = await params;
  const profile = await getProfile(id);
  if (!profile) notFound();

  if (profile.hidden) {
    return (
      <div className="shell pt-16 pb-10">
        <div className="glass mx-auto max-w-lg p-8 text-center">
          <span className="chip">hidden</span>
          <h1 className="mt-4 text-2xl font-semibold tracking-tight">This aura was hidden.</h1>
          <p className="mx-auto mt-3 max-w-sm text-[13.5px] leading-relaxed text-[#9a9eb8]">
            It received multiple community reports, so it no longer appears on the leaderboard and
            can&apos;t be voted on.
          </p>
          <Link href="/leaderboard" className="btn btn-ghost mt-6">
            Back to the leaderboard
          </Link>
        </div>
      </div>
    );
  }

  const tier = auraTier(profile.aura);
  const rank = await getAuraRank(profile.aura);
  const intensity = Math.round((Math.abs(profile.aura) / 1000) * 100);

  return (
    <div className="shell pt-10 pb-8 sm:pt-14">
      <div className="mb-5 flex items-center justify-between">
        <Link
          href="/leaderboard"
          className="mono text-[11px] uppercase tracking-[0.14em] text-[#8f93ad] transition hover:text-white"
        >
          ← leaderboard
        </Link>
        <span className="mono text-[10.5px] uppercase tracking-[0.14em] text-[#5e6280]">
          aura file / {profile.id.slice(0, 8)}
        </span>
      </div>

      <div className="grid items-start gap-5 lg:grid-cols-[0.92fr_1.08fr]">
        <div className="glass overflow-hidden p-2.5">
          <div className="relative aspect-[4/5] overflow-hidden rounded-[16px] border border-white/[0.08] bg-gradient-to-br from-[#1a0b22] via-[#0b0d16] to-[#081820]">
            {profile.image_url ? (
              /* eslint-disable-next-line @next/next/no-img-element */
              <img
                src={profile.image_url}
                alt={`${profile.display_name}'s aura photo`}
                className="h-full w-full object-cover"
                loading="eager"
              />
            ) : (
              <div className="flex h-full w-full flex-col items-center justify-center gap-3">
                <span className="grid h-24 w-24 place-items-center rounded-3xl border border-white/10 bg-white/[0.04] text-3xl font-semibold tracking-tight text-white/80">
                  {initials(profile.display_name) || "A"}
                </span>
                <span className="mono text-[10px] uppercase tracking-[0.18em] text-[#7d81a0]">
                  bio only · no photo
                </span>
              </div>
            )}

            <div className="absolute inset-x-0 bottom-0 flex items-end justify-between gap-2 bg-gradient-to-t from-black/80 to-transparent p-4">
              <span
                className="chip !border-white/15"
                style={{ color: tier.color, borderColor: `${tier.color}55` }}
              >
                {tier.label}
              </span>
              <span className="score text-2xl" style={{ color: tier.color }}>
                {formatAura(profile.aura)}
              </span>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <div className="glass p-5 sm:p-6">
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0">
                <h1 className="truncate text-3xl font-bold tracking-[-0.035em] sm:text-4xl">
                  {profile.display_name}
                </h1>
                <p className="mono mt-2 text-[10.5px] uppercase tracking-[0.14em] text-[#7d81a0]">
                  {profile.vote_count} {profile.vote_count === 1 ? "vote" : "votes"} ·{" "}
                  {rank > 0 ? `rank #${rank}` : "unranked"}
                </p>
              </div>
              <div className="shrink-0 text-right">
                <p
                  className={`score text-4xl sm:text-5xl ${
                    profile.aura > 25 ? "score-pos" : profile.aura < -25 ? "score-neg" : "score-mid"
                  }`}
                >
                  {formatAura(profile.aura)}
                </p>
                <p className="mono text-[9.5px] uppercase tracking-[0.16em] text-[#7d81a0]">aura</p>
              </div>
            </div>

            {profile.bio ? (
              <p className="mt-4 text-[14px] leading-relaxed text-[#b9bcd2]">{profile.bio}</p>
            ) : null}

            <div className="mt-5">
              <div className="gauge">
                <span
                  className="gauge-pin"
                  style={{ left: `${((profile.aura + 1000) / 2000) * 100}%` }}
                />
              </div>
              <div className="mono mt-2 flex justify-between text-[9.5px] uppercase tracking-[0.12em] text-[#5e6280]">
                <span>−1000 void</span>
                <span>0 neutral</span>
                <span>mythic +1000</span>
              </div>
              <p className="mt-3 text-[12px] text-[#8f93ad]">
                {tier.blurb} · intensity {intensity}%
              </p>
            </div>
          </div>

          <VotePanel
            profileId={profile.id}
            initialAura={profile.aura}
            initialVotes={profile.vote_count}
          />

          <AuraCertificate profile={profile} />

          <ReportButton profileId={profile.id} />
        </div>
      </div>
    </div>
  );
}
