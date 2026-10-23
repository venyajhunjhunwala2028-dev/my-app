import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import Settings from "@/components/Settings";
import AppPreferences from "@/components/AppPreferences";
import AskBox from "@/components/AskBox";
import { STORAGE_KEY, getDevices, getTextSize, setDevices, setTextSize } from "@/lib/store/localStore";

vi.mock("next/navigation", () => ({ useRouter: () => ({ push: vi.fn() }) }));

const html = () => document.documentElement;

describe("Settings sheet", () => {
  beforeEach(() => localStorage.setItem(STORAGE_KEY, "{}"));
  afterEach(() => {
    html().removeAttribute("data-text-size");
    vi.unstubAllGlobals();
  });

  it("opens from the Text size button and offers three big text sizes", async () => {
    render(<Settings />);
    expect(screen.queryByRole("button", { name: "Extra large" })).not.toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: "Text size" }));
    expect(screen.getByRole("button", { name: "Normal" })).toHaveAttribute("aria-pressed", "true");
    expect(screen.getByRole("button", { name: "Large" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Extra large" })).toBeInTheDocument();
  });

  it("applies and remembers the chosen text size", async () => {
    render(<Settings />);
    await userEvent.click(screen.getByRole("button", { name: "Text size" }));
    await userEvent.click(screen.getByRole("button", { name: "Extra large" }));
    expect(html().getAttribute("data-text-size")).toBe("xl");
    expect(getTextSize()).toBe("xl");
    expect(screen.getByRole("button", { name: "Extra large" })).toHaveAttribute("aria-pressed", "true");
    await userEvent.click(screen.getByRole("button", { name: "Done" }));
    expect(screen.queryByRole("button", { name: "Extra large" })).not.toBeInTheDocument();
  });

  it("saves the chosen device as the preferred device, first in the list", async () => {
    setDevices(["iPhone", "Windows computer"]);
    render(<Settings />);
    await userEvent.click(screen.getByRole("button", { name: "Text size" }));
    expect(screen.getByRole("button", { name: "iPhone" })).toHaveAttribute("aria-pressed", "true");
    await userEvent.click(screen.getByRole("button", { name: "Mac" }));
    expect(getDevices()).toEqual(["Mac", "iPhone", "Windows computer"]);
    expect(screen.getByRole("button", { name: "Mac" })).toHaveAttribute("aria-pressed", "true");
  });

  it("sends the preferred device first with the next question", async () => {
    setDevices(["iPhone"]);
    const fetchMock = vi.fn(async () => new Response(JSON.stringify({ kind: "off_topic", language: "en", message: "Only tech." })));
    vi.stubGlobal("fetch", fetchMock);
    render(
      <>
        <Settings />
        <AskBox />
      </>,
    );
    await userEvent.click(screen.getByRole("button", { name: "Text size" }));
    await userEvent.click(screen.getByRole("button", { name: "Android phone" }));
    await userEvent.type(screen.getByLabelText("What do you need help with?"), "How do I call?");
    await userEvent.click(screen.getByRole("button", { name: "Ask" }));
    await waitFor(() => expect(fetchMock).toHaveBeenCalled());
    const body = JSON.parse(String(((fetchMock.mock.calls[0] as unknown[])[1] as RequestInit).body));
    expect(body.devices).toEqual(["Android phone", "iPhone"]);
  });
});

describe("AppPreferences (in the root layout)", () => {
  beforeEach(() => localStorage.setItem(STORAGE_KEY, "{}"));
  afterEach(() => {
    html().removeAttribute("data-text-size");
    vi.unstubAllGlobals();
  });

  it("applies the saved text size on load", async () => {
    setTextSize("large");
    render(<AppPreferences />);
    await waitFor(() => expect(html().getAttribute("data-text-size")).toBe("large"));
  });

  it("detects the device on first load when none is saved", async () => {
    vi.stubGlobal("navigator", {
      ...navigator,
      language: "en",
      maxTouchPoints: 5,
      userAgent: "Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148",
    });
    render(<AppPreferences />);
    await waitFor(() => expect(getDevices()).toEqual(["iPhone"]));
  });
});
