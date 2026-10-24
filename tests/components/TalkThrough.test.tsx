import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import StepPlayer, { type StepsAnswer } from "@/components/StepPlayer";
import { STORAGE_KEY, getGuideStep, saveGuide, setPreferredDevice, setUiLanguage, type SavedGuide } from "@/lib/store/localStore";
import { isTalkThroughRequested, requestTalkThrough } from "@/lib/speech/talkIntent";
import Home from "@/app/app/page";

const push = vi.fn();
vi.mock("next/navigation", () => ({ useRouter: () => ({ push }), useSearchParams: () => new URLSearchParams() }));

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

type Utterance = { text: string; lang: string; rate: number; onend: (() => void) | null };

function mockVoice() {
  const spoken: Utterance[] = [];
  const speak = vi.fn((u: Utterance) => spoken.push(u));
  vi.stubGlobal("speechSynthesis", { speak, pause: vi.fn(), resume: vi.fn(), cancel: vi.fn(), paused: false });
  vi.stubGlobal(
    "SpeechSynthesisUtterance",
    class {
      lang = "";
      rate = 1;
      onend: (() => void) | null = null;
      constructor(public text: string) {}
    },
  );
  vi.stubGlobal("SpeechRecognition", FakeRecognition);
  return { spoken, speak };
}

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

const seed = (): SavedGuide<StepsAnswer> => saveGuide({ id: "story", question: "How do I post a story?", title: "Post a story", answer });
const mic = () => FakeRecognition.instances[FakeRecognition.instances.length - 1];
/** The last step reading finishes, so the microphone opens. */
const finishReading = (spoken: Utterance[]) => act(() => spoken[spoken.length - 1].onend?.());
/** The learner says something, then the microphone ends as browsers do. */
function say(text: string) {
  act(() => {
    const m = mic();
    m.onresult?.({ results: [[{ transcript: text }]] });
    m.onend?.();
  });
}

describe("Talk me through it", () => {
  beforeEach(() => {
    FakeRecognition.instances = [];
    localStorage.setItem(STORAGE_KEY, "{}");
  });
  afterEach(() => vi.unstubAllGlobals());

  it("is hidden when the browser cannot listen", () => {
    vi.stubGlobal("speechSynthesis", { speak: vi.fn(), pause: vi.fn(), resume: vi.fn(), cancel: vi.fn() });
    vi.stubGlobal("SpeechSynthesisUtterance", class {});
    render(<StepPlayer guide={seed()} />);
    expect(screen.getByRole("button", { name: "Read this to me" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Talk me through it" })).not.toBeInTheDocument();
  });

  it("reads each step, listens, and moves on with done, repeat and back", async () => {
    const { spoken } = mockVoice();
    render(<StepPlayer guide={seed()} />);
    await userEvent.click(screen.getByRole("button", { name: "Talk me through it" }));
    expect(spoken.at(-1)?.text).toBe("Say thing 1");
    expect(screen.getByRole("region", { name: "Voice help" })).toHaveTextContent("Reading the step to you…");
    expect(FakeRecognition.instances).toHaveLength(0);

    finishReading(spoken);
    expect(mic().start).toHaveBeenCalled();
    expect(screen.getByRole("region", { name: "Voice help" })).toHaveTextContent("Listening…");

    say("I did it");
    expect(screen.getByText("Step 2 of 3")).toBeInTheDocument();
    expect(getGuideStep("story")).toBe(2);
    expect(spoken.at(-1)?.text).toBe("Say thing 2");
    expect(screen.getByText("I heard: “I did it”")).toBeInTheDocument();

    finishReading(spoken);
    say("phir se");
    expect(screen.getByText("Step 2 of 3")).toBeInTheDocument();
    expect(spoken.at(-1)?.text).toBe("Say thing 2");

    finishReading(spoken);
    say("go back");
    expect(screen.getByText("Step 1 of 3")).toBeInTheDocument();
    expect(spoken.at(-1)?.text).toBe("Say thing 1");
  });

  it("opens I'm stuck on help, and stops on stop", async () => {
    const { spoken } = mockVoice();
    render(<StepPlayer guide={seed()} />);
    await userEvent.click(screen.getByRole("button", { name: "Talk me through it" }));
    finishReading(spoken);
    say("madad");
    expect(screen.getByRole("heading", { name: "What's the trouble?" })).toBeInTheDocument();
    expect(screen.queryByRole("region", { name: "Voice help" })).not.toBeInTheDocument();

    await userEvent.click(screen.getByRole("button", { name: "Back to the step" }));
    await userEvent.click(screen.getByRole("button", { name: "Talk me through it" }));
    finishReading(spoken);
    const listening = mic();
    say("stop");
    expect(screen.queryByRole("region", { name: "Voice help" })).not.toBeInTheDocument();
    expect(FakeRecognition.instances.at(-1)).toBe(listening);
    expect(screen.getByRole("button", { name: "Talk me through it" })).toBeInTheDocument();
  });

  it("says when it did not understand, listens again, and pauses after a few silences", async () => {
    const { spoken } = mockVoice();
    render(<StepPlayer guide={seed()} />);
    await userEvent.click(screen.getByRole("button", { name: "Talk me through it" }));
    finishReading(spoken);
    say("banana");
    expect(screen.getByText("Sorry, I didn't catch that.")).toBeInTheDocument();
    expect(FakeRecognition.instances).toHaveLength(2);
    expect(screen.getByText("Step 1 of 3")).toBeInTheDocument();

    for (let i = 0; i < 2; i++) {
      act(() => {
        mic().onerror?.({ error: "no-speech" });
        mic().onend?.();
      });
    }
    expect(screen.getByRole("region", { name: "Voice help" })).toHaveTextContent("I've stopped listening for now.");
    const count = FakeRecognition.instances.length;
    await userEvent.click(screen.getByRole("button", { name: "Listen again" }));
    expect(FakeRecognition.instances).toHaveLength(count + 1);
    expect(screen.getByRole("region", { name: "Voice help" })).toHaveTextContent("Listening…");
  });

  it("stops the microphone when the tab is hidden, on an error, and on leaving", async () => {
    const { spoken } = mockVoice();
    const { unmount } = render(<StepPlayer guide={seed()} />);
    await userEvent.click(screen.getByRole("button", { name: "Talk me through it" }));
    finishReading(spoken);
    const first = mic();
    const visibility = vi.spyOn(document, "visibilityState", "get").mockReturnValue("hidden");
    act(() => {
      document.dispatchEvent(new Event("visibilitychange"));
    });
    visibility.mockRestore();
    expect(first.stop).toHaveBeenCalled();
    expect(screen.queryByRole("region", { name: "Voice help" })).not.toBeInTheDocument();

    await userEvent.click(screen.getByRole("button", { name: "Talk me through it" }));
    finishReading(spoken);
    act(() => {
      mic().onerror?.({ error: "not-allowed" });
      mic().onend?.();
    });
    expect(screen.queryByRole("region", { name: "Voice help" })).not.toBeInTheDocument();
    expect(screen.getByText("The microphone is not allowed. You can type in the box instead.")).toBeInTheDocument();

    await userEvent.click(screen.getByRole("button", { name: "Talk me through it" }));
    finishReading(spoken);
    const last = mic();
    unmount();
    expect(last.stop).toHaveBeenCalled();
  });

  it("listens in the saved speaking language", async () => {
    setUiLanguage("hinglish");
    const { spoken } = mockVoice();
    render(<StepPlayer guide={seed()} />);
    await userEvent.click(screen.getByRole("button", { name: "Bolkar saath chaliye" }));
    finishReading(spoken);
    expect(mic().lang).toBe("en-IN");
    say("ho gaya");
    expect(screen.getByText("3 mein se step 2")).toBeInTheDocument();
  });

  it("starts by itself when asked for on home, and ends on the last step", () => {
    const { spoken } = mockVoice();
    requestTalkThrough();
    render(<StepPlayer guide={seed()} />);
    expect(isTalkThroughRequested()).toBe(false);
    expect(spoken.at(-1)?.text).toBe("Say thing 1");
    for (let i = 0; i < 3; i++) {
      finishReading(spoken);
      say("done");
    }
    expect(screen.getByRole("heading", { name: "You did it!" })).toBeInTheDocument();
    expect(FakeRecognition.instances).toHaveLength(3);
  });
});

describe("Talk me through it on home", () => {
  beforeEach(() => {
    FakeRecognition.instances = [];
    push.mockReset();
    localStorage.setItem(STORAGE_KEY, "{}");
    setPreferredDevice("iPhone");
  });
  afterEach(() => vi.unstubAllGlobals());

  it("listens for the question, asks it straight away and asks the guide to talk", async () => {
    mockVoice();
    const fetchMock = vi.fn(async () => new Response(JSON.stringify(answer)));
    vi.stubGlobal("fetch", fetchMock);
    render(<Home />);
    await userEvent.click(screen.getByRole("button", { name: "Talk me through it" }));
    expect(screen.getByRole("button", { name: "Listening… tap to stop" })).toHaveAttribute("aria-pressed", "true");
    expect(screen.getByRole("button", { name: "Speak" })).toHaveAttribute("aria-pressed", "false");
    act(() => {
      mic().onresult?.({ results: [[{ transcript: "how do I post a story" }]] });
      mic().onend?.();
    });
    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(1));
    const body = JSON.parse(String((fetchMock.mock.calls[0] as unknown as [string, RequestInit])[1].body));
    expect(body.question).toBe("how do I post a story");
    await waitFor(() => expect(push).toHaveBeenCalledWith(expect.stringMatching(/^\/guide\//)));
    expect(isTalkThroughRequested()).toBe(true);
  });

  it("forgets the request when nothing was heard", async () => {
    mockVoice();
    render(<Home />);
    await userEvent.click(screen.getByRole("button", { name: "Talk me through it" }));
    act(() => {
      mic().onerror?.({ error: "no-speech" });
      mic().onend?.();
    });
    expect(isTalkThroughRequested()).toBe(false);
  });
});
