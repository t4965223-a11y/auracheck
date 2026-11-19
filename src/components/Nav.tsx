import Link from "next/link";

export function Nav() {
  return (
    <header className="sticky top-0 z-40 border-b border-white/[0.06] bg-[#05060a]/75 backdrop-blur-xl">
      <div className="shell flex h-16 items-center justify-between">
        <Link href="/" className="flex items-center gap-2.5">
          <span className="grid h-8 w-8 place-items-center rounded-xl bg-gradient-to-br from-[#ff2ea6] via-[#b06bff] to-[#22d3ee] text-[15px] font-bold text-black shadow-[0_0_24px_-6px_rgba(255,46,166,0.9)]">
            A
          </span>
          <span className="text-[15px] font-semibold tracking-tight">AuraCheck</span>
          <span className="chip hidden !py-1 !text-[9.5px] sm:inline-flex">beta</span>
        </Link>
        <nav className="flex items-center gap-2">
          <Link
            href="/leaderboard"
            className="btn btn-ghost !px-4 !py-2 !text-[13px]"
          >
            Leaderboard
          </Link>
          <Link href="/#create" className="btn btn-primary !px-4 !py-2 !text-[13px]">
            Check my aura
          </Link>
        </nav>
      </div>
    </header>
  );
}
