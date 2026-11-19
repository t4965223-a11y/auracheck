import type { Metadata } from "next";
import { JetBrains_Mono, Space_Grotesk } from "next/font/google";
import "./globals.css";
import { Nav } from "@/components/Nav";

const display = Space_Grotesk({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-space-grotesk",
  display: "swap",
});

const mono = JetBrains_Mono({
  subsets: ["latin"],
  weight: ["400", "500"],
  variable: "--font-jetbrains-mono",
  display: "swap",
});

export const metadata: Metadata = {
  title: "AuraCheck — get your aura rated",
  description:
    "Drop a fit pic or a bio. Strangers rate your aura from -1000 to +1000. Live global leaderboard, neon certificate, free forever.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${display.variable} ${mono.variable}`}>
      <head>
        <link
          rel="preconnect"
          href={process.env.NEXT_PUBLIC_SUPABASE_URL ?? "https://supabase.co"}
          crossOrigin="anonymous"
        />
        <link rel="dns-prefetch" href={process.env.NEXT_PUBLIC_SUPABASE_URL ?? "https://supabase.co"} />
      </head>
      <body className="antialiased">
        <Nav />
        <main className="relative z-10">{children}</main>
        <footer className="mt-24 border-t border-white/[0.06] py-10">
          <div className="shell flex flex-col gap-3 text-[12.5px] text-[#7d81a0] sm:flex-row sm:items-center sm:justify-between">
            <p>
              © {new Date().getFullYear()} AuraCheck · 100% free · no accounts · no paywalls
            </p>
            <p className="mono text-[10.5px] uppercase tracking-[0.16em]">
              Auras are opinions, not facts
            </p>
          </div>
        </footer>
      </body>
    </html>
  );
}
