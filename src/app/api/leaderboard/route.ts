import { NextResponse } from "next/server";
import { getLeaderboard } from "@/lib/queries";
import type { LeaderboardPayload } from "@/lib/types";

export const runtime = "edge";
export const revalidate = 10;

const CDN_HEADERS = {
  "Cache-Control": "public, s-maxage=10, stale-while-revalidate=60",
  "CDN-Cache-Control": "public, s-maxage=10, stale-while-revalidate=60",
  "Vercel-CDN-Cache-Control": "public, s-maxage=10, stale-while-revalidate=60",
};

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const rawLimit = Number(searchParams.get("limit") ?? 50);
  const limit = Number.isFinite(rawLimit) ? Math.min(100, Math.max(1, Math.trunc(rawLimit))) : 50;

  const profiles = await getLeaderboard(limit);
  const payload: LeaderboardPayload = {
    profiles,
    updatedAt: new Date().toISOString(),
  };

  return NextResponse.json(payload, { headers: CDN_HEADERS });
}
