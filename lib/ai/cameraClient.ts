import type { CameraAnswer, CameraRequest } from "@/lib/ai/camera";
import { postCounted, type CountedResult } from "@/lib/ai/countedRequest";
import { devicesForHelper } from "@/lib/deviceCatalog";

export type CameraResult = CountedResult<CameraAnswer>;

/**
 * POSTs to /api/camera within today's cap; only an answered request counts. The devices are cleaned here too
 * (no "Other", at most the server's limits), so an older save can never make the request fail.
 */
export async function askCamera(request: CameraRequest): Promise<CameraResult> {
  const { devices, ...rest } = request;
  return postCounted<CameraAnswer>("/api/camera", { ...rest, ...(devices ? { devices: devicesForHelper(devices) } : {}) });
}
