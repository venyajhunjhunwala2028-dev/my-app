import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import Home from "@/app/page";
import manifest from "@/app/manifest";

vi.mock("next/navigation", () => ({ useRouter: () => ({ push: vi.fn() }) }));

describe("app scaffold", () => {
  it("renders the home page with the app name and an ask control", () => {
    render(<Home />);
    expect(screen.getByRole("heading", { name: "Tech Helper" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Ask" })).toBeInTheDocument();
  });

  it("serves an installable manifest", () => {
    const m = manifest();
    expect(m.name).toBe("Tech Helper");
    expect(m.start_url).toBe("/");
    expect(m.icons?.length).toBeGreaterThan(0);
  });
});
