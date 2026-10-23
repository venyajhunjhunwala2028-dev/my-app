import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { STORAGE_KEY, saveGuide, setCurrentGuide, setGuideStep } from "@/lib/store/localStore";
import Home from "@/app/app/page";

const push = vi.fn();
vi.mock("next/navigation", () => ({ useRouter: () => ({ push }) }));

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
    expect(screen.getByRole("link", { name: "Ask my family" })).toHaveAttribute("href", "#call-family");
    expect(document.getElementById("call-family")).toBeInTheDocument();
    expect(screen.getByText("📷")).toHaveAttribute("aria-hidden", "true");
    expect(screen.getByRole("button", { name: "Text size" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /Teach me/ })).not.toBeInTheDocument();
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

});
