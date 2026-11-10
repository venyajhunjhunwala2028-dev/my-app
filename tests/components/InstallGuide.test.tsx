import { afterEach, describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import InstallGuide from "@/components/InstallGuide";

const IPHONE_SAFARI =
  "Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Mobile/15E148 Safari/604.1";

function setPhone(standalone: boolean) {
  vi.spyOn(navigator, "userAgent", "get").mockReturnValue(IPHONE_SAFARI);
  Object.defineProperty(navigator, "standalone", { value: standalone, configurable: true });
  vi.stubGlobal("matchMedia", (query: string) => ({ matches: false, media: query }));
}

describe("InstallGuide", () => {
  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
    Reflect.deleteProperty(navigator, "standalone");
  });

  it("shows the Add to Home Screen walkthrough in an iPhone Safari tab", () => {
    setPhone(false);
    render(
      <InstallGuide>
        <p>Set up</p>
      </InstallGuide>,
    );
    expect(screen.getByText(/Add to Home Screen/)).toBeInTheDocument();
    expect(screen.queryByText("Set up")).not.toBeInTheDocument();
  });

  it("shows the app when opened from the home screen icon", () => {
    setPhone(true);
    render(
      <InstallGuide>
        <p>Set up</p>
      </InstallGuide>,
    );
    expect(screen.getByText("Set up")).toBeInTheDocument();
    expect(screen.queryByText(/Add to Home Screen/)).not.toBeInTheDocument();
  });
});
