"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { compressToWebp, formatBytes } from "@/lib/compress";
import { getVisitorId } from "@/lib/aura";
import { AURA_BUCKET, isSupabaseConfigured, supabase } from "@/lib/supabase";

type Phase = "idle" | "compress" | "upload" | "save";

const PHASE_TEXT: Record<Exclude<Phase, "idle">, string> = {
  compress: "Squeezing your photo into a light WebP…",
  upload: "Uploading the compressed file…",
  save: "Locking in your aura…",
};

export function CreateAuraForm() {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const previewUrlRef = useRef<string | null>(null);

  const [name, setName] = useState("");
  const [bio, setBio] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [dragging, setDragging] = useState(false);
  const [phase, setPhase] = useState<Phase>("idle");
  const [error, setError] = useState<string | null>(null);
  const [note, setNote] = useState<string | null>(null);
  const [cameraOn, setCameraOn] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  const busy = phase !== "idle";

  useEffect(() => {
    return () => {
      if (previewUrlRef.current) URL.revokeObjectURL(previewUrlRef.current);
      const stream = videoRef.current?.srcObject as MediaStream | null;
      stream?.getTracks().forEach((track) => track.stop());
    };
  }, []);

  const acceptFile = useCallback((next: File | null) => {
    setError(null);
    setNote(null);
    if (previewUrlRef.current) {
      URL.revokeObjectURL(previewUrlRef.current);
      previewUrlRef.current = null;
    }
    if (!next) {
      setFile(null);
      setPreview(null);
      return;
    }
    if (!next.type.startsWith("image/")) {
      setError("That is not an image file. Try a JPG, PNG or WebP.");
      return;
    }
    const url = URL.createObjectURL(next);
    previewUrlRef.current = url;
    setFile(next);
    setPreview(url);
    setNote(`${next.name} · ${formatBytes(next.size)} selected`);
  }, []);

  // Paste an image straight in (Ctrl/Cmd+V) when the file dialog is blocked.
  useEffect(() => {
    function onPaste(event: ClipboardEvent) {
      const items = Array.from(event.clipboardData?.items ?? []);
      const imageItem = items.find((item) => item.type.startsWith("image/"));
      const pasted = imageItem?.getAsFile();
      if (pasted) {
        event.preventDefault();
        acceptFile(pasted);
        setNote("Photo pasted from clipboard");
      }
    }
    window.addEventListener("paste", onPaste);
    return () => window.removeEventListener("paste", onPaste);
  }, [acceptFile]);

  function stopCamera() {
    const stream = videoRef.current?.srcObject as MediaStream | null;
    stream?.getTracks().forEach((track) => track.stop());
    if (videoRef.current) videoRef.current.srcObject = null;
    setCameraOn(false);
  }

  async function startCamera() {
    setError(null);
    setNote(null);
    if (typeof navigator === "undefined" || !navigator.mediaDevices?.getUserMedia) {
      setError("This browser can't open the camera. Open the site in your normal browser and pick from gallery.");
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "user", width: { ideal: 1080 }, height: { ideal: 1080 } },
        audio: false,
      });
      setCameraOn(true);
      requestAnimationFrame(() => {
        const video = videoRef.current;
        if (!video) return;
        video.srcObject = stream;
        video.play().catch(() => {});
      });
    } catch {
      setError("Camera permission was blocked. Allow it in your browser settings, or open the site in a normal tab to pick a photo.");
    }
  }

  async function capturePhoto() {
    const video = videoRef.current;
    if (!video || !video.videoWidth) {
      setError("Camera is still warming up — give it a second and tap Capture again.");
      return;
    }
    const canvas = document.createElement("canvas");
    const scale = Math.min(1, 1080 / Math.max(video.videoWidth, video.videoHeight));
    canvas.width = Math.round(video.videoWidth * scale);
    canvas.height = Math.round(video.videoHeight * scale);
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    const blob = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob(resolve, "image/webp", 0.82),
    );
    if (!blob) {
      setError("Couldn't capture that shot. Try again.");
      return;
    }
    stopCamera();
    acceptFile(new File([blob], "camera-photo.webp", { type: "image/webp" }));
    setNote("Photo captured from your camera");
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (busy) return;

    const cleanName = name.trim();
    const cleanBio = bio.trim();

    if (cleanName.length < 2) {
      setError("Give your aura a name (at least 2 characters).");
      return;
    }
    if (!file && cleanBio.length < 8) {
      setError("Add a photo, or write a bio of at least 8 characters.");
      return;
    }
    if (!isSupabaseConfigured) {
      setError("AuraCheck is not connected to its database yet.");
      return;
    }

    setError(null);
    try {
      const [nameCheck, bioCheck] = await Promise.all([
        supabase.rpc("text_is_clean", { p_text: cleanName }),
        supabase.rpc("text_is_clean", { p_text: cleanBio }),
      ]);
      if (nameCheck.data === false) {
        setError("That display name contains language we don't allow. Try something cleaner.");
        return;
      }
      if (bioCheck.data === false) {
        setError("Your bio contains language we don't allow. Keep it clean.");
        return;
      }
      let imageUrl: string | null = null;

      if (file) {
        setPhase("compress");
        const { blob } = await compressToWebp(file);
        setNote(`Compressed to ${formatBytes(blob.size)} WebP · under the 150KB cap`);

        setPhase("upload");
        const visitor = getVisitorId();
        const path = `${visitor}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.webp`;
        const { error: uploadError } = await supabase.storage
          .from(AURA_BUCKET)
          .upload(path, blob, {
            contentType: "image/webp",
            cacheControl: "31536000",
            upsert: false,
          });

        if (uploadError) {
          throw new Error(
            uploadError.message.includes("row-level security")
              ? "The image bucket is not set up. Run the included SQL once."
              : `Upload failed: ${uploadError.message}`,
          );
        }

        imageUrl = supabase.storage.from(AURA_BUCKET).getPublicUrl(path).data.publicUrl;
      }

      setPhase("save");
      const res = await fetch("/api/profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ displayName: cleanName, bio: cleanBio, imageUrl }),
      });
      const result = (await res.json()) as { id?: string; error?: string };
      if (!res.ok || !result.id) {
        throw new Error(result.error ?? "Could not create your aura file.");
      }

      router.push(`/profile/${result.id}`);
    } catch (err) {
      const likelyHeic =
        /\.(heic|heif)$/i.test(file?.name ?? "") || /heic|heif/i.test(file?.type ?? "");
      const message = err instanceof Error ? err.message : "Something went wrong. Try again.";
      setError(
        likelyHeic
          ? "This browser can't decode iPhone HEIC photos. Take a screenshot of the photo (or export it as JPG) and upload that instead."
          : message,
      );
      setPhase("idle");
    }
  }

  return (
    <form onSubmit={handleSubmit} className="glass p-5 sm:p-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="eyebrow">step 01</p>
          <h2 className="mt-1.5 text-lg font-semibold tracking-tight">Open your aura file</h2>
        </div>
        <span className="chip">free · anonymous</span>
      </div>

      <div className="mt-5 space-y-4">
        <div>
          <label htmlFor="aura-name" className="label">
            Display name
          </label>
          <input
            id="aura-name"
            className="field"
            placeholder="e.g. Neon Nate"
            maxLength={40}
            value={name}
            onChange={(e) => setName(e.target.value)}
            disabled={busy}
            autoComplete="off"
          />
        </div>

        <div>
          <span className="label">Photo (optional)</span>
          <div
            onDragOver={(e) => {
              e.preventDefault();
              setDragging(true);
            }}
            onDragLeave={() => setDragging(false)}
            onDrop={(e) => {
              e.preventDefault();
              setDragging(false);
              const dropped = e.dataTransfer.files?.[0] ?? null;
              acceptFile(dropped);
            }}
            className={`relative flex min-h-[148px] cursor-pointer items-center justify-center overflow-hidden rounded-2xl border border-dashed p-4 text-center transition ${
              dragging
                ? "border-[#ff2ea6] bg-[#ff2ea6]/10"
                : "border-white/15 bg-black/25 hover:border-white/30"
            }`}
          >
            {cameraOn ? (
              <div className="relative z-20 w-full">
                <video
                  ref={videoRef}
                  playsInline
                  muted
                  className="mx-auto h-40 w-full rounded-xl border border-white/10 bg-black object-cover"
                />
                <div className="mt-2 flex justify-center gap-2">
                  <button
                    type="button"
                    onClick={capturePhoto}
                    className="btn btn-primary !px-4 !py-2 !text-[12px]"
                  >
                    Capture
                  </button>
                  <button
                    type="button"
                    onClick={stopCamera}
                    className="btn btn-ghost !px-4 !py-2 !text-[12px]"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : preview ? (
              <div className="flex w-full items-center gap-4">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={preview}
                  alt="Selected aura preview"
                  className="h-24 w-24 rounded-xl border border-white/15 object-cover"
                />
                <div className="min-w-0">
                  <p className="truncate text-[13px] font-medium">{file?.name}</p>
                  <p className="mono mt-1 text-[10.5px] uppercase tracking-[0.12em] text-[#7d81a0]">
                    tap to replace
                  </p>
                  <p className="mt-2 text-[11.5px] text-[#8f93ad]">
                    Resized to a 150KB-max WebP in your browser.
                  </p>
                </div>
              </div>
            ) : (
              <div className="text-center">
                <span className="mx-auto grid h-11 w-11 place-items-center rounded-xl border border-white/12 bg-white/[0.05] text-lg">
                  ⇪
                </span>
                <p className="mt-3 text-[13px] font-medium">Drop a fit pic here</p>
                <span className="btn btn-ghost mt-3 !px-4 !py-2 !text-[12px]">Choose photo</span>
                <p className="mt-2 text-[11.5px] text-[#8f93ad]">
                  JPG, PNG or WebP up to 25MB · compressed locally to ≤150KB
                </p>
                <p className="mt-1 text-[10.5px] text-[#6f7390]">
                  Picker blocked? Use the camera link below, paste an image, or drag it in.
                </p>
              </div>
            )}
            {/* The input itself covers the whole box, so a tap always opens the
                native picker (labels can be blocked inside embedded previews). */}
            <input
              id="aura-photo"
              ref={inputRef}
              type="file"
              accept="image/*"
              aria-label="Upload an aura photo"
              className={`absolute inset-0 z-10 h-full w-full cursor-pointer opacity-0 ${
                cameraOn ? "pointer-events-none" : ""
              }`}
              onChange={(e) => {
                const chosen = e.target.files?.[0] ?? null;
                acceptFile(chosen);
                // lets the same file be picked again after an error
                e.target.value = "";
              }}
            />
          </div>
          <div className="mt-2 flex flex-wrap items-center justify-between gap-2">
            <div className="flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={cameraOn ? stopCamera : startCamera}
                className="mono text-[10.5px] uppercase tracking-[0.12em] text-[#8f93ad] underline decoration-dotted underline-offset-4 hover:text-white"
              >
                {cameraOn ? "close camera" : "use camera instead"}
              </button>
              {file ? (
                <button
                  type="button"
                  onClick={() => acceptFile(null)}
                  className="mono text-[10.5px] uppercase tracking-[0.12em] text-[#7d81a0] underline decoration-dotted underline-offset-4 hover:text-white"
                >
                  remove photo
                </button>
              ) : null}
            </div>
            <span className="mono text-[9.5px] uppercase tracking-[0.1em] text-[#5e6280]">
              paste ctrl+v
            </span>
          </div>
        </div>

        <div>
          <label htmlFor="aura-bio" className="label">
            Bio {file ? "(optional)" : ""}
          </label>
          <textarea
            id="aura-bio"
            className="field min-h-[92px] resize-none"
            placeholder="one line that explains the vibe…"
            maxLength={280}
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            disabled={busy}
          />
          <p className="mono mt-1 text-right text-[10px] tracking-[0.1em] text-[#5e6280]">
            {bio.length}/280
          </p>
        </div>
      </div>

      {note ? <p className="mt-3 text-[11.5px] text-[#8f93ad]">{note}</p> : null}
      {error ? (
        <p className="mt-3 rounded-xl border border-[#ff2ea6]/30 bg-[#ff2ea6]/10 px-3 py-2 text-[12px] text-[#ffb3d6]">
          {error}
        </p>
      ) : null}

      <button type="submit" className="btn btn-primary mt-5 w-full" disabled={busy}>
        {busy ? PHASE_TEXT[phase as Exclude<Phase, "idle">] : "Publish my aura →"}
      </button>

      {busy ? (
        <div className="mt-3">
          <div className="shimmer-bar" />
        </div>
      ) : null}

      <p className="mt-3 text-center text-[11px] leading-relaxed text-[#6f7390]">
        No account, no email, no payment. Your photo is compressed before upload, the original never
        leaves your device, and names/bios are filtered for abusive language.
      </p>
    </form>
  );
}
