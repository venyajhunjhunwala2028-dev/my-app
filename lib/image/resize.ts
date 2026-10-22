// Client-side screenshot preparation (KTD5): re-encode as JPEG, shrinking only when the long edge is too big.

import { MAX_IMAGE_LONG_EDGE_PX } from "@/lib/http/limits";

export interface PreparedImage {
  /** Base64 JPEG data, without the data: prefix. */
  base64: string;
  mediaType: "image/jpeg";
  width: number;
  height: number;
}

/** Size that fits within maxEdge on the long edge, keeping the shape. Never enlarges. */
export function fitWithin(width: number, height: number, maxEdge: number): { width: number; height: number } {
  const long = Math.max(width, height);
  if (long <= maxEdge) return { width, height };
  const scale = maxEdge / long;
  return { width: Math.round(width * scale), height: Math.round(height * scale) };
}

const JPEG_QUALITY = 0.85;

async function decode(file: File): Promise<HTMLImageElement> {
  const url = URL.createObjectURL(file);
  try {
    const img = new Image();
    img.src = url;
    await img.decode();
    return img;
  } finally {
    URL.revokeObjectURL(url);
  }
}

/** Throws when the browser cannot open the picture. */
export async function resizeScreenshot(file: File): Promise<PreparedImage> {
  const img = await decode(file);
  const { width, height } = fitWithin(img.naturalWidth, img.naturalHeight, MAX_IMAGE_LONG_EDGE_PX);
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("no_canvas");
  ctx.drawImage(img, 0, 0, width, height);
  const dataUrl = canvas.toDataURL("image/jpeg", JPEG_QUALITY);
  const base64 = dataUrl.slice(dataUrl.indexOf(",") + 1);
  return { base64, mediaType: "image/jpeg", width, height };
}
