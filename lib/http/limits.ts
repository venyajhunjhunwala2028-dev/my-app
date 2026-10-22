// Server-side request limits (KTD11). Checked before any AI call.

export const MAX_QUESTION_CHARS = 1000;
/** Guide title plus all step texts, combined. */
export const MAX_GUIDE_CONTEXT_CHARS = 4000;
export const MAX_LANGUAGE_CHARS = 35;
export const MAX_DEVICES = 10;
export const MAX_DEVICE_CHARS = 60;

// Screenshot limits, used by the locate route (U6).
export const ALLOWED_IMAGE_TYPES = ["image/png", "image/jpeg", "image/webp"] as const;
export type AllowedImageType = (typeof ALLOWED_IMAGE_TYPES)[number];
export const MAX_IMAGE_BYTES = 4 * 1024 * 1024;
export const MAX_IMAGE_LONG_EDGE_PX = 2576;
