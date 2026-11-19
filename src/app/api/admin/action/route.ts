import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { ADMIN_COOKIE, isValidAdminToken } from "@/lib/admin-auth";
import { createAdminClient } from "@/lib/supabase-admin";

export const runtime = "nodejs";

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function POST(request: Request) {
  const token = (await cookies()).get(ADMIN_COOKIE)?.value;
  if (!isValidAdminToken(token)) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  let body: { id?: string; action?: string } | null = null;
  try {
    body = (await request.json()) as { id?: string; action?: string };
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  const id = body?.id;
  const action = body?.action;
  if (!id || !UUID_RE.test(id)) {
    return NextResponse.json({ error: "Unknown profile." }, { status: 400 });
  }
  if (action !== "hide" && action !== "unhide" && action !== "delete") {
    return NextResponse.json({ error: "Unknown action." }, { status: 400 });
  }

  const admin = createAdminClient();

  if (action === "hide" || action === "unhide") {
    const { error } = await admin
      .from("profiles")
      .update({ hidden: action === "hide" })
      .eq("id", id);
    if (error) {
      console.error("[auracheck] admin update failed:", error.message);
      return NextResponse.json({ error: "Update failed." }, { status: 500 });
    }
    return NextResponse.json({ ok: true });
  }

  // delete: remove the stored image too, so nothing is left behind
  const { data: profile } = await admin
    .from("profiles")
    .select("image_url")
    .eq("id", id)
    .maybeSingle();

  const imageUrl = profile?.image_url;
  if (imageUrl) {
    const marker = "/object/public/auras/";
    const index = imageUrl.indexOf(marker);
    if (index >= 0) {
      const path = decodeURIComponent(imageUrl.slice(index + marker.length));
      const { error: storageError } = await admin.storage.from("auras").remove([path]);
      if (storageError) console.error("[auracheck] storage delete failed:", storageError.message);
    }
  }

  const { error } = await admin.from("profiles").delete().eq("id", id);
  if (error) {
    console.error("[auracheck] admin delete failed:", error.message);
    return NextResponse.json({ error: "Delete failed." }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
