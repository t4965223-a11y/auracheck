"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

type Props = { profileId: string; hidden: boolean };

export function AdminProfileActions({ profileId, hidden }: Props) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function run(action: "hide" | "unhide" | "delete") {
    if (busy) return;
    if (action === "delete" && !window.confirm("Delete this aura permanently?")) return;
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/action", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: profileId, action }),
      });
      const data = (await res.json()) as { error?: string };
      if (!res.ok) throw new Error(data.error ?? "Action failed.");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Action failed.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex flex-wrap items-center gap-1.5">
      {hidden ? (
        <button
          type="button"
          onClick={() => run("unhide")}
          disabled={busy}
          className="mono rounded-full border border-[#4ade80]/40 bg-[#4ade80]/10 px-2.5 py-1 text-[10px] uppercase tracking-[0.1em] text-[#8ef7c4] disabled:opacity-50"
        >
          restore
        </button>
      ) : (
        <button
          type="button"
          onClick={() => run("hide")}
          disabled={busy}
          className="mono rounded-full border border-[#ff2ea6]/40 bg-[#ff2ea6]/10 px-2.5 py-1 text-[10px] uppercase tracking-[0.1em] text-[#ffb3d6] disabled:opacity-50"
        >
          hide
        </button>
      )}
      <button
        type="button"
        onClick={() => run("delete")}
        disabled={busy}
        className="mono rounded-full border border-white/15 px-2.5 py-1 text-[10px] uppercase tracking-[0.1em] text-[#9a9eb8] disabled:opacity-50"
      >
        delete
      </button>
      {error ? <span className="text-[10px] text-[#ff8abf]">{error}</span> : null}
    </div>
  );
}
