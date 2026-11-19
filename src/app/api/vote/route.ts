import { NextResponse } from "next/server";
import { hashedClientId } from "@/lib/request-ip";
import { createAdminClient } from "@/lib/supabase-admin";

export const runtime = "edge";

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

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

  const { profileId, visitorId, value } = (payload ?? {}) as {
    profileId?: string;
    visitorId?: string;
    value?: number;
  };

  if (!profileId || !UUID_RE.test(profileId)) return fail("Unknown profile.");
  if (!visitorId || visitorId.length < 8 || visitorId.length > 64) {
    return fail("Missing visitor id.");
  }
  if (typeof value !== "number" || !Number.isFinite(value)) return fail("Invalid aura value.");
  const auraValue = Math.max(-1000, Math.min(1000, Math.round(value)));

  const ipHash = await hashedClientId(request, "vote");

  let admin;
  try {
    admin = createAdminClient();
  } catch {
    return fail("Voting is not configured yet.", 503);
  }

  const { data, error } = await admin.rpc("cast_vote", {
    p_profile: profileId,
    p_visitor: visitorId,
    p_value: auraValue,
    p_ip: ipHash,
  });

  if (error) {
    const message = error.message ?? "";
    if (message.includes("profile hidden")) {
      return fail("This aura was hidden after community reports.", 409);
    }
    if (message.includes("profile not found")) return fail("That aura no longer exists.", 404);
    if (message.includes("rate limited")) {
      return fail("Slow down a little — too many votes from this network.", 429);
    }
    console.error("[auracheck] vote failed:", message);
    return fail("Could not cast that aura right now. Try again.", 500);
  }

  const row = (Array.isArray(data) ? data[0] : data) as
    | { aura: number; votes: number }
    | undefined;

  return NextResponse.json(
    { aura: Number(row?.aura ?? 0), votes: Number(row?.votes ?? 0) },
    { headers: NO_STORE },
  );
}
