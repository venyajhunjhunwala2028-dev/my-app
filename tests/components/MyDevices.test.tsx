import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { FirstRunDevice, MyDevicesCard } from "@/components/MyDevices";
import DevicesPage from "@/app/app/devices/page";
import { STORAGE_KEY, getDevices, isDeviceChosen, setDevices, setPreferredDevice } from "@/lib/store/localStore";

vi.mock("next/navigation", () => ({ useRouter: () => ({ push: vi.fn() }), useSearchParams: () => new URLSearchParams() }));

const ANDROID = "Mozilla/5.0 (Linux; Android 14; Pixel 7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Mobile Safari/537.36";

describe("First run: What are you using right now?", () => {
  beforeEach(() => localStorage.setItem(STORAGE_KEY, "{}"));
  afterEach(() => vi.unstubAllGlobals());

  it("asks once, with big picture buttons and the browser's guess chosen", async () => {
    vi.stubGlobal("navigator", { ...navigator, userAgent: ANDROID, maxTouchPoints: 5, language: "en" });
    render(<FirstRunDevice />);
    const card = screen.getByRole("region", { name: "What are you using right now?" });
    const buttons = within(card).getAllByRole("button");
    expect(buttons.map((b) => b.textContent?.replace(/✓|I think it's this one/g, ""))).toEqual([
      "📱iPhone",
      "📱Android phone",
      "📲iPad",
      "💻Mac",
      "🖥️Windows computer",
      "📺Smart TV",
      "❓Something else",
    ]);
    const android = within(card).getByRole("button", { name: "Android phone" });
    expect(android).toHaveAttribute("aria-pressed", "true");
    expect(android).toHaveAccessibleDescription("I think it's this one");

    await userEvent.click(within(card).getByRole("button", { name: "Mac" }));
    expect(getDevices()).toEqual(["Mac"]);
    expect(isDeviceChosen()).toBe(true);
    expect(screen.queryByRole("region", { name: "What are you using right now?" })).not.toBeInTheDocument();
  });

  it("confirms the guess with one tap on it", async () => {
    setDevices(["iPhone"]);
    render(<FirstRunDevice />);
    await userEvent.click(screen.getByRole("button", { name: "iPhone" }));
    expect(isDeviceChosen()).toBe(true);
    expect(getDevices()).toEqual(["iPhone"]);
  });

  it("does not ask again once a device is chosen", () => {
    setPreferredDevice("Smart TV");
    render(<FirstRunDevice />);
    expect(screen.queryByRole("region")).not.toBeInTheDocument();
  });
});

describe("My Devices", () => {
  beforeEach(() => localStorage.setItem(STORAGE_KEY, "{}"));

  it("the home card says which device the steps are for, and links to My Devices", () => {
    setPreferredDevice("Smart TV");
    render(<MyDevicesCard />);
    const card = screen.getByRole("region", { name: "My Devices" });
    expect(card).toHaveTextContent("Using now: Smart TV");
    expect(within(card).getByRole("link", { name: "Change my devices" })).toHaveAttribute("href", "/app/devices");
  });

  it("adds devices, picks the one in use now, and removes one", async () => {
    render(<DevicesPage />);
    expect(screen.getByRole("heading", { level: 1, name: "My Devices" })).toBeInTheDocument();
    expect(screen.getByText("No devices yet. Add the one you're using now.")).toBeInTheDocument();
    const add = () => screen.getByRole("list", { name: "Add a device you have" });

    await userEvent.click(within(add()).getByRole("button", { name: "iPhone" }));
    await userEvent.click(within(add()).getByRole("button", { name: "Windows computer" }));
    expect(getDevices()).toEqual(["iPhone", "Windows computer"]);
    expect(within(add()).queryByRole("button", { name: "iPhone" })).not.toBeInTheDocument();

    const now = screen.getByRole("list", { name: "Which one are you using now?" });
    expect(within(now).getByRole("button", { name: "iPhone" })).toHaveAttribute("aria-pressed", "true");
    await userEvent.click(within(now).getByRole("button", { name: "Windows computer" }));
    expect(getDevices()).toEqual(["Windows computer", "iPhone"]);
    expect(within(now).getByRole("button", { name: "Windows computer" })).toHaveAttribute("aria-pressed", "true");

    await userEvent.click(screen.getByRole("button", { name: "Remove Windows computer" }));
    expect(getDevices()).toEqual(["iPhone"]);
    expect(within(screen.getByRole("list", { name: "Which one are you using now?" })).getByRole("button", { name: "iPhone" })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
  });
});

describe("Home asks once which device is in use", () => {
  beforeEach(() => localStorage.setItem(STORAGE_KEY, "{}"));

  it("shows the question card first on home and hides it after a choice", async () => {
    const { default: Home } = await import("@/app/app/page");
    render(<Home />);
    const card = screen.getByRole("region", { name: "What are you using right now?" });
    await userEvent.click(within(card).getByRole("button", { name: "Smart TV" }));
    expect(screen.queryByRole("region", { name: "What are you using right now?" })).not.toBeInTheDocument();
    expect(screen.getByRole("region", { name: "My Devices" })).toHaveTextContent("Using now: Smart TV");
  });
});
