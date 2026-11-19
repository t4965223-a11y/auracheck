import Link from "next/link";
import { CreateAuraForm } from "@/components/CreateAuraForm";
import { LiveLeaderboard } from "@/components/LiveLeaderboard";
import { getLeaderboard, getProfileCount } from "@/lib/queries";

export const revalidate = 10;

export default async function HomePage() {
  const [profiles, count] = await Promise.all([getLeaderboard(8), getProfileCount()]);

  return (
    <>
      <div className="relative overflow-hidden">
        <div className="grid-bg" aria-hidden="true" />
        <section className="shell relative pt-14 pb-12 md:pt-20">
          <div className="flex flex-col items-center text-center">
            <span className="chip">
              <span className="live-dot" />
              live global leaderboard
            </span>

            <h1 className="mt-6 max-w-3xl text-[46px] leading-[0.94] font-bold tracking-[-0.05em] sm:text-6xl md:text-7xl">
              Your aura is
              <br className="hidden sm:block" /> <span className="neon-text">being judged.</span>
            </h1>

            <p className="mt-6 max-w-xl text-[15px] leading-relaxed text-[#a3a7c0] sm:text-base">
              Drop a fit pic or a bio. Strangers score you from{" "}
              <span className="text-white">−1000</span> to <span className="text-white">+1000</span>,
              and the whole internet watches the leaderboard move. Free forever. No account. No
              paywall.
            </p>

            <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
              <Link href="#create" className="btn btn-primary">
                Check my aura
              </Link>
              <Link href="/leaderboard" className="btn btn-ghost">
                See the leaderboard
              </Link>
            </div>

            <dl className="mt-11 grid w-full max-w-2xl grid-cols-3 gap-2.5 text-center">
              {[
                { k: "auras checked", v: count > 0 ? count.toLocaleString() : "0" },
                { k: "rating scale", v: "±1000" },
                { k: "cost", v: "free" },
              ].map((stat) => (
                <div
                  key={stat.k}
                  className="rounded-2xl border border-white/[0.07] bg-white/[0.03] px-3 py-4"
                >
                  <dt className="mono text-[9.5px] uppercase tracking-[0.16em] text-[#7d81a0]">
                    {stat.k}
                  </dt>
                  <dd className="mt-1.5 text-xl font-semibold tracking-tight sm:text-2xl">
                    {stat.v}
                  </dd>
                </div>
              ))}
            </dl>
          </div>
        </section>
      </div>

      <section id="create" className="shell scroll-mt-24 pb-16">
        <div className="grid items-start gap-5 lg:grid-cols-[1.04fr_0.96fr]">
          <CreateAuraForm />

          <div className="glass overflow-hidden">
            <div className="flex items-center justify-between border-b border-white/[0.06] px-5 py-4">
              <div className="flex items-center gap-2">
                <span className="live-dot" />
                <h2 className="text-[13px] font-semibold tracking-tight">Top auras right now</h2>
              </div>
              <span className="mono text-[10px] uppercase tracking-[0.14em] text-[#7d81a0]">
                live
              </span>
            </div>
            <div className="p-2 sm:p-3">
              <LiveLeaderboard initial={profiles} limit={6} />
            </div>
            <div className="border-t border-white/[0.06] p-4">
              <Link
                href="/leaderboard"
                className="btn btn-ghost w-full !py-2.5 !text-[12.5px]"
              >
                Open the full leaderboard →
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section className="shell pb-16">
        <p className="eyebrow text-center">how it works</p>
        <div className="mt-5 grid gap-4 sm:grid-cols-3">
          {[
            {
              n: "01",
              t: "Drop it",
              d: "A photo, a bio, or both. Photos are squashed to a light 150KB WebP in your browser before they ever leave your phone.",
            },
            {
              n: "02",
              t: "Get rated",
              d: "Every visitor can send one aura between −1000 and +1000. Change your vote whenever the vibe shifts.",
            },
            {
              n: "03",
              t: "Flex it",
              d: "Climb the live leaderboard and download a neon Aura Certificate you can post straight to the group chat.",
            },
          ].map((step) => (
            <div key={step.n} className="glass p-5">
              <p className="mono text-[11px] tracking-[0.18em] text-[#ff2ea6]">{step.n}</p>
              <h3 className="mt-3 text-[15px] font-semibold tracking-tight">{step.t}</h3>
              <p className="mt-2 text-[13px] leading-relaxed text-[#9a9eb8]">{step.d}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="shell pb-4">
        <div className="glass relative overflow-hidden px-6 py-10 text-center">
          <div
            className="pointer-events-none absolute -top-24 left-1/2 h-56 w-[26rem] -translate-x-1/2 rounded-full bg-[#ff2ea6]/20 blur-3xl"
            aria-hidden="true"
          />
          <h2 className="relative text-2xl font-semibold tracking-tight sm:text-3xl">
            Somebody has to go first.
          </h2>
          <p className="relative mx-auto mt-3 max-w-md text-[13.5px] leading-relaxed text-[#9a9eb8]">
            Zero sign-ups, zero subscriptions, zero gatekeeping. The leaderboard is empty until
            someone volunteers their aura.
          </p>
          <Link href="#create" className="btn btn-primary relative mt-6">
            Post my aura
          </Link>
        </div>
      </section>
    </>
  );
}
