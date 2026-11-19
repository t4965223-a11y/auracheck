"use client";

import { useState } from "react";
import { auraTier, formatAura, initials } from "@/lib/aura";
import type { Profile } from "@/lib/types";

const W = 1600;
const H = 1000;

function roundedRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number,
) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function drawTracked(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  tracking: number,
  align: "left" | "right" = "left",
) {
  const chars = [...text];
  const widths = chars.map((char) => ctx.measureText(char).width);
  const total = widths.reduce((sum, width) => sum + width, 0) + tracking * (chars.length - 1);
  let cursor = align === "right" ? x - total : x;
  chars.forEach((char, index) => {
    ctx.fillText(char, cursor, y);
    cursor += widths[index] + tracking;
  });
  return total;
}

function loadPhoto(src: string): Promise<HTMLImageElement | null> {
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = () => resolve(null);
    img.src = src;
  });
}

function bodyFont(): string {
  if (typeof window === "undefined") return "sans-serif";
  return getComputedStyle(document.body).fontFamily || "sans-serif";
}

async function renderCertificate(profile: Profile): Promise<Blob> {
  const canvas = document.createElement("canvas");
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas is unavailable in this browser.");

  const tier = auraTier(profile.aura);
  const positive = profile.aura >= 0;
  const display = bodyFont();
  const mono = `"JetBrains Mono", ui-monospace, "SF Mono", Menlo, monospace`;

  ctx.fillStyle = "#06070d";
  ctx.fillRect(0, 0, W, H);

  const glow = (x: number, y: number, r: number, color: string) => {
    const g = ctx.createRadialGradient(x, y, 0, x, y, r);
    g.addColorStop(0, color);
    g.addColorStop(1, "rgba(0,0,0,0)");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, W, H);
  };
  glow(170, 60, 880, "rgba(255,46,166,0.30)");
  glow(1480, 960, 900, "rgba(34,211,238,0.22)");
  glow(760, 520, 620, "rgba(139,92,246,0.20)");

  ctx.strokeStyle = "rgba(255,255,255,0.04)";
  ctx.lineWidth = 1;
  for (let x = 0; x <= W; x += 64) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, H);
    ctx.stroke();
  }
  for (let y = 0; y <= H; y += 64) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(W, y);
    ctx.stroke();
  }

  const border = ctx.createLinearGradient(0, 0, W, H);
  border.addColorStop(0, "rgba(255,46,166,0.85)");
  border.addColorStop(0.5, "rgba(176,107,255,0.55)");
  border.addColorStop(1, "rgba(34,211,238,0.85)");
  ctx.strokeStyle = border;
  ctx.lineWidth = 2;
  roundedRect(ctx, 36, 36, W - 72, H - 72, 38);
  ctx.stroke();

  ctx.strokeStyle = "rgba(255,255,255,0.08)";
  ctx.lineWidth = 1;
  roundedRect(ctx, 50, 50, W - 100, H - 100, 30);
  ctx.stroke();

  ctx.fillStyle = "rgba(255,255,255,0.92)";
  ctx.font = `600 21px ${mono}`;
  ctx.textBaseline = "alphabetic";
  drawTracked(ctx, "AURACHECK", 96, 116, 7);

  ctx.fillStyle = "rgba(143,147,173,0.95)";
  ctx.font = `400 14px ${mono}`;
  drawTracked(
    ctx,
    `AURA CERTIFICATE · NO. ${profile.id.slice(0, 8).toUpperCase()}`,
    W - 96,
    115,
    3,
    "right",
  );

  ctx.strokeStyle = "rgba(255,255,255,0.12)";
  ctx.beginPath();
  ctx.moveTo(96, 150);
  ctx.lineTo(W - 96, 150);
  ctx.stroke();

  const photo = profile.image_url ? await loadPhoto(profile.image_url) : null;
  const cx = 322;
  const cy = 432;
  const radius = 142;

  const ring = ctx.createLinearGradient(cx - radius, cy - radius, cx + radius, cy + radius);
  ring.addColorStop(0, "#ff2ea6");
  ring.addColorStop(1, "#22d3ee");
  ctx.beginPath();
  ctx.arc(cx, cy, radius + 12, 0, Math.PI * 2);
  ctx.strokeStyle = ring;
  ctx.lineWidth = 3;
  ctx.stroke();

  ctx.save();
  ctx.beginPath();
  ctx.arc(cx, cy, radius, 0, Math.PI * 2);
  ctx.clip();
  if (photo) {
    const scale = Math.max((radius * 2) / photo.width, (radius * 2) / photo.height);
    const dw = photo.width * scale;
    const dh = photo.height * scale;
    ctx.drawImage(photo, cx - dw / 2, cy - dh / 2, dw, dh);
  } else {
    const fill = ctx.createLinearGradient(cx - radius, cy - radius, cx + radius, cy + radius);
    fill.addColorStop(0, "#2a0f2f");
    fill.addColorStop(1, "#0a2230");
    ctx.fillStyle = fill;
    ctx.fillRect(cx - radius, cy - radius, radius * 2, radius * 2);
    ctx.fillStyle = "rgba(255,255,255,0.82)";
    ctx.font = `600 96px ${display}`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(initials(profile.display_name) || "A", cx, cy + 4);
    ctx.textAlign = "left";
    ctx.textBaseline = "alphabetic";
  }
  ctx.restore();

  const left = 548;
  ctx.fillStyle = "rgba(143,147,173,0.95)";
  ctx.font = `500 13px ${mono}`;
  drawTracked(ctx, "HOLDER", left, 300, 4);

  ctx.fillStyle = "#ffffff";
  let nameSize = 62;
  ctx.font = `700 ${nameSize}px ${display}`;
  while (ctx.measureText(profile.display_name).width > W - left - 110 && nameSize > 34) {
    nameSize -= 2;
    ctx.font = `700 ${nameSize}px ${display}`;
  }
  ctx.fillText(profile.display_name, left, 368);

  ctx.fillStyle = "rgba(143,147,173,0.95)";
  ctx.font = `500 13px ${mono}`;
  drawTracked(ctx, "AURA SCORE", left, 444, 4);

  const scoreGradient = ctx.createLinearGradient(left, 0, left + 620, 0);
  if (positive) {
    scoreGradient.addColorStop(0, "#8ef7c4");
    scoreGradient.addColorStop(0.55, "#4ade80");
    scoreGradient.addColorStop(1, "#22d3ee");
  } else {
    scoreGradient.addColorStop(0, "#ff5c9d");
    scoreGradient.addColorStop(1, "#c07bff");
  }
  ctx.fillStyle = scoreGradient;
  ctx.font = `700 168px ${display}`;
  ctx.textBaseline = "alphabetic";
  ctx.fillText(formatAura(profile.aura), left - 6, 596);

  const pillText = tier.label;
  ctx.font = `600 15px ${mono}`;
  const pillWidth = ctx.measureText(pillText).width + 76;
  const pillY = 634;
  roundedRect(ctx, left, pillY, pillWidth, 46, 23);
  ctx.fillStyle = "rgba(255,255,255,0.05)";
  ctx.fill();
  ctx.strokeStyle = `${tier.color}88`;
  ctx.lineWidth = 1.5;
  ctx.stroke();

  ctx.beginPath();
  ctx.arc(left + 24, pillY + 23, 5, 0, Math.PI * 2);
  ctx.fillStyle = tier.color;
  ctx.fill();

  ctx.fillStyle = tier.color;
  ctx.fillText(pillText, left + 40, pillY + 29);

  ctx.fillStyle = "rgba(154,158,184,0.95)";
  ctx.font = `400 16px ${mono}`;
  drawTracked(
    ctx,
    `RATED BY ${profile.vote_count} ${profile.vote_count === 1 ? "VISITOR" : "VISITORS"}`,
    left,
    728,
    2.5,
  );

  if (profile.bio) {
    ctx.fillStyle = "rgba(160,164,190,0.9)";
    ctx.font = `400 20px ${display}`;
    const maxWidth = W - left - 130;
    const words = profile.bio.split(/\s+/);
    const lines: string[] = [];
    let line = "";
    for (const word of words) {
      const test = line ? `${line} ${word}` : word;
      if (ctx.measureText(test).width > maxWidth && line) {
        lines.push(line);
        line = word;
      } else {
        line = test;
      }
      if (lines.length === 2) break;
    }
    if (line && lines.length < 2) lines.push(line);
    lines.forEach((text, index) => {
      const clipped =
        index === 1 && ctx.measureText(text).width > maxWidth
          ? `${text.slice(0, 64)}…`
          : text;
      ctx.fillText(clipped, left, 782 + index * 30);
    });
  }

  ctx.strokeStyle = "rgba(255,255,255,0.1)";
  ctx.beginPath();
  ctx.moveTo(96, 858);
  ctx.lineTo(W - 96, 858);
  ctx.stroke();

  const issued = new Date().toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });

  ctx.fillStyle = "rgba(143,147,173,0.9)";
  ctx.font = `400 14px ${mono}`;
  drawTracked(ctx, `ISSUED ${issued.toUpperCase()} · AURACHECK`, 96, 902, 2);

  ctx.fillStyle = "rgba(143,147,173,0.75)";
  drawTracked(ctx, "NO PAYWALLS · NO ACCOUNTS", W - 96, 902, 2, "right");

  ctx.save();
  ctx.translate(W / 2, H / 2);
  ctx.rotate(-Math.PI / 9);
  ctx.font = `700 52px ${display}`;
  ctx.fillStyle = "rgba(255,255,255,0.045)";
  for (let y = -620; y <= 620; y += 158) {
    for (let x = -900; x <= 900; x += 380) {
      ctx.fillText("AuraCheck", x + (Math.abs(y) % 316 === 0 ? 90 : 0), y);
    }
  }
  ctx.restore();

  ctx.fillStyle = "rgba(255,255,255,0.28)";
  ctx.font = `600 13px ${mono}`;
  drawTracked(ctx, "AURACHECK", W - 96, 76, 4, "right");

  return new Promise<Blob>((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob) resolve(blob);
      else reject(new Error("Could not render the certificate."));
    }, "image/png");
  });
}

export function AuraCertificate({ profile }: { profile: Profile }) {
  const [busy, setBusy] = useState(false);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function download() {
    if (busy) return;
    setBusy(true);
    setError(null);
    try {
      const blob = await renderCertificate(profile);
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      const slug =
        profile.display_name
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, "-")
          .replace(/^-|-$/g, "") || "aura";
      link.href = url;
      link.download = `auracheck-${slug}.png`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      setTimeout(() => URL.revokeObjectURL(url), 5000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not build the certificate.");
    } finally {
      setBusy(false);
    }
  }

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2200);
    } catch {
      setError("Copy failed — long-press the address bar instead.");
    }
  }

  return (
    <div className="glass p-5 sm:p-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="eyebrow">take the proof</p>
          <h2 className="mt-1.5 text-[15px] font-semibold tracking-tight">Aura Certificate</h2>
        </div>
        <span className="chip">PNG · 1600×1000</span>
      </div>

      <p className="mt-3 text-[12.5px] leading-relaxed text-[#8f93ad]">
        A neon, watermarked certificate with your name, score and tier. Rendered on your device —
        nothing extra is uploaded.
      </p>

      <div className="mt-4 flex flex-col gap-2 sm:flex-row">
        <button type="button" onClick={download} disabled={busy} className="btn btn-primary flex-1">
          {busy ? "Rendering…" : "Download certificate"}
        </button>
        <button type="button" onClick={copyLink} className="btn btn-ghost sm:w-[42%]">
          {copied ? "Link copied ✓" : "Copy link"}
        </button>
      </div>

      {error ? <p className="mt-2.5 text-[11.5px] text-[#ff8abf]">{error}</p> : null}
    </div>
  );
}
