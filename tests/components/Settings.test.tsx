import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import Settings from "@/components/Settings";
import AppPreferences from "@/components/AppPreferences";
import AskBox from "@/components/AskBox";
import {
  STORAGE_KEY,
  getDevices,
  getLevel,
  getReadAloud,
  getSlowSpeech,
  getTextSize,
  getUiLanguage,
  setDevices,
  setTextSize,
  setUiLanguage,
} from "@/lib/store/localStore";

vi.mock("next/navigation", () => ({ useRouter: () => ({ push: vi.fn() }) }));

const html = () => document.documentElement;

describe("Settings sheet", () => {
  beforeEach(() => localStorage.setItem(STORAGE_KEY, "{}"));
  afterEach(() => {
    html().removeAttribute("data-text-size");
    vi.unstubAllGlobals();
  });

  it("opens from the Settings button and offers three big text sizes", async () => {
    render(<Settings />);
    expect(screen.queryByRole("button", { name: "Extra large" })).not.toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: "Settings" }));
    expect(screen.getByRole("button", { name: "Normal" })).toHaveAttribute("aria-pressed", "true");
    expect(screen.getByRole("button", { name: "Large" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Extra large" })).toBeInTheDocument();
  });

  it("applies and remembers the chosen text size", async () => {
    render(<Settings />);
    await userEvent.click(screen.getByRole("button", { name: "Settings" }));
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
    await userEvent.click(screen.getByRole("button", { name: "Settings" }));
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
    await userEvent.click(screen.getByRole("button", { name: "Settings" }));
    await userEvent.click(screen.getByRole("button", { name: "Android phone" }));
    await userEvent.type(screen.getByLabelText("What would you like help with?"), "How do I call?");
    await userEvent.click(screen.getByRole("button", { name: "Ask" }));
    await waitFor(() => expect(fetchMock).toHaveBeenCalled());
    const body = JSON.parse(String(((fetchMock.mock.calls[0] as unknown[])[1] as RequestInit).body));
    expect(body.devices).toEqual(["Android phone", "iPhone"]);
  });
});

describe("Settings sheet: preferences", () => {
  beforeEach(() => localStorage.setItem(STORAGE_KEY, "{}"));
  afterEach(() => {
    html().removeAttribute("lang");
    vi.unstubAllGlobals();
  });

  it("keeps Aa visible on the Settings button", () => {
    render(<Settings />);
    expect(screen.getByRole("button", { name: "Settings" })).toHaveTextContent("Aa");
  });

  it("switches the interface to Hindi, saves it and sets the html lang", async () => {
    render(<Settings />);
    await userEvent.click(screen.getByRole("button", { name: "Settings" }));
    expect(screen.getByRole("button", { name: "English" })).toHaveAttribute("aria-pressed", "true");
    await userEvent.click(screen.getByRole("button", { name: "हिन्दी" }));
    expect(getUiLanguage()).toBe("hi");
    expect(html().lang).toBe("hi");
    expect(screen.getByRole("heading", { name: "सेटिंग्स" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "हिन्दी" })).toHaveAttribute("aria-pressed", "true");
    expect(screen.getByRole("button", { name: "हिन्दी" })).toHaveTextContent("✓");
    expect(screen.getByRole("heading", { name: "अक्षरों का आकार" })).toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: "English" }));
    expect(html().lang).toBe("en");
    expect(screen.getByRole("heading", { name: "Settings" })).toBeInTheDocument();
  });

  it("saves the explanation level, voice and slower voice", async () => {
    render(<Settings />);
    await userEvent.click(screen.getByRole("button", { name: "Settings" }));
    expect(screen.getByRole("button", { name: "Simple" })).toHaveAttribute("aria-pressed", "true");
    await userEvent.click(screen.getByRole("button", { name: "Very simple" }));
    expect(getLevel()).toBe("very_simple");
    expect(screen.getByRole("button", { name: "Very simple" })).toHaveAttribute("aria-pressed", "true");
    await userEvent.click(screen.getByRole("button", { name: "Detailed" }));
    expect(getLevel()).toBe("detailed");

    expect(screen.getByRole("button", { name: "Voice off" })).toHaveAttribute("aria-pressed", "true");
    await userEvent.click(screen.getByRole("button", { name: "Voice on" }));
    expect(getReadAloud()).toBe(true);
    expect(screen.getByRole("button", { name: "Voice on" })).toHaveAttribute("aria-pressed", "true");

    expect(screen.getByRole("button", { name: "Normal speed" })).toHaveAttribute("aria-pressed", "true");
    await userEvent.click(screen.getByRole("button", { name: "Slower voice" }));
    expect(getSlowSpeech()).toBe(true);
  });

  it("shows the privacy note", async () => {
    render(<Settings />);
    await userEvent.click(screen.getByRole("button", { name: "Settings" }));
    expect(
      screen.getByText("Your help history and settings stay on this phone. Screenshots are sent to read them and are not saved."),
    ).toBeInTheDocument();
  });

  it("sends the saved level and the interface language with every question", async () => {
    const fetchMock = vi.fn(async () => new Response(JSON.stringify({ kind: "off_topic", language: "hi", message: "x" })));
    vi.stubGlobal("fetch", fetchMock);
    render(
      <>
        <Settings />
        <AskBox />
      </>,
    );
    await userEvent.click(screen.getByRole("button", { name: "Settings" }));
    await userEvent.click(screen.getByRole("button", { name: "Detailed" }));
    await userEvent.click(screen.getByRole("button", { name: "हिन्दी" }));
    await userEvent.type(screen.getByLabelText("आप किस चीज़ में मदद चाहते हैं?"), "Call kaise karein?");
    await userEvent.click(screen.getByRole("button", { name: "पूछें" }));
    await waitFor(() => expect(fetchMock).toHaveBeenCalled());
    const body = JSON.parse(String(((fetchMock.mock.calls[0] as unknown[])[1] as RequestInit).body));
    expect(body).toMatchObject({ language: "hi-IN", level: "detailed" });
  });
});

describe("AppPreferences (in the root layout)", () => {
  beforeEach(() => localStorage.setItem(STORAGE_KEY, "{}"));
  afterEach(() => {
    html().removeAttribute("data-text-size");
    vi.unstubAllGlobals();
  });

  it("sets the html lang from the saved interface language on load", async () => {
    setUiLanguage("hi");
    render(<AppPreferences />);
    await waitFor(() => expect(html().lang).toBe("hi"));
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
