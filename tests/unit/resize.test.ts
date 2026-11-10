import { describe, expect, it } from "vitest";
import { fitWithin } from "@/lib/image/resize";

describe("fitWithin", () => {
  it("shrinks a 3000×6000 image to 2576 px on the long edge, keeping its shape", () => {
    expect(fitWithin(3000, 6000, 2576)).toEqual({ width: 1288, height: 2576 });
  });

  it("leaves a 1179×2556 image unchanged", () => {
    expect(fitWithin(1179, 2556, 2576)).toEqual({ width: 1179, height: 2556 });
  });
});
