// A rectangle on the learner's picture, shared by the locate, ask (screen help) and camera answers.
import { isObj } from "@/lib/guards";

/** Pixels in the uploaded image; origin at the top left. */
export interface Box {
  x: number;
  y: number;
  width: number;
  height: number;
}

const int = (description: string) => ({ type: "integer", description });

export const BOX_JSON_SCHEMA = {
  type: "object",
  description: "Rectangle around the thing, in pixels of the picture.",
  properties: {
    x: int("Left edge, from the left of the image."),
    y: int("Top edge, from the top of the image."),
    width: int("Width in pixels."),
    height: int("Height in pixels."),
  },
  required: ["x", "y", "width", "height"],
  additionalProperties: false,
};

/** A box, or null when there is nothing to point at. */
export const NULLABLE_BOX_JSON_SCHEMA = {
  anyOf: [BOX_JSON_SCHEMA, { type: "null" }],
  description: "Rectangle around the thing to point at, in pixels of the picture, or null.",
};

const isNum = (v: unknown): v is number => typeof v === "number" && Number.isFinite(v);

/** The box clipped to the image, or null when it is malformed or has no area inside the image. */
export function clipBox(b: unknown, imageWidth: number, imageHeight: number): Box | null {
  if (!isObj(b) || ![b.x, b.y, b.width, b.height].every(isNum)) return null;
  const [x, y, w, h] = [b.x, b.y, b.width, b.height] as number[];
  const left = Math.max(0, Math.round(x));
  const top = Math.max(0, Math.round(y));
  const right = Math.min(imageWidth, Math.round(x + w));
  const bottom = Math.min(imageHeight, Math.round(y + h));
  if (right <= left || bottom <= top) return null;
  return { x: left, y: top, width: right - left, height: bottom - top };
}
