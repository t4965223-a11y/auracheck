import { NextResponse } from "next/server";
import { hashedClientId } from "@/lib/request-ip";
import { createAdminClient } from "@/lib/supabase-admin";

export const runtime = "edge";

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

  const { displayName, bio, imageUrl } = (payload ?? {}) as {
    displayName?: string;
    bio?: string;
    imageUrl?: string | null;
  };

  const name = (displayName ?? "").trim();
  if (name.length < 2 || name.length > 40) return fail("Give your aura a name (2–40 characters).");

  const cleanBio = (bio ?? "").trim();
  if (cleanBio.length > 280) return fail("That bio is too long.");
  if (!imageUrl && cleanBio.length < 8) {
    return fail("Add a photo, or write a bio of at least 8 characters.");
  }

  const ipHash = await hashedClientId(request, "vote");

  let admin;
  try {
    admin = createAdminClient();
  } catch {
    return fail("AuraCheck is not fully configured yet.", 503);
  }

  const { data, error } = await admin.rpc("create_profile", {
    p_name: name,
    p_bio: cleanBio || null,
    p_image_url: imageUrl ?? null,
    p_ip: ipHash,
  });

  if (error) {
    const message = error.message ?? "";
    if (message.includes("rate limited")) {
      return fail("You've created plenty of auras in the last hour. Try again a bit later.", 429);
    }
    if (message.includes("auracheck_blocked_name")) {
      return fail("That display name contains language we don't allow. Try something cleaner.");
    }
    if (message.includes("auracheck_blocked_bio")) {
      return fail("Your bio contains language we don't allow. Keep it clean.");
    }
    if (message.includes("invalid image url")) {
      return fail("That image link is not from AuraCheck's own storage.");
    }
    console.error("[auracheck] create profile failed:", message);
    return fail("Could not create your aura file. Try again.", 500);
  }

  return NextResponse.json({ id: data as string }, { headers: NO_STORE });
}
