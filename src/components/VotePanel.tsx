"use client";

import { useEffect, useState } from "react";
import {
  auraTier,
  clampAura,
  formatAura,
  getSavedVotes,
  getVisitorId,
  saveVote,
} from "@/lib/aura";

type Props = {
  profileId: string;
  initialAura: number;
  initialVotes: number;
};

const QUICK_VALUES = [-1000, -500, -100, 0, 100, 500, 1000];

export function VotePanel({ profileId, initialAura, initialVotes }: Props) {
  const [aura, setAura] = useState(initialAura);
  const [votes, setVotes] = useState(initialVotes);
  const [value, setValue] = useState(0);
  const [myVote, setMyVote] = useState<number | null>(null);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [justVoted, setJustVoted] = useState(false);

  useEffect(() => {
    const saved = getSavedVotes()[profileId];
    if (typeof saved === "number") {
      setMyVote(saved);
      setValue(saved);
    }
  }, [profileId]);

  const tier = auraTier(aura);
  const pin = ((clampAura(aura) + 1000) / 2000) * 100;

  async function submit() {
    if (sending) return;
    setSending(true);
    setError(null);
    try {
      const res = await fetch("/api/vote", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          profileId,
          visitorId: getVisitorId(),
          value: clampAura(value),
        }),
      });

      const data = (await res.json()) as { aura?: number; votes?: number; error?: string };
      if (!res.ok) throw new Error(data.error ?? "Could not cast that aura.");

      setAura(Number(data.aura ?? aura));
      setVotes(Number(data.votes ?? votes));
      saveVote(profileId, clampAura(value));
      setMyVote(clampAura(value));
      setJustVoted(true);
      setTimeout(() => setJustVoted(false), 2600);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not cast that aura. Try again.");
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="glass p-5 sm:p-6">
      <div className="flex items-center justify-between">
        <p className="eyebrow">rate this aura</p>
        <span className="chip">
          {votes} {votes === 1 ? "vote" : "votes"}
        </span>
      </div>

      <div className="mt-4 flex items-end justify-between gap-3">
        <div>
          <p className="label !mb-0">current aura</p>
          <p
            className={`score mt-1 text-4xl ${
              aura > 25 ? "score-pos" : aura < -25 ? "score-neg" : "score-mid"
            }`}
          >
            {formatAura(aura)}
          </p>
        </div>
        <div className="text-right">
          <p className="mono text-[10px] uppercase tracking-[0.14em]" style={{ color: tier.color }}>
            {tier.label}
          </p>
          <p className="mt-1 max-w-[13rem] text-[11.5px] leading-snug text-[#8f93ad]">
            {tier.blurb}
          </p>
        </div>
      </div>

      <div className="mt-4">
        <div className="gauge">
          <span className="gauge-pin" style={{ left: `${pin}%` }} />
        </div>
      </div>

      <div className="mt-7">
        <div className="flex items-baseline justify-between">
          <span className="label !mb-0">your verdict</span>
          <span className="mono text-[15px] text-white">{formatAura(value)}</span>
        </div>
        <input
          aria-label="Aura value"
          className="aura-range mt-3"
          type="range"
          min={-1000}
          max={1000}
          step={10}
          value={value}
          onChange={(e) => setValue(Number(e.target.value))}
          disabled={sending}
        />
        <div className="mono mt-1.5 flex justify-between text-[9px] uppercase tracking-[0.1em] text-[#5e6280]">
          <span>−1000</span>
          <span>0</span>
          <span>+1000</span>
        </div>

        <div className="mt-3 flex flex-wrap gap-1.5">
          {QUICK_VALUES.map((quick) => (
            <button
              key={quick}
              type="button"
              onClick={() => setValue(quick)}
              disabled={sending}
              className={`mono rounded-full border px-2.5 py-1 text-[10.5px] transition ${
                value === quick
                  ? "border-[#ff2ea6]/60 bg-[#ff2ea6]/15 text-white"
                  : "border-white/10 bg-white/[0.03] text-[#9a9eb8] hover:border-white/25 hover:text-white"
              }`}
            >
              {formatAura(quick)}
            </button>
          ))}
        </div>
      </div>

      <button
        type="button"
        onClick={submit}
        disabled={sending}
        className="btn btn-primary mt-5 w-full"
      >
        {sending ? "Casting…" : myVote === null ? "Cast my aura" : "Update my aura"}
      </button>

      <div className="mt-3 space-y-1.5 text-center">
        {justVoted ? (
          <p className="text-[12px] text-[#6ef2a7]">Aura cast. The leaderboard just moved.</p>
        ) : myVote !== null ? (
          <p className="text-[11.5px] text-[#8f93ad]">
            You rated {formatAura(myVote)} · tap again to change it
          </p>
        ) : (
          <p className="text-[11.5px] text-[#6f7390]">
            One aura per visitor, one per network. No account needed.
          </p>
        )}
        {error ? <p className="text-[11.5px] text-[#ff8abf]">{error}</p> : null}
      </div>
    </div>
  );
}
