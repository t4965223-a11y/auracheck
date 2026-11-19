import { createHash } from "crypto";

export const ADMIN_COOKIE = "auracheck_admin";
export const ADMIN_COOKIE_MAX_AGE = 60 * 60 * 24 * 7;

export function expectedAdminToken(): string {
  const password = process.env.ADMIN_PASSWORD;
  if (!password) return "";
  return createHash("sha256").update(`auracheck:admin:${password}`).digest("hex");
}

export function isValidAdminToken(token: string | undefined | null): boolean {
  const expected = expectedAdminToken();
  if (!expected || !token) return false;
  if (token.length !== expected.length) return false;
  let mismatch = 0;
  for (let i = 0; i < expected.length; i += 1) {
    mismatch |= expected.charCodeAt(i) ^ token.charCodeAt(i);
  }
  return mismatch === 0;
}
