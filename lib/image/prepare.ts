// Checks and shrinks a picture the learner chose, before it is sent anywhere.

import { MAX_IMAGE_BYTES, MAX_SCREENSHOT_FILE_BYTES, base64DecodedBytes } from "@/lib/http/limits";
import { resizeScreenshot, type PreparedImage } from "@/lib/image/resize";

import type { MessageKey } from "@/lib/i18n/en";

const NOT_A_PICTURE: MessageKey = "image.notPicture";
const TOO_BIG: MessageKey = "image.tooBig";
const CANT_OPEN: MessageKey = "image.cantOpen";

/** `problem` is the message key of a friendly reason; show it with `t(problem)`. */
export type PrepareResult = { image: PreparedImage } | { problem: MessageKey };

/** The resized picture, or why it cannot be used. Spends no daily use. */
export async function prepareScreenshot(file: File): Promise<PrepareResult> {
  if (!file.type.startsWith("image/")) return { problem: NOT_A_PICTURE };
  // Phone photos are often bigger than the upload limit; the resize shrinks them, so only refuse what is too big to open.
  if (file.size > MAX_SCREENSHOT_FILE_BYTES) return { problem: TOO_BIG };
  let image: PreparedImage;
  try {
    image = await resizeScreenshot(file);
  } catch {
    return { problem: CANT_OPEN };
  }
  if (base64DecodedBytes(image.base64) > MAX_IMAGE_BYTES) return { problem: TOO_BIG };
  return { image };
}
