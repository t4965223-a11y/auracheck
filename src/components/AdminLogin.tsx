"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function AdminLogin() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    if (busy) return;
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });
      const data = (await res.json()) as { error?: string };
      if (!res.ok) throw new Error(data.error ?? "Login failed.");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login failed.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="shell pt-20 pb-10">
      <form onSubmit={submit} className="glass mx-auto max-w-sm p-6">
        <span className="chip">moderation</span>
        <h1 className="mt-4 text-xl font-semibold tracking-tight">AuraCheck admin</h1>
        <p className="mt-2 text-[12.5px] leading-relaxed text-[#8f93ad]">
          Review reported auras, restore false reports, or remove anything unsafe.
        </p>
        <label htmlFor="admin-password" className="label mt-5">
          Admin password
        </label>
        <input
          id="admin-password"
          type="password"
          className="field"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="••••••••••"
          autoComplete="current-password"
        />
        {error ? <p className="mt-2 text-[11.5px] text-[#ff8abf]">{error}</p> : null}
        <button type="submit" className="btn btn-primary mt-4 w-full" disabled={busy}>
          {busy ? "Checking…" : "Enter"}
        </button>
      </form>
    </div>
  );
}
