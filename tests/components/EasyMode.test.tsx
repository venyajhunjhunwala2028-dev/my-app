import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import Settings from "@/components/Settings";
import AppPreferences from "@/components/AppPreferences";
import AskBox from "@/components/AskBox";
import StepPlayer, { type StepsAnswer } from "@/components/StepPlayer";
import {
  STORAGE_KEY,
  getEasyMode,
  getReadAloud,
  getUiLanguage,
  saveGuide,
  setEasyMode,
  setPreferredDevice,
  setUiLanguage,
} from "@/lib/store/localStore";
import Home from "@/app/app/page";

const push = vi.fn();
vi.mock("next/navigation", () => ({ useRouter: () => ({ push }), useSearchParams: () => new URLSearchParams() }));

const html = () => document.documentElement;

const answer: StepsAnswer = {
  kind: "steps",
  language: "en",
  title: "Post a story",
  device: "iPhone",
  app: null,
  safety: null,
  steps: [1, 2, 3].map((n) => ({ instruction: `Do thing ${n}`, lookFor: `Button ${n}`, spoken: `Say thing ${n}`, encouragement: "" })),
  screenshotHowTo: ["Press the side button and volume up"],
};

beforeEach(() => {
  localStorage.setItem(STORAGE_KEY, "{}");
  // The first-run device question is answered, so it does not get in the way here.
  setPreferredDevice("iPhone");
});
afterEach(() => {
  html().removeAttribute("data-easy");
  html().removeAttribute("lang");
  vi.unstubAllGlobals();
});

describe("Easy Mode in Settings", () => {
  it("turns on from Settings: saves it, sets data-easy on <html>, turns voice on and fixes the level at Very simple", async () => {
    render(<Settings />);
    await userEvent.click(screen.getByRole("button", { name: "Settings" }));
    const group = screen.getByRole("group", { name: "Easy Mode" });
    expect(within(group).getByRole("button", { name: "Easy Mode off" })).toHaveAttribute("aria-pressed", "true");
    await userEvent.click(within(group).getByRole("button", { name: "Easy Mode on" }));
    expect(getEasyMode()).toBe(true);
    expect(html().getAttribute("data-easy")).toBe("on");
    expect(getReadAloud()).toBe(true);
    expect(screen.getByRole("button", { name: "Voice on" })).toHaveAttribute("aria-pressed", "true");
    expect(screen.getByText("Easy Mode always explains very simply.")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Very simple" })).toHaveAttribute("aria-pressed", "true");
    expect(screen.getByRole("button", { name: "Detailed" })).toBeDisabled();

    await userEvent.click(within(group).getByRole("button", { name: "Easy Mode off" }));
    expect(getEasyMode()).toBe(false);
    expect(html().hasAttribute("data-easy")).toBe(false);
    expect(screen.getByRole("button", { name: "Detailed" })).toBeEnabled();
  });

  it("is applied on load by AppPreferences too", async () => {
    setEasyMode(true);
    render(<AppPreferences />);
    await waitFor(() => expect(html().getAttribute("data-easy")).toBe("on"));
  });

  it("links to My Devices", async () => {
    render(<Settings />);
    await userEvent.click(screen.getByRole("button", { name: "Settings" }));
    expect(screen.getByRole("link", { name: "My Devices" })).toHaveAttribute("href", "/app/devices");
  });
});

describe("Easy Mode on home", () => {
  it("shows the main things only, with Settings and one More button for the rest", async () => {
    setEasyMode(true);
    render(<Home />);
    expect(screen.getByRole("button", { name: "Ask a question" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "What do I press?" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Recent help" })).toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: "More ways I can help" })).not.toBeInTheDocument();
    expect(screen.queryByRole("region", { name: "Your Tech Confidence" })).not.toBeInTheDocument();
    expect(screen.queryByRole("link", { name: "Help library" })).not.toBeInTheDocument();
    expect(screen.queryByRole("link", { name: "Show me with my camera" })).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Settings" })).toBeInTheDocument();

    const more = screen.getByRole("button", { name: "More" });
    expect(more).toHaveAttribute("aria-expanded", "false");
    await userEvent.click(more);
    expect(screen.getByRole("heading", { name: "More ways I can help" })).toBeInTheDocument();
    expect(screen.getByRole("region", { name: "Your Tech Confidence" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Help library" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Show less" })).toHaveAttribute("aria-expanded", "true");
  });

  it("shows everything when Easy Mode is off", () => {
    render(<Home />);
    expect(screen.getByRole("heading", { name: "More ways I can help" })).toBeInTheDocument();
    expect(screen.getByRole("region", { name: "Your Tech Confidence" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "More" })).not.toBeInTheDocument();
  });
});

describe("Easy Mode on the step screen", () => {
  it("shows the four main step buttons and folds More help away until asked", async () => {
    setEasyMode(true);
    const guide = saveGuide({ id: "story", question: "How do I post a story?", title: "Post a story", answer });
    render(<StepPlayer guide={guide} />);
    for (const name of ["I did it", "Show me where", "I'm stuck", "That's not what I see"]) {
      expect(screen.getByRole("button", { name })).toBeInTheDocument();
    }
    expect(screen.queryByRole("button", { name: "Show me again" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Ask my family for help" })).not.toBeInTheDocument();
    const more = screen.getByRole("button", { name: "More help" });
    expect(more).toHaveAttribute("aria-expanded", "false");
    await userEvent.click(more);
    expect(more).toHaveAttribute("aria-expanded", "true");
    expect(screen.getByRole("button", { name: "Show me again" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Save this guide" })).toBeInTheDocument();
  });

  it("asks for very simple help with the step", async () => {
    setEasyMode(true);
    const fetchMock = vi.fn(async () => new Response(JSON.stringify({ kind: "explanation", language: "en", title: "t", text: "Tap it.", offerShowMeHow: false, alternative: null })));
    vi.stubGlobal("fetch", fetchMock);
    const guide = saveGuide({ id: "story", question: "How do I post a story?", title: "Post a story", answer });
    render(<StepPlayer guide={guide} />);
    await userEvent.click(screen.getByRole("button", { name: "More help" }));
    await userEvent.click(screen.getByRole("button", { name: "Show me again" }));
    await waitFor(() => expect(fetchMock).toHaveBeenCalled());
    const body = JSON.parse(String(((fetchMock.mock.calls[0] as unknown[])[1] as RequestInit).body));
    expect(body.level).toBe("very_simple");
  });
});

describe("Hinglish", () => {
  it("is offered in Settings next to English and हिन्दी, and switches the interface", async () => {
    render(<Settings />);
    await userEvent.click(screen.getByRole("button", { name: "Settings" }));
    const group = screen.getByRole("group", { name: "Language" });
    expect(within(group).getAllByRole("button").map((b) => b.textContent?.replace("✓", ""))).toEqual([
      "English",
      "हिन्दी",
      "Hinglish",
    ]);
    await userEvent.click(within(group).getByRole("button", { name: "Hinglish" }));
    expect(getUiLanguage()).toBe("hinglish");
    expect(html().lang).toBe("hi-Latn");
    expect(screen.getByRole("heading", { name: "Bhasha" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Hinglish" })).toHaveAttribute("lang", "hi-Latn");
  });

  it("asks in Hinglish: heard as en-IN, answered in hi-Latn", async () => {
    setUiLanguage("hinglish");
    const fetchMock = vi.fn(async () => new Response(JSON.stringify({ kind: "off_topic", language: "hi-Latn", message: "x" })));
    vi.stubGlobal("fetch", fetchMock);
    render(<AskBox />);
    await userEvent.type(screen.getByLabelText("Aap kya karna chahte hain?"), "photo kaise bhejun");
    await userEvent.click(screen.getByRole("button", { name: "Poochiye" }));
    await waitFor(() => expect(fetchMock).toHaveBeenCalled());
    const body = JSON.parse(String(((fetchMock.mock.calls[0] as unknown[])[1] as RequestInit).body));
    expect(body).toMatchObject({ language: "en-IN", answerLanguage: "hi-Latn" });
  });

  it("offers English for a Hinglish guide, from the Hinglish interface", () => {
    setUiLanguage("hinglish");
    const guide = saveGuide({ id: "story", question: "story kaise daalein", title: "Story", answer: { ...answer, language: "hi-Latn" } });
    render(<StepPlayer guide={guide} onReplace={() => {}} />);
    expect(screen.getByRole("button", { name: "Isse English mein samjhaiye" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Maine kar liya" })).toBeInTheDocument();
  });

  it("reads Hinglish with an Indian English voice", async () => {
    const speak = vi.fn();
    vi.stubGlobal("speechSynthesis", { speak, pause: vi.fn(), resume: vi.fn(), cancel: vi.fn() });
    vi.stubGlobal(
      "SpeechSynthesisUtterance",
      class {
        lang = "";
        rate = 1;
        onend = null;
        constructor(public text: string) {}
      },
    );
    const { speak: say } = await import("@/lib/speech/speech");
    say("Settings kholiye", "hi-Latn");
    expect(speak).toHaveBeenCalledWith(expect.objectContaining({ lang: "en-IN" }));
  });
});
