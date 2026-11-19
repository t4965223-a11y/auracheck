const SALTS = {
  vote: "auracheck:vote:v1:",
  report: "auracheck:report:v1:",
} as const;

/**
 * Turns the caller's IP into a short opaque hash so we can enforce
 * "one vote per network per profile" without storing raw addresses.
 * Uses Web Crypto, which works in both the edge and node runtimes.
 */
export async function hashedClientId(
  request: Request,
  purpose: keyof typeof SALTS,
): Promise<string> {
  const forwarded = request.headers.get("x-forwarded-for") ?? "";
  const ip =
    forwarded.split(",")[0]?.trim() ||
    request.headers.get("x-real-ip")?.trim() ||
    request.headers.get("cf-connecting-ip")?.trim() ||
    "unknown";

  const bytes = new TextEncoder().encode(`${SALTS[purpose]}${ip}`);
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  return Array.from(new Uint8Array(digest))
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}
