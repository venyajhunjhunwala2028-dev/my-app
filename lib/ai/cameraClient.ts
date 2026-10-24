import type { CameraAnswer, CameraRequest } from "@/lib/ai/camera";
import type { ApiErrorCode } from "@/lib/ai/schemas";
import { postJson } from "@/lib/http/postJson";
import { requestAllowance } from "@/lib/store/localStore";

export type CameraResult =
  | { type: "limit" }
  | { type: "answer"; answer: CameraAnswer }
  | { type: "error"; code: ApiErrorCode; message: string };

/** POSTs to /api/camera, after counting the request against today's cap. */
export async function askCamera(request: CameraRequest): Promise<CameraResult> {
  if (!requestAllowance().allowed) return { type: "limit" };
  const result = await postJson<CameraAnswer>("/api/camera", request);
  if ("kind" in result) return { type: "answer", answer: result };
  if (result.code === "rate_limited") return { type: "limit" };
  return { type: "error", code: result.code, message: result.message };
}
