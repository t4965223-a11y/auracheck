import { NextResponse } from "next/server";
import { hashedClientId } from "@/lib/request-ip";
import { createAdminClient } from "@/lib/supabase-admin";

export const runtime = "edge";

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const REASONS = new Set(["nudity", "harassment", "spam", "other"]);
const NO_STORE = { "Cache-Control": "no-store" };

function fail(message: string, status = 400) {
  return NextResponse.json({ error: message }, { status, headers: NO_STORE });
}

export async function POST(request: Request) {
  let payload: unknown = null;
  try {
    payload = await request.json();
  } catch {
    return fail("Invalid request.");
  }

  const { profileId, reason } = (payload ?? {}) as { profileId?: string; reason?: string };
  if (!profileId || !UUID_RE.test(profileId)) return fail("Unknown profile.");
  const cleanReason = reason && REASONS.has(reason) ? reason : "other";

  const reporter = await hashedClientId(request, "report");

  let admin;
  try {
    admin = createAdminClient();
  } catch {
    return fail("Reporting is not configured yet.", 503);
  }

  const { data, error } = await admin.rpc("report_profile", {
    p_profile: profileId,
    p_reporter: reporter,
    p_reason: cleanReason,
  });

  if (error) {
    const message = error.message ?? "";
    if (message.includes("profile not found")) return fail("That aura no longer exists.", 404);
    if (message.includes("rate limited")) return fail("Too many reports from this network.", 429);
    console.error("[auracheck] report failed:", message);
    return fail("Could not send that report right now.", 500);
  }

  const row = (Array.isArray(data) ? data[0] : data) as
    | { reported: boolean; report_count: number; hidden: boolean }
    | undefined;

  return NextResponse.json(
    {
      reportCount: Number(row?.report_count ?? 0),
      hidden: Boolean(row?.hidden),
    },
    { headers: NO_STORE },
  );
}
