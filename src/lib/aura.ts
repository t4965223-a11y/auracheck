export const AURA_MIN = -1000;
export const AURA_MAX = 1000;

export function clampAura(value: number): number {
  return Math.max(AURA_MIN, Math.min(AURA_MAX, Math.round(value)));
}

export function formatAura(value: number): string {
  const rounded = clampAura(value);
  return rounded > 0 ? `+${rounded}` : `${rounded}`;
}

export function auraTone(value: number): "pos" | "neg" | "mid" {
  if (value > 25) return "pos";
  if (value < -25) return "neg";
  return "mid";
}

export type Tier = {
  label: string;
  blurb: string;
  color: string;
};

export function auraTier(value: number): Tier {
  if (value >= 900) return { label: "MYTHIC", blurb: "Aura tax exempt. Legendary presence.", color: "#22d3ee" };
  if (value >= 650) return { label: "RADIANT", blurb: "Rooms brighten when you walk in.", color: "#a78bfa" };
  if (value >= 350) return { label: "CHARGED", blurb: "Certified main character energy.", color: "#4ade80" };
  if (value >= 100) return { label: "WARM", blurb: "Good vibes, clearly detectable.", color: "#86efac" };
  if (value > -100) return { label: "NEUTRAL", blurb: "Aura currently undecided. Reapply.", color: "#cfd2e6" };
  if (value > -350) return { label: "FADED", blurb: "Aura leakage detected.", color: "#fca5a5" };
  if (value > -650) return { label: "DRAINED", blurb: "Bring a charger next time.", color: "#ff5c9d" };
  if (value > -900) return { label: "VOID", blurb: "Aura in another dimension.", color: "#ff2ea6" };
  return { label: "BLACK HOLE", blurb: "Nothing escapes. Not even vibes.", color: "#ff2ea6" };
}

const VISITOR_KEY = "auracheck:visitor";
const VOTES_KEY = "auracheck:votes";

export function getVisitorId(): string {
  if (typeof window === "undefined") return "";
  try {
    let id = window.localStorage.getItem(VISITOR_KEY);
    if (!id) {
      id =
        typeof crypto !== "undefined" && "randomUUID" in crypto
          ? crypto.randomUUID()
          : `v-${Math.random().toString(36).slice(2)}${Date.now().toString(36)}`;
      window.localStorage.setItem(VISITOR_KEY, id);
    }
    return id;
  } catch {
    return "anonymous-visitor";
  }
}

export function getSavedVotes(): Record<string, number> {
  if (typeof window === "undefined") return {};
  try {
    const raw = window.localStorage.getItem(VOTES_KEY);
    return raw ? (JSON.parse(raw) as Record<string, number>) : {};
  } catch {
    return {};
  }
}

export function saveVote(profileId: string, value: number): void {
  try {
    const votes = getSavedVotes();
    votes[profileId] = value;
    window.localStorage.setItem(VOTES_KEY, JSON.stringify(votes));
  } catch {
    /* private mode: voting still works, we just cannot remember the slider */
  }
}

export function initials(name: string): string {
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}
