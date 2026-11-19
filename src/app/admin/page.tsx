import { cookies } from "next/headers";
import Link from "next/link";
import { AdminLogin } from "@/components/AdminLogin";
import { AdminProfileActions } from "@/components/AdminProfileActions";
import { ADMIN_COOKIE, isValidAdminToken } from "@/lib/admin-auth";
import { formatAura, initials } from "@/lib/aura";
import { createAdminClient, isPrivilegedConfigured } from "@/lib/supabase-admin";

export const dynamic = "force-dynamic";

type Row = {
  id: string;
  display_name: string;
  aura: number;
  vote_count: number;
  report_count: number;
  hidden: boolean;
  image_url: string | null;
  created_at: string;
};

type ReportRow = { profile_id: string; reason: string | null; created_at: string };

export default async function AdminPage() {
  const token = (await cookies()).get(ADMIN_COOKIE)?.value;
  if (!isValidAdminToken(token)) return <AdminLogin />;

  if (!isPrivilegedConfigured) {
    return (
      <div className="shell pt-20 pb-10">
        <div className="glass mx-auto max-w-md p-6 text-center">
          <h1 className="text-lg font-semibold">Admin is not configured</h1>
          <p className="mt-2 text-[12.5px] leading-relaxed text-[#8f93ad]">
            Add SUPABASE_SERVICE_ROLE_KEY and ADMIN_PASSWORD to this deployment, then reload.
          </p>
        </div>
      </div>
    );
  }

  const admin = createAdminClient();

  const { data: profileData } = await admin
    .from("profiles")
    .select("id, display_name, aura, vote_count, report_count, hidden, image_url, created_at")
    .or("hidden.eq.true,report_count.gt.0")
    .order("report_count", { ascending: false })
    .limit(100);

  const rows = (profileData ?? []) as Row[];
  const ids = rows.map((row) => row.id);

  let reports: ReportRow[] = [];
  if (ids.length > 0) {
    const { data } = await admin
      .from("reports")
      .select("profile_id, reason, created_at")
      .in("profile_id", ids);
    reports = (data ?? []) as ReportRow[];
  }

  const reasonsByProfile = new Map<string, Record<string, number>>();
  for (const report of reports) {
    const bucket = reasonsByProfile.get(report.profile_id) ?? {};
    const reason = report.reason ?? "other";
    bucket[reason] = (bucket[reason] ?? 0) + 1;
    reasonsByProfile.set(report.profile_id, bucket);
  }

  const hiddenCount = rows.filter((row) => row.hidden).length;

  return (
    <div className="shell pt-10 pb-10">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <span className="chip">moderation queue</span>
          <h1 className="mt-3 text-3xl font-bold tracking-[-0.035em]">Reported auras</h1>
          <p className="mt-2 text-[13px] text-[#9a9eb8]">
            {rows.length} flagged · {hiddenCount} hidden · restore anything that was reported by
            mistake.
          </p>
        </div>
        <Link href="/" className="btn btn-ghost">
          Back to site
        </Link>
      </div>

      {rows.length === 0 ? (
        <div className="glass mt-6 p-8 text-center">
          <p className="text-[14px] font-medium">Nothing reported. The vibes are clean.</p>
        </div>
      ) : (
        <div className="glass mt-6 divide-y divide-white/[0.06] overflow-hidden">
          {rows.map((row) => {
            const reasons = reasonsByProfile.get(row.id) ?? {};
            const reasonText =
              Object.entries(reasons)
                .map(([reason, count]) => `${reason} ${count}`)
                .join(" · ") || "no detail";
            return (
              <div key={row.id} className="flex flex-wrap items-center gap-4 p-4">
                <span className="avatar-ring block h-12 w-12 shrink-0">
                  {row.image_url ? (
                    /* eslint-disable-next-line @next/next/no-img-element */
                    <img
                      src={row.image_url}
                      alt=""
                      className="h-full w-full object-cover"
                      loading="lazy"
                    />
                  ) : (
                    <span className="grid h-full w-full place-items-center text-[13px] font-semibold text-white/80">
                      {initials(row.display_name) || "A"}
                    </span>
                  )}
                </span>

                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <Link
                      href={`/profile/${row.id}`}
                      className="truncate text-[14px] font-medium hover:underline"
                    >
                      {row.display_name}
                    </Link>
                    {row.hidden ? (
                      <span className="mono rounded-full border border-[#ff2ea6]/40 bg-[#ff2ea6]/10 px-2 py-0.5 text-[9px] uppercase tracking-[0.1em] text-[#ffb3d6]">
                        hidden
                      </span>
                    ) : null}
                  </div>
                  <p className="mono mt-1 text-[10px] uppercase tracking-[0.1em] text-[#7d81a0]">
                    {formatAura(row.aura)} aura · {row.vote_count} votes · {row.report_count} reports
                    · {reasonText}
                  </p>
                </div>

                <AdminProfileActions profileId={row.id} hidden={row.hidden} />
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
