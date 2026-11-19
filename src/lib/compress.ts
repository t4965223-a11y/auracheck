export const MAX_IMAGE_BYTES = 150 * 1024;

async function loadBitmap(file: File): Promise<{ width: number; height: number; draw: CanvasImageSource }> {
  if (typeof createImageBitmap === "function") {
    try {
      const bitmap = await createImageBitmap(file);
      return { width: bitmap.width, height: bitmap.height, draw: bitmap };
    } catch {
      /* fall through to <img> decoding */
    }
  }

  const url = URL.createObjectURL(file);
  try {
    const img = await new Promise<HTMLImageElement>((resolve, reject) => {
      const el = new Image();
      el.onload = () => resolve(el);
      el.onerror = () => reject(new Error("That file could not be read as an image."));
      el.src = url;
    });
    return { width: img.naturalWidth, height: img.naturalHeight, draw: img };
  } finally {
    URL.revokeObjectURL(url);
  }
}

function toWebp(canvas: HTMLCanvasElement, quality: number): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (!blob) {
          reject(new Error("Your browser could not encode this image."));
          return;
        }
        if (blob.type !== "image/webp") {
          reject(new Error("This browser cannot create WebP images. Try Chrome, Edge, Firefox or Safari 16+."));
          return;
        }
        resolve(blob);
      },
      "image/webp",
      quality,
    );
  });
}

/**
 * Downscales and re-encodes an image to a WebP that always fits under
 * MAX_IMAGE_BYTES (150KB). Never uploads the original file.
 */
export async function compressToWebp(
  file: File,
  maxBytes: number = MAX_IMAGE_BYTES,
): Promise<{ blob: Blob; width: number; height: number }> {
  if (!file.type.startsWith("image/")) {
    throw new Error("Please choose an image file (JPG, PNG, WebP or HEIC).");
  }
  if (file.size > 25 * 1024 * 1024) {
    throw new Error("That image is over 25MB. Pick a smaller one.");
  }

  const source = await loadBitmap(file);
  let maxEdge = Math.min(900, Math.max(source.width, source.height));
  const qualities = [0.86, 0.78, 0.7, 0.62, 0.54, 0.46, 0.38, 0.3];

  for (let attempt = 0; attempt < 7; attempt++) {
    const scale = Math.min(1, maxEdge / Math.max(source.width, source.height));
    const width = Math.max(1, Math.round(source.width * scale));
    const height = Math.max(1, Math.round(source.height * scale));

    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("Your browser blocked image processing.");
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = "high";
    ctx.drawImage(source.draw, 0, 0, width, height);

    for (const quality of qualities) {
      const blob = await toWebp(canvas, quality);
      if (blob.size <= maxBytes) {
        return { blob, width, height };
      }
      if (maxEdge <= 260) break;
    }
    maxEdge = Math.round(maxEdge * 0.75);
    if (maxEdge < 260) maxEdge = 260;
  }

  throw new Error("Could not compress this image under 150KB. Try a simpler shot.");
}

export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
