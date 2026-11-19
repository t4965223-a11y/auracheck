import { supabase } from "@/lib/supabase";
import type { Profile } from "@/lib/types";

export const PROFILE_COLUMNS =
  "id, display_name, bio, image_url, aura, vote_count, created_at, hidden, report_count";

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function getLeaderboard(limit = 50): Promise<Profile[]> {
  try {
    const { data, error } = await supabase
      .from("profiles")
      .select(PROFILE_COLUMNS)
      .eq("hidden", false)
      .order("aura", { ascending: false })
      .order("vote_count", { ascending: false })
      .order("created_at", { ascending: false })
      .limit(limit);

    if (error) {
      console.error("[auracheck] leaderboard query failed:", error.message);
      return [];
    }
    return (data ?? []) as Profile[];
  } catch (error) {
    console.error("[auracheck] leaderboard query threw:", error);
    return [];
  }
}

export async function getRecentProfiles(limit = 12): Promise<Profile[]> {
  try {
    const { data, error } = await supabase
      .from("profiles")
      .select(PROFILE_COLUMNS)
      .eq("hidden", false)
      .order("created_at", { ascending: false })
      .limit(limit);

    if (error) {
      console.error("[auracheck] recent query failed:", error.message);
      return [];
    }
    return (data ?? []) as Profile[];
  } catch {
    return [];
  }
}

export async function getProfile(id: string): Promise<Profile | null> {
  if (!UUID_RE.test(id)) return null;
  try {
    const { data, error } = await supabase
      .from("profiles")
      .select(PROFILE_COLUMNS)
      .eq("id", id)
      .maybeSingle();

    if (error) {
      console.error("[auracheck] profile query failed:", error.message);
      return null;
    }
    return (data as Profile | null) ?? null;
  } catch {
    return null;
  }
}

export async function getProfileCount(): Promise<number> {
  try {
    const { count, error } = await supabase
      .from("profiles")
      .select("id", { count: "exact", head: true })
      .eq("hidden", false);
    if (error) return 0;
    return count ?? 0;
  } catch {
    return 0;
  }
}

export async function getAuraRank(aura: number): Promise<number> {
  try {
    const { count, error } = await supabase
      .from("profiles")
      .select("id", { count: "exact", head: true })
      .eq("hidden", false)
      .gt("aura", aura);
    if (error) return 0;
    return (count ?? 0) + 1;
  } catch {
    return 0;
  }
}
