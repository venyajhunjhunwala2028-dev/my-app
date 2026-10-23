// Server-side request limits. Checked before any AI call.

export const MAX_QUESTION_CHARS = 1000;
/** Guide title plus all step texts, combined. */
export const MAX_GUIDE_CONTEXT_CHARS = 4000;
export const MAX_LANGUAGE_CHARS = 35;
export const MAX_DEVICES = 10;
export const MAX_DEVICE_CHARS = 60;

// Screenshot limits, used by the locate route.
export const ALLOWED_IMAGE_TYPES = ["image/png", "image/jpeg", "image/webp"] as const;
export type AllowedImageType = (typeof ALLOWED_IMAGE_TYPES)[number];
/** Decoded bytes of the resized screenshot. 3 MB is about 4 MB as base64, under the 4.5 MB request body limit. */
export const MAX_IMAGE_BYTES = 3 * 1024 * 1024;
/** Client-side guard before decoding a picture at all; the resize usually shrinks it far below MAX_IMAGE_BYTES. */
export const MAX_SCREENSHOT_FILE_BYTES = 25 * 1024 * 1024;

/** Bytes that a base64 string decodes to. */
export function base64DecodedBytes(base64: string): number {
  const padding = base64.endsWith("==") ? 2 : base64.endsWith("=") ? 1 : 0;
  return Math.floor((base64.length * 3) / 4) - padding;
}
export const MAX_IMAGE_LONG_EDGE_PX = 2576;
