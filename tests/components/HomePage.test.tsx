import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { STORAGE_KEY, saveGuide, setCurrentGuide, setGuideStep } from "@/lib/store/localStore";
import Home from "@/app/app/page";

const push = vi.fn();
const nav = vi.hoisted(() => ({ search: new URLSearchParams() }));
vi.mock("next/navigation", () => ({ useRouter: () => ({ push }), useSearchParams: () => nav.search }));

const step = (n: number) => ({ instruction: `Step ${n}`, lookFor: "A button", spoken: `Step ${n}` });

class FakeRecognition {
  static instances: FakeRecognition[] = [];
  lang = "";
  continuous = false;
  interimResults = false;
  maxAlternatives = 1;
  onresult: ((e: unknown) => void) | null = null;
  onerror: ((e: unknown) => void) | null = null;
  onend: (() => void) | null = null;
  start = vi.fn();
  stop = vi.fn(() => this.onend?.());
  constructor() {
    FakeRecognition.instances.push(this);
  }
}

describe("Home page", () => {
  beforeEach(() => {
    push.mockReset();
    nav.search = new URLSearchParams();
    FakeRecognition.instances = [];
    localStorage.setItem(STORAGE_KEY, "{}");
  });
  afterEach(() => vi.unstubAllGlobals());

  it("on a cold launch with an unfinished guide at step 3, goes straight back to that guide", async () => {
    saveGuide({
      id: "photo",
      question: "How do I send a photo?",
      title: "Send a photo",
      answer: { kind: "steps", language: "en", title: "Send a photo", device: null, steps: [1, 2, 3, 4, 5].map(step), screenshotHowTo: ["x"] },
    });
    setGuideStep("photo", 3);
    setCurrentGuide("photo");

    render(<Home />);
    await waitFor(() => expect(push).toHaveBeenCalledWith("/guide/photo"));
  });

  it("on a cold launch with a current explanation guide, stays on the home screen", async () => {
    vi.resetModules();
    const store = await import("@/lib/store/localStore");
    const { default: FreshHome } = await import("@/app/app/page");
    store.saveGuide({
      id: "wifi",
      question: "What is wifi?",
      title: "Wifi",
      answer: { kind: "explanation", language: "en", title: "Wifi", paragraphs: ["Wifi is wireless internet."] },
    });
    store.setCurrentGuide("wifi");

    const { findByRole } = render(<FreshHome />);
    await findByRole("heading", { name: "Tech Helper" });
    await new Promise((r) => setTimeout(r, 0));
    expect(push).not.toHaveBeenCalled();
  });

  // These run after the cold-launch tests: the first render of Home uses up the cold launch.
  it("shows the big action buttons, with their emoji hidden from screen readers", () => {
    render(<Home />);
    expect(screen.getByRole("button", { name: "Ask a question" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "What do I press?" })).toHaveAttribute("href", "/app/press");
    expect(screen.getByRole("link", { name: "Is this a scam?" })).toHaveAttribute("href", "/app/scam");
    expect(screen.getByRole("button", { name: "Ask my family" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Call my family" })).toHaveAttribute("href", "#call-family");
    expect(document.getElementById("call-family")).toBeInTheDocument();
    expect(screen.getByText("📷")).toHaveAttribute("aria-hidden", "true");
    expect(screen.getByRole("button", { name: "Settings" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Teach me" })).toHaveAttribute("href", "/app/learn");
    expect(screen.getByRole("link", { name: "Help library" })).toHaveAttribute("href", "/app/library");
    expect(screen.getByText("🧑‍🏫")).toHaveAttribute("aria-hidden", "true");
    expect(screen.getByText("📚")).toHaveAttribute("aria-hidden", "true");
    const nav = screen.getByRole("navigation", { name: "What would you like to do?" });
    // Ask, What do I press?, Is this a scam?, Teach me, Help library, Ask my family, Call my family (Speak is hidden here).
    expect(within(nav).getAllByRole("listitem")).toHaveLength(7);
  });

  it("Ask my family opens the sheet with only the generic message, and Close goes back", async () => {
    render(<Home />);
    await userEvent.click(screen.getByRole("button", { name: "Ask my family" }));
    const dialog = screen.getByRole("dialog", { name: "Ask my family" });
    expect(within(dialog).getByTestId("family-message")).toHaveTextContent("I need help with my phoneSent from Tech Helper");
    expect(within(dialog).getByRole("link", { name: "Send on WhatsApp" }).getAttribute("href")).toMatch(/^https:\/\/wa\.me\/\?text=/);
    await userEvent.click(within(dialog).getByRole("button", { name: "Close" }));
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("Ask a question puts the cursor in the question box", async () => {
    render(<Home />);
    await userEvent.click(screen.getByRole("button", { name: "Ask a question" }));
    expect(screen.getByLabelText("What do you need help with?")).toHaveFocus();
  });

  it("hides Speak when the browser cannot listen", () => {
    render(<Home />);
    expect(screen.queryByRole("button", { name: "Speak" })).not.toBeInTheDocument();
  });

  it("shows one Speak button that starts the microphone and fills the question box", async () => {
    vi.stubGlobal("SpeechRecognition", FakeRecognition);
    render(<Home />);
    const speak = screen.getAllByRole("button", { name: "Speak" });
    expect(speak).toHaveLength(1);
    await userEvent.click(speak[0]);
    expect(FakeRecognition.instances[0].start).toHaveBeenCalled();
    expect(screen.getByRole("button", { name: "Listening… tap to stop" })).toBeInTheDocument();
    act(() => {
      FakeRecognition.instances[0].onresult?.({ results: [[{ transcript: "how do I send a photo" }]] });
      FakeRecognition.instances[0].onend?.();
    });
    expect(screen.getByLabelText("What do you need help with?")).toHaveValue("how do I send a photo");
    expect(screen.getByRole("button", { name: "Speak" })).toBeInTheDocument();
  });

  describe("arriving from the landing page", () => {
    const stepsAnswer = {
      kind: "steps",
      language: "en",
      title: "Post on Instagram",
      device: null,
      app: "Instagram",
      safety: null,
      steps: [{ instruction: "Open Instagram.", lookFor: "A camera icon.", spoken: "Open Instagram.", encouragement: "" }],
      screenshotHowTo: ["Press power and volume down."],
    };

    beforeEach(() => window.history.replaceState(null, "", "/app"));

    it("?q= asks that question once, opens the guide, and removes q from the address", async () => {
      window.history.replaceState(null, "", "/app?q=How%20do%20I%20post%20on%20Instagram%3F");
      nav.search = new URLSearchParams("q=How do I post on Instagram?");
      const fetchMock = vi.fn(async () => new Response(JSON.stringify(stepsAnswer), { status: 200 }));
      vi.stubGlobal("fetch", fetchMock);

      const { rerender } = render(<Home />);
      await waitFor(() => expect(push).toHaveBeenCalledWith(expect.stringMatching(/^\/guide\//)));
      expect(fetchMock).toHaveBeenCalledTimes(1);
      const body = JSON.parse(String((fetchMock.mock.calls[0] as unknown as [string, RequestInit])[1].body));
      expect(body.question).toBe("How do I post on Instagram?");
      expect(window.location.search).toBe("");

      rerender(<Home />);
      await new Promise((r) => setTimeout(r, 0));
      expect(fetchMock).toHaveBeenCalledTimes(1);
    });

    it("ignores an empty ?q=", async () => {
      nav.search = new URLSearchParams("q=%20");
      const fetchMock = vi.fn();
      vi.stubGlobal("fetch", fetchMock);
      render(<Home />);
      await new Promise((r) => setTimeout(r, 0));
      expect(fetchMock).not.toHaveBeenCalled();
    });

    it("?start=speak starts the microphone when the browser can listen", async () => {
      vi.stubGlobal("SpeechRecognition", FakeRecognition);
      window.history.replaceState(null, "", "/app?start=speak");
      nav.search = new URLSearchParams("start=speak");
      render(<Home />);
      await waitFor(() => expect(FakeRecognition.instances[0]?.start).toHaveBeenCalled());
      expect(screen.getByRole("button", { name: "Listening… tap to stop" })).toBeInTheDocument();
      expect(window.location.search).toBe("");
    });

    it("?start=speak puts the cursor in the question box when the browser cannot listen", async () => {
      nav.search = new URLSearchParams("start=speak");
      render(<Home />);
      await waitFor(() => expect(screen.getByLabelText("What do you need help with?")).toHaveFocus());
    });
  });
});
