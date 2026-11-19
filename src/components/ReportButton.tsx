"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

const REASONS = [
  { value: "nudity", label: "Nudity or sexual content" },
  { value: "harassment", label: "Harassment or hate" },
  { value: "spam", label: "Spam or fake profile" },
  { value: "other", label: "Something else" },
];

export function ReportButton({ profileId }: { profileId: string }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState("nudity");
  const [state, setState] = useState<"idle" | "sending" | "done" | "error">("idle");
  const [message, setMessage] = useState<string | null>(null);

  async function report() {
    if (state === "sending" || state === "done") return;
    setState("sending");
    setMessage(null);
    try {
      const res = await fetch("/api/report", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ profileId, reason }),
      });
      const data = (await res.json()) as { reportCount?: number; hidden?: boolean; error?: string };
      if (!res.ok) throw new Error(data.error ?? "Report failed.");
      setState("done");
      setOpen(false);
      setMessage(
        data.hidden
          ? "Hidden after community reports. Thanks for keeping AuraCheck clean."
          : `Report sent. ${data.reportCount ?? 1} report(s) on this aura so far.`,
      );
      if (data.hidden) router.refresh();
    } catch (err) {
      setState("error");
      setMessage(err instanceof Error ? err.message : "Could not send that report.");
    }
  }

  if (state === "done") {
    return <p className="mt-1 text-center text-[11px] text-[#6ef2a7]">{message}</p>;
  }

  return (
    <div className="mt-1 flex flex-col items-center gap-2">
      {open ? (
        <div className="w-full max-w-xs rounded-2xl border border-white/10 bg-black/40 p-3">
          <p className="mono text-[9.5px] uppercase tracking-[0.14em] text-[#7d81a0]">
            why are you reporting?
          </p>
          <select
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            className="field mt-2 !py-2 !text-[12px]"
          >
            {REASONS.map((option) => (
              <option key={option.value} value={option.value} className="bg-[#0b0d16]">
                {option.label}
              </option>
            ))}
          </select>
          <div className="mt-2 flex gap-2">
            <button
              type="button"
              onClick={report}
              disabled={state === "sending"}
              className="btn btn-primary flex-1 !py-2 !text-[12px]"
            >
              {state === "sending" ? "Sending…" : "Send report"}
            </button>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="btn btn-ghost !px-3 !py-2 !text-[12px]"
            >
              Cancel
            </button>
          </div>
          <p className="mt-2 text-[10px] leading-relaxed text-[#6f7390]">
            Nudity and harassment hide an aura after 2 reports. Everything else after 3.
          </p>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => {
            setState("idle");
            setOpen(true);
          }}
          className="mono text-[10.5px] uppercase tracking-[0.14em] text-[#6f7390] underline decoration-dotted underline-offset-4 transition hover:text-[#ff8abf]"
        >
          report this aura
        </button>
      )}
      {state === "error" && message ? (
        <p className="text-[10.5px] text-[#ff8abf]">{message}</p>
      ) : null}
    </div>
  );
}
