import { createClient, type SupabaseClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY ?? "";

export const isPrivilegedConfigured = Boolean(url && serviceKey);

/**
 * Server-only client. Never import this from a "use client" component:
 * the service key bypasses row level security.
 */
export function createAdminClient(): SupabaseClient {
  if (!isPrivilegedConfigured) {
    throw new Error("SUPABASE_SERVICE_ROLE_KEY is not configured.");
  }
  return createClient(url, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
