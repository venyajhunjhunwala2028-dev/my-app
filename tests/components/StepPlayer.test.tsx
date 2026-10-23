import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import {
  STORAGE_KEY,
  getCompletedLessons,
  getCurrentGuide,
  getGuide,
  getSavedGuides,
  getSlowSpeech,
  requestAllowance,
  saveGuide,
  setCurrentGuide,
  type SavedGuide,
} from "@/lib/store/localStore";
import StepPlayer, { type StepsAnswer } from "@/components/StepPlayer";
import GuidePage from "@/app/guide/[id]/page";

const push = vi.hoisted(() => vi.fn());
vi.mock("next/navigation", () => ({ useRouter: () => ({ push }) }));
// jsdom cannot decode or draw images, so the resize step is replaced.
vi.mock("@/lib/image/resize", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/lib/image/resize")>()),
  resizeScreenshot: vi.fn(async () => ({ base64: "AAAA", mediaType: "image/jpeg", width: 1000, height: 2000 })),
}));

const step = (n: number) => ({ instruction: `Do thing ${n}`, lookFor: `Button ${n}`, spoken: `Say thing ${n}`, encouragement: "" });

const answer: StepsAnswer = {
  kind: "steps",
  language: "hi",
  title: "Post a story",
  device: "iPhone",
  app: null,
  safety: null,
  steps: [1, 2, 3, 4].map(step),
  screenshotHowTo: ["Press the side button and volume up"],
};

function seed(): SavedGuide<StepsAnswer> {
  const saved = saveGuide({ id: "story", question: "How do I post a story?", title: "Post a story", answer });
  setCurrentGuide("story");
  return saved;
}

const stored = () => getGuide("story") as SavedGuide<StepsAnswer>;
const done = () => userEvent.click(screen.getByRole("button", { name: "I did it" }));

const explain = (text: string, alternative: string | null = null) => ({
  kind: "explanation",
  language: "hi",
  title: "Help",
  text,
  offerShowMeHow: false,
  alternative,
});

function mockSpeech() {
  const speak = vi.fn();
  const pause = vi.fn();
  const resume = vi.fn();
  const cancel = vi.fn();
  vi.stubGlobal("speechSynthesis", { speak, pause, resume, cancel });
  vi.stubGlobal(
    "SpeechSynthesisUtterance",
    class {
      lang = "";
      rate = 1;
      onend = null;
      constructor(public text: string) {}
    },
  );
  return { speak, pause, resume, cancel };
}

function bodyOf(fetchMock: ReturnType<typeof vi.fn>, call: number) {
  return JSON.parse(String(((fetchMock.mock.calls[call] as unknown[])[1] as RequestInit).body));
}

function mockFetch(body: unknown) {
  const fetchMock = vi.fn(async () => new Response(JSON.stringify(body), { status: 200 }));
  vi.stubGlobal("fetch", fetchMock);
  return fetchMock;
}

describe("StepPlayer", () => {
  beforeEach(() => {
    localStorage.setItem(STORAGE_KEY, "{}");
  });
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("shows only step 1 of 4 with no Previous; Done goes to step 2 and Previous returns to step 1", async () => {
    render(<StepPlayer guide={seed()} />);
    expect(screen.getByText("Step 1 of 4")).toBeInTheDocument();
    expect(screen.getByText("Do thing 1")).toBeInTheDocument();
    expect(screen.getByText(/Button 1/)).toBeInTheDocument();
    expect(screen.queryByText("Do thing 2")).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Previous step" })).not.toBeInTheDocument();

    await done();
    expect(screen.getByText("Step 2 of 4")).toBeInTheDocument();
    expect(screen.getByText("Do thing 2")).toBeInTheDocument();
    expect(screen.queryByText("Do thing 1")).not.toBeInTheDocument();

    await userEvent.click(screen.getByRole("button", { name: "Previous step" }));
    expect(screen.getByText("Step 1 of 4")).toBeInTheDocument();
  });

  it("reopens on step 3 after a reload of the guide page (AE1)", async () => {
    const { unmount } = render(<StepPlayer guide={seed()} />);
    await done();
    await done();
    expect(screen.getByText("Step 3 of 4")).toBeInTheDocument();
    expect(stored().step).toBe(3);
    unmount();

    await act(async () => {
      render(<GuidePage params={Promise.resolve({ id: "story" })} />);
    });
    expect(await screen.findByText("Step 3 of 4")).toBeInTheDocument();
    expect(screen.getByText("Do thing 3")).toBeInTheDocument();
  });

  it("finishing the last step shows You did it and the guide stays in My guides", async () => {
    render(<StepPlayer guide={seed()} />);
    for (let i = 0; i < 4; i++) await done();
    expect(screen.getByRole("heading", { name: "You did it!" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Go home" })).toHaveAttribute("href", "/app");
    expect(getSavedGuides().map((g) => g.id)).toContain("story");
    expect(getCurrentGuide()).toBeNull();
    expect(screen.getByRole("link", { name: "Learn something else" })).toHaveAttribute("href", "/app/learn");
    expect(getCompletedLessons()).toEqual([]);
  });

  it("marks the lesson complete when a lesson's guide reaches the success screen", async () => {
    const saved = saveGuide({ id: "lesson", question: "Teach me how to take a screenshot", title: "Post a story", answer, lessonId: "screenshot" });
    render(<StepPlayer guide={saved} />);
    for (let i = 0; i < 3; i++) await done();
    expect(getCompletedLessons()).toEqual([]);
    await done();
    expect(screen.getByRole("heading", { name: "You did it!" })).toBeInTheDocument();
    expect(getCompletedLessons()).toEqual(["screenshot"]);
  });

  it("after tapping Play once, the next step is read automatically in the answer's language", async () => {
    const { speak } = mockSpeech();
    render(<StepPlayer guide={seed()} />);
    await userEvent.click(screen.getByRole("button", { name: "Play" }));
    expect(speak).toHaveBeenLastCalledWith(expect.objectContaining({ text: "Say thing 1", lang: "hi" }));

    await done();
    expect(speak).toHaveBeenCalledTimes(2);
    expect(speak).toHaveBeenLastCalledWith(expect.objectContaining({ text: "Say thing 2", lang: "hi" }));
    expect(screen.getByRole("button", { name: "Pause" })).toBeInTheDocument();
  });

  it("hides the voice buttons when the phone cannot speak", () => {
    render(<StepPlayer guide={seed()} />);
    expect(screen.queryByRole("button", { name: "Play" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Replay" })).not.toBeInTheDocument();
  });

  it("Show me again asks about the current step with no typing and keeps the same step", async () => {
    const fetchMock = mockFetch({ kind: "explanation", language: "hi", title: "Help", text: "It is the blue button.", offerShowMeHow: false });
    render(<StepPlayer guide={seed()} />);
    await done();
    await userEvent.click(screen.getByRole("button", { name: "Show me again" }));

    expect(await screen.findByText("It is the blue button.")).toBeInTheDocument();
    expect(screen.getByText("Step 2 of 4")).toBeInTheDocument();
    expect(screen.getByText("Do thing 2")).toBeInTheDocument();
    const body = JSON.parse(String(((fetchMock.mock.calls[0] as unknown[])[1] as RequestInit).body));
    expect(body).toMatchObject({
      question: "Do thing 2",
      mode: "showAgain",
      guideContext: { title: "Post a story", steps: ["Do thing 1", "Do thing 2", "Do thing 3", "Do thing 4"], stepIndex: 1 },
    });

    await userEvent.click(screen.getByRole("button", { name: "Back to the step" }));
    expect(screen.queryByText("It is the blue button.")).not.toBeInTheDocument();
    expect(screen.getByText("Step 2 of 4")).toBeInTheDocument();
  });

  it("at 30 uses today, Show me again shows the ready-tomorrow message and sends nothing", async () => {
    const fetchMock = mockFetch({});
    for (let i = 0; i < 30; i++) requestAllowance();
    render(<StepPlayer guide={seed()} />);
    await userEvent.click(screen.getByRole("button", { name: "Show me again" }));
    await waitFor(() => expect(screen.getByText(/ready again tomorrow/i)).toBeInTheDocument());
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("drops a late follow-up answer after moving to the next step, and Show me again works again", async () => {
    let resolveFirst: (r: Response) => void = () => {};
    const json = (text: string) =>
      new Response(JSON.stringify({ kind: "explanation", language: "hi", title: "Help", text, offerShowMeHow: false }), { status: 200 });
    const fetchMock = vi
      .fn()
      .mockImplementationOnce(() => new Promise<Response>((r) => (resolveFirst = r)))
      .mockImplementation(async () => json("Second answer"));
    vi.stubGlobal("fetch", fetchMock);
    render(<StepPlayer guide={seed()} />);
    await userEvent.click(screen.getByRole("button", { name: "Show me again" }));
    await done();
    expect(screen.getByText("Step 2 of 4")).toBeInTheDocument();

    await act(async () => {
      resolveFirst(json("Late answer for step 1"));
    });
    expect(screen.queryByText("Late answer for step 1")).not.toBeInTheDocument();
    expect(screen.queryByRole("region", { name: "Help with this step" })).not.toBeInTheDocument();

    await userEvent.click(screen.getByRole("button", { name: "Show me again" }));
    expect(await screen.findByText("Second answer")).toBeInTheDocument();
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it("drops a late follow-up answer after Back to the step", async () => {
    let resolveFirst: (r: Response) => void = () => {};
    vi.stubGlobal("fetch", vi.fn(() => new Promise<Response>((r) => (resolveFirst = r))));
    render(<StepPlayer guide={seed()} />);
    await userEvent.click(screen.getByRole("button", { name: "Show me again" }));
    await userEvent.click(screen.getByRole("button", { name: "Back to the step" }));
    await act(async () => {
      resolveFirst(
        new Response(JSON.stringify({ kind: "explanation", language: "hi", title: "Help", text: "Too late", offerShowMeHow: false }), { status: 200 }),
      );
    });
    expect(screen.queryByText("Too late")).not.toBeInTheDocument();
  });

  it("stops listening for a specific question when moving to the next step or leaving", async () => {
    const stops: ReturnType<typeof vi.fn>[] = [];
    vi.stubGlobal(
      "SpeechRecognition",
      class {
        lang = "";
        continuous = false;
        interimResults = false;
        maxAlternatives = 1;
        onresult = null;
        onerror = null;
        onend = null;
        start = vi.fn();
        stop = vi.fn();
        constructor() {
          stops.push(this.stop);
        }
      },
    );
    mockFetch({ kind: "explanation", language: "hi", title: "Help", text: "It is the blue button.", offerShowMeHow: false });
    const { unmount } = render(<StepPlayer guide={seed()} />);
    await userEvent.click(screen.getByRole("button", { name: "Show me again" }));
    await screen.findByText("It is the blue button.");
    await userEvent.click(screen.getByRole("button", { name: "Speak" }));
    expect(stops).toHaveLength(1);
    await done();
    expect(stops[0]).toHaveBeenCalled();

    await userEvent.click(screen.getByRole("button", { name: "Show me again" }));
    await screen.findByText("It is the blue button.");
    await userEvent.click(screen.getByRole("button", { name: "Speak" }));
    unmount();
    expect(stops[1]).toHaveBeenCalled();
  });
});

describe("StepPlayer phase 1 help, voice and progress", () => {
  beforeEach(() => {
    localStorage.setItem(STORAGE_KEY, "{}");
  });
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("Show me again sends the last explanation shown for this step, and Explain more simply sends simpler", async () => {
    const fetchMock = vi
      .fn()
      .mockImplementationOnce(async () => new Response(JSON.stringify(explain("First words.")), { status: 200 }))
      .mockImplementationOnce(async () => new Response(JSON.stringify(explain("Other words.")), { status: 200 }))
      .mockImplementation(async () => new Response(JSON.stringify(explain("Tiny words.")), { status: 200 }));
    vi.stubGlobal("fetch", fetchMock);
    render(<StepPlayer guide={seed()} />);

    await userEvent.click(screen.getByRole("button", { name: "Show me again" }));
    expect(await screen.findByText("First words.")).toBeInTheDocument();
    expect(bodyOf(fetchMock, 0)).toMatchObject({ mode: "showAgain", guideContext: { stepIndex: 0 } });
    expect(bodyOf(fetchMock, 0).previousExplanation).toBeUndefined();

    await userEvent.click(screen.getByRole("button", { name: "Show me again" }));
    expect(await screen.findByText("Other words.")).toBeInTheDocument();
    expect(bodyOf(fetchMock, 1)).toMatchObject({ mode: "showAgain", previousExplanation: "First words." });

    await userEvent.click(screen.getByRole("button", { name: "Explain more simply" }));
    expect(await screen.findByText("Tiny words.")).toBeInTheDocument();
    expect(bodyOf(fetchMock, 2)).toMatchObject({
      question: "Do thing 1",
      mode: "simpler",
      level: "very_simple",
      guideContext: { title: "Post a story", stepIndex: 0 },
    });
    // Asking something specific is still there.
    expect(screen.getByLabelText("Ask something specific")).toBeInTheDocument();
  });

  it("does not carry an explanation from one step into the next step's Show me again", async () => {
    const fetchMock = mockFetch(explain("Step one help."));
    render(<StepPlayer guide={seed()} />);
    await userEvent.click(screen.getByRole("button", { name: "Show me again" }));
    await screen.findByText("Step one help.");
    await done();
    await userEvent.click(screen.getByRole("button", { name: "Show me again" }));
    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(2));
    expect(bodyOf(fetchMock, 1).previousExplanation).toBeUndefined();
    expect(bodyOf(fetchMock, 1).guideContext.stepIndex).toBe(1);
  });

  it("I'm stuck asks what the trouble is, sends stuck with the trouble, shows Another way, and Back keeps the step", async () => {
    const fetchMock = mockFetch(explain("No problem. Tap the back arrow first.", "Use the search bar instead."));
    render(<StepPlayer guide={seed()} />);
    await done();
    await userEvent.click(screen.getByRole("button", { name: "I'm stuck" }));

    expect(screen.getByRole("heading", { name: "What's the trouble?" })).toBeInTheDocument();
    for (const name of ["I can't find it", "My screen looks different", "Nothing happens", "Something else"]) {
      expect(screen.getByRole("button", { name })).toBeInTheDocument();
    }
    expect(fetchMock).not.toHaveBeenCalled();

    await userEvent.click(screen.getByRole("button", { name: "My screen looks different" }));
    expect(await screen.findByText("No problem. Tap the back arrow first.")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Another way" })).toBeInTheDocument();
    expect(screen.getByText("Use the search bar instead.")).toBeInTheDocument();
    expect(bodyOf(fetchMock, 0)).toMatchObject({
      question: "Do thing 2",
      mode: "stuck",
      trouble: "My screen looks different",
      guideContext: { stepIndex: 1 },
    });
    expect(screen.getAllByRole("button", { name: "Show me where" }).length).toBeGreaterThan(0);

    await userEvent.click(screen.getByRole("button", { name: "Back to the step" }));
    expect(screen.queryByText("Use the search bar instead.")).not.toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: "What's the trouble?" })).not.toBeInTheDocument();
    expect(screen.getByText("Step 2 of 4")).toBeInTheDocument();
    expect(screen.getByText("Do thing 2")).toBeInTheDocument();
    expect(stored().step).toBe(2);
  });

  it("I'm stuck > Something else sends what the learner typed", async () => {
    const fetchMock = mockFetch(explain("Try pressing a little longer."));
    render(<StepPlayer guide={seed()} />);
    await userEvent.click(screen.getByRole("button", { name: "I'm stuck" }));
    await userEvent.click(screen.getByRole("button", { name: "Something else" }));
    await userEvent.type(screen.getByLabelText("Tell me what is wrong"), "The button is grey");
    await userEvent.click(screen.getByRole("button", { name: "Send" }));
    expect(await screen.findByText("Try pressing a little longer.")).toBeInTheDocument();
    expect(bodyOf(fetchMock, 0)).toMatchObject({ mode: "stuck", trouble: "The button is grey" });
    expect(screen.queryByRole("heading", { name: "Another way" })).not.toBeInTheDocument();
  });

  it("Show me on my screen from the stuck panel opens the screen helper and comes back to the same step", async () => {
    mockFetch(explain("No problem.", "Another route."));
    render(<StepPlayer guide={seed()} />);
    await done();
    await userEvent.click(screen.getByRole("button", { name: "I'm stuck" }));
    await userEvent.click(screen.getByRole("button", { name: "I can't find it" }));
    await screen.findByText("Another route.");
    const panel = screen.getByRole("region", { name: "Help with this step" });
    await userEvent.click(within(panel).getByRole("button", { name: "Show me where" }));
    expect(screen.getByRole("heading", { name: "Show me on my screen" })).toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: "Back to my step" }));
    expect(screen.getByText("Step 2 of 4")).toBeInTheDocument();
  });

  it("Play, Pause and Replay drive speechSynthesis", async () => {
    const { speak, pause, resume, cancel } = mockSpeech();
    render(<StepPlayer guide={seed()} />);

    await userEvent.click(screen.getByRole("button", { name: "Play" }));
    expect(speak).toHaveBeenCalledTimes(1);
    expect(speak).toHaveBeenLastCalledWith(expect.objectContaining({ text: "Say thing 1", rate: 1 }));

    await userEvent.click(screen.getByRole("button", { name: "Pause" }));
    expect(pause).toHaveBeenCalledTimes(1);

    await userEvent.click(screen.getByRole("button", { name: "Play" }));
    expect(resume).toHaveBeenCalledTimes(1);
    expect(speak).toHaveBeenCalledTimes(1);

    cancel.mockClear();
    await userEvent.click(screen.getByRole("button", { name: "Replay" }));
    expect(cancel).toHaveBeenCalled();
    expect(speak).toHaveBeenCalledTimes(2);
    expect(speak).toHaveBeenLastCalledWith(expect.objectContaining({ text: "Say thing 1" }));
  });

  it("Slower voice slows the speech to 0.75 and is remembered", async () => {
    const { speak } = mockSpeech();
    const { unmount } = render(<StepPlayer guide={seed()} />);
    const slower = screen.getByRole("button", { name: "Slower voice" });
    expect(slower).toHaveAttribute("aria-pressed", "false");
    await userEvent.click(slower);
    expect(slower).toHaveAttribute("aria-pressed", "true");
    expect(getSlowSpeech()).toBe(true);

    await userEvent.click(screen.getByRole("button", { name: "Play" }));
    expect(speak).toHaveBeenLastCalledWith(expect.objectContaining({ rate: 0.75 }));
    unmount();

    render(<StepPlayer guide={stored()} />);
    expect(screen.getByRole("button", { name: "Slower voice" })).toHaveAttribute("aria-pressed", "true");
  });

  it("help explanations can be played and replayed", async () => {
    const { speak } = mockSpeech();
    mockFetch(explain("It is the blue button."));
    render(<StepPlayer guide={seed()} />);
    await userEvent.click(screen.getByRole("button", { name: "Show me again" }));
    await screen.findByText("It is the blue button.");
    await userEvent.click(screen.getByRole("button", { name: "Play this help" }));
    expect(speak).toHaveBeenLastCalledWith(expect.objectContaining({ text: "It is the blue button.", lang: "hi" }));
    await userEvent.click(screen.getByRole("button", { name: "Replay this help" }));
    expect(speak).toHaveBeenCalledTimes(2);
  });

  it("shows an accessible progress bar that moves with the steps", async () => {
    render(<StepPlayer guide={seed()} />);
    const bar = screen.getByRole("progressbar");
    expect(bar).toHaveAttribute("aria-valuenow", "1");
    expect(bar).toHaveAttribute("aria-valuemax", "4");
    expect(bar).toHaveAttribute("aria-valuetext", "Step 1 of 4");
    await done();
    expect(screen.getByRole("progressbar")).toHaveAttribute("aria-valuenow", "2");
  });

  it("shows the previous step's encouragement after Done, or a default one", async () => {
    const guide = saveGuide({
      id: "cheer",
      question: "q",
      title: "t",
      answer: { ...answer, steps: [{ ...step(1), encouragement: "Well done!" }, step(2), step(3)] },
    });
    render(<StepPlayer guide={guide} />);
    expect(screen.queryByText("Well done!")).not.toBeInTheDocument();
    await done();
    expect(screen.getByText("Well done!")).toBeInTheDocument();
    await done();
    expect(screen.queryByText("Well done!")).not.toBeInTheDocument();
    expect(screen.getByText("Great! You're doing it.")).toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: "Previous step" }));
    expect(screen.queryByText("Great! You're doing it.")).not.toBeInTheDocument();
  });

  it("shows a safety banner from the guide's safety line", () => {
    const guide = saveGuide({ id: "s", question: "q", title: "t", answer: { ...answer, safety: "⚠️ Never share your OTP." } });
    render(<StepPlayer guide={guide} />);
    const banner = screen.getByRole("note", { name: "Safety warning" });
    expect(banner).toHaveTextContent("⚠️ Never share your OTP.");
  });

  it("shows a safety banner for a risky step even when the guide has no safety line", async () => {
    const guide = saveGuide({
      id: "s2",
      question: "q",
      title: "t",
      answer: {
        ...answer,
        language: "en",
        steps: [step(1), { instruction: "Type the code", lookFor: "The OTP box", spoken: "Type the code", encouragement: "" }],
      },
    });
    render(<StepPlayer guide={guide} />);
    expect(screen.queryByRole("note", { name: "Safety warning" })).not.toBeInTheDocument();
    await done();
    expect(screen.getByRole("note", { name: "Safety warning" })).toHaveTextContent(/⚠️ Never share an OTP/);
  });

  it("the success screen offers three ways on and saves whether it helped", async () => {
    render(<StepPlayer guide={seed()} />);
    for (let i = 0; i < 4; i++) await done();
    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent("🎉 You did it!");
    expect(screen.getByRole("link", { name: "Go home" })).toHaveAttribute("href", "/app");
    expect(screen.getByRole("link", { name: "Ask another question" }).getAttribute("href")).toMatch(/^\/app/);
    expect(screen.getByRole("link", { name: "Learn something else" }).getAttribute("href")).toMatch(/^\/app/);
    expect(screen.getByText("Was this helpful?")).toBeInTheDocument();
    expect(stored().helpful).toBeUndefined();

    await userEvent.click(screen.getByRole("button", { name: "Yes" }));
    expect(stored().helpful).toBe(true);
    expect(screen.getByText(/Thank you/)).toBeInTheDocument();

    await userEvent.click(screen.getByRole("button", { name: "No" }));
    expect(stored().helpful).toBe(false);
  });

  it("an old saved guide without encouragement, safety or app still plays through", async () => {
    const old = {
      kind: "steps",
      language: "en",
      title: "Old guide",
      device: null,
      steps: [
        { instruction: "Open it", lookFor: "Icon", spoken: "Open it" },
        { instruction: "Tap it", lookFor: "Button", spoken: "Tap it" },
      ],
      screenshotHowTo: ["Press buttons"],
    };
    const guide = saveGuide({ id: "old", question: "old q", title: "Old guide", answer: old });
    render(<StepPlayer guide={guide as unknown as SavedGuide<StepsAnswer>} />);
    expect(screen.getByText("Step 1 of 2")).toBeInTheDocument();
    expect(screen.queryByRole("note", { name: "Safety warning" })).not.toBeInTheDocument();
    await done();
    expect(screen.getByText("Great! You're doing it.")).toBeInTheDocument();
    await done();
    expect(screen.getByRole("heading", { name: "You did it!" })).toBeInTheDocument();
  });

  it("Ask my family for help shares the guide title and the current step, and closing keeps the step", async () => {
    render(<StepPlayer guide={seed()} />);
    await done();
    await userEvent.click(screen.getByRole("button", { name: "Ask my family for help" }));
    const dialog = screen.getByRole("dialog", { name: "Ask my family" });
    const lines = [...within(dialog).getByTestId("family-message").querySelectorAll("p")].map((p) => p.textContent);
    expect(lines).toEqual(["I need help with: Post a story", "I'm on step 2 of 4: Do thing 2", "Sent from Tech Helper"]);
    await userEvent.click(within(dialog).getByRole("button", { name: "Close" }));
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(screen.getByText("Step 2 of 4")).toBeInTheDocument();
  });

  describe("instruction card", () => {
    it("shows the goal on top and one dot per step, filled up to the current step, under the same progress bar", async () => {
      render(<StepPlayer guide={seed()} />);
      expect(screen.getByText("Post a story")).toBeInTheDocument();
      const bar = screen.getByRole("progressbar");
      const dots = within(bar).getAllByTestId("progress-dot");
      expect(dots).toHaveLength(4);
      expect(dots.map((d) => d.dataset.state)).toEqual(["current", "todo", "todo", "todo"]);
      await done();
      await done();
      const later = within(screen.getByRole("progressbar")).getAllByTestId("progress-dot");
      expect(later.map((d) => d.dataset.state)).toEqual(["done", "done", "current", "todo"]);
      expect(screen.getByRole("progressbar")).toHaveAttribute("aria-valuetext", "Step 3 of 4");
      expect(screen.getByText("Step 3 of 4")).toBeInTheDocument();
    });

    it("has the four big step buttons, with their emoji hidden from screen readers", () => {
      render(<StepPlayer guide={seed()} />);
      for (const [name, emoji] of [
        ["I did it", "✓"],
        ["Show me where", "📱"],
        ["I'm stuck", "❓"],
        ["That's not what I see", "🖼️"],
      ]) {
        const button = screen.getByRole("button", { name });
        expect(within(button).getByText(emoji)).toHaveAttribute("aria-hidden", "true");
      }
    });

    it("the mascot is ready on a step, thinking while help loads, and worried on a safety banner", async () => {
      let resolve: (r: Response) => void = () => {};
      vi.stubGlobal("fetch", vi.fn(() => new Promise<Response>((r) => (resolve = r))));
      const guide = saveGuide({ id: "m", question: "q", title: "t", answer: { ...answer, safety: "⚠️ Never share your OTP." } });
      render(<StepPlayer guide={guide} />);
      const banner = screen.getByRole("note", { name: "Safety warning" });
      expect(within(banner).getByTestId("mascot")).toHaveAttribute("data-mood", "warning");
      expect(screen.getByTestId("step-mascot")).toHaveAttribute("data-mood", "ready");

      await userEvent.click(screen.getByRole("button", { name: "Show me again" }));
      expect(screen.getByTestId("step-mascot")).toHaveAttribute("data-mood", "thinking");
      await act(async () => resolve(new Response(JSON.stringify(explain("It is the blue button.")), { status: 200 })));
      expect(await screen.findByText("It is the blue button.")).toBeInTheDocument();
      expect(screen.getByTestId("step-mascot")).toHaveAttribute("data-mood", "ready");
    });

    it("the success screen celebrates with the mascot, a big tick and a short burst", async () => {
      render(<StepPlayer guide={seed()} />);
      for (let i = 0; i < 4; i++) await done();
      expect(screen.getByTestId("mascot")).toHaveAttribute("data-mood", "celebrate");
      expect(screen.getByTestId("success-tick")).toHaveAttribute("aria-hidden", "true");
      expect(screen.getByTestId("confetti")).toHaveAttribute("aria-hidden", "true");
    });
  });

  describe("do it with me", () => {
    const png = () => new File([new Uint8Array(10)], "shot.png", { type: "image/png" });
    const screenHelp = (over: Record<string, unknown> = {}) => ({
      kind: "screen_help",
      language: "en",
      onTrack: false,
      diagnosis: "That's okay. You're on the home screen.",
      steps: [
        { instruction: "Tap the back arrow.", lookFor: "Top left.", spoken: "Tap the back arrow.", encouragement: "Good." },
        { instruction: "Tap Share now.", lookFor: "Bottom.", spoken: "Tap Share now.", encouragement: "" },
      ],
      box: { x: 400, y: 1700, width: 200, height: 100 },
      ...over,
    });

    async function sendScreenshot(buttonName: string) {
      const u = userEvent.setup({ applyAccept: false });
      await u.click(screen.getByRole("button", { name: buttonName }));
      expect(screen.getByRole("button", { name: "Choose your screenshot" })).toBeDisabled();
      await u.click(screen.getByRole("button", { name: "I understand" }));
      await u.upload(screen.getByTestId("step-screenshot-input"), png());
    }

    it("That's not what I see sends the task, step, previous step and screenshot, then corrects the steps from here", async () => {
      const fetchMock = mockFetch(screenHelp());
      render(<StepPlayer guide={seed()} />);
      await done();
      await sendScreenshot("That's not what I see");

      expect(await screen.findByText("That's okay. You're on the home screen.")).toBeInTheDocument();
      expect(bodyOf(fetchMock, 0)).toMatchObject({
        question: "Do thing 2",
        mode: "notWhatISee",
        previousInstruction: "Do thing 1",
        image: "AAAA",
        mediaType: "image/jpeg",
        width: 1000,
        height: 2000,
        guideContext: { title: "Post a story", stepIndex: 1 },
      });
      // Same step number, the corrected step, and the rest replaced: 1 kept + 2 new.
      expect(screen.getByText("Step 2 of 3")).toBeInTheDocument();
      expect(screen.getByRole("heading", { level: 1, name: "Tap the back arrow." })).toBeInTheDocument();
      expect(screen.queryByText("Do thing 2")).not.toBeInTheDocument();
      expect(screen.getByText("I've changed the steps to match your screen.")).toBeInTheDocument();
      expect(screen.getByText("Tech Helper found it")).toBeInTheDocument();
      expect(screen.getByTestId("tap-circle")).toBeInTheDocument();
      expect(stored().answer.steps.map((s) => s.instruction)).toEqual(["Do thing 1", "Tap the back arrow.", "Tap Share now."]);
      expect(stored().step).toBe(2);
      // The screenshot is never saved.
      expect(localStorage.getItem(STORAGE_KEY)).not.toContain("AAAA");

      await userEvent.click(screen.getByRole("button", { name: "Try this step" }));
      expect(screen.queryByText("That's okay. You're on the home screen.")).not.toBeInTheDocument();
      await done();
      expect(screen.getByRole("heading", { level: 1, name: "Tap Share now." })).toBeInTheDocument();
    });

    it("Check my screen says Yes, you're in the right place and moves on", async () => {
      const fetchMock = mockFetch(screenHelp({ onTrack: true, diagnosis: "The photo is ready.", steps: [], box: null }));
      render(<StepPlayer guide={seed()} />);
      await sendScreenshot("Check my screen");
      expect(await screen.findByText("Yes, you're in the right place.")).toBeInTheDocument();
      expect(screen.getByText("The photo is ready.")).toBeInTheDocument();
      expect(bodyOf(fetchMock, 0)).toMatchObject({ mode: "checkScreen", image: "AAAA", guideContext: { stepIndex: 0 } });
      expect(bodyOf(fetchMock, 0).previousInstruction).toBeUndefined();
      expect(screen.queryByTestId("tap-circle")).not.toBeInTheDocument();
      await userEvent.click(screen.getByRole("button", { name: "Go to the next step" }));
      expect(screen.getByText("Step 2 of 4")).toBeInTheDocument();
      expect(stored().answer.steps).toHaveLength(4);
    });

    it("Check my screen off track gives what to do instead", async () => {
      mockFetch(screenHelp({ diagnosis: "Not quite. Tap the back arrow first." }));
      render(<StepPlayer guide={seed()} />);
      await sendScreenshot("Check my screen");
      expect(await screen.findByText("Not quite. Tap the back arrow first.")).toBeInTheDocument();
      expect(screen.queryByText("Yes, you're in the right place.")).not.toBeInTheDocument();
      expect(screen.getByRole("heading", { level: 1, name: "Tap the back arrow." })).toBeInTheDocument();
    });

    it("I'm stuck sends the latest screenshot from this guide with the trouble, and shows the diagnosis and fix", async () => {
      const fetchMock = vi
        .fn()
        .mockResolvedValueOnce(new Response(JSON.stringify(screenHelp({ onTrack: true, steps: [], box: null, diagnosis: "Fine." })), { status: 200 }))
        .mockResolvedValueOnce(
          new Response(JSON.stringify(screenHelp({ diagnosis: "That's okay. A menu opened by mistake.", box: null })), { status: 200 }),
        );
      vi.stubGlobal("fetch", fetchMock);
      render(<StepPlayer guide={seed()} />);
      await sendScreenshot("Check my screen");
      await screen.findByText("Fine.");
      await userEvent.click(screen.getByRole("button", { name: "Back to the step" }));

      await userEvent.click(screen.getByRole("button", { name: "I'm stuck" }));
      expect(screen.getByText("That's okay. Take your time.")).toBeInTheDocument();
      expect(screen.getByText("I'll also look at the last screenshot you sent.")).toBeInTheDocument();
      await userEvent.click(screen.getByRole("button", { name: "Nothing happens" }));
      expect(await screen.findByText("That's okay. A menu opened by mistake.")).toBeInTheDocument();
      expect(bodyOf(fetchMock, 1)).toMatchObject({ mode: "stuck", trouble: "Nothing happens", image: "AAAA", question: "Do thing 1" });
      expect(screen.getByRole("heading", { level: 1, name: "Tap the back arrow." })).toBeInTheDocument();
    });

    it("I'm stuck without any screenshot sends no image", async () => {
      const fetchMock = mockFetch(explain("No problem."));
      render(<StepPlayer guide={seed()} />);
      await userEvent.click(screen.getByRole("button", { name: "I'm stuck" }));
      expect(screen.queryByText("I'll also look at the last screenshot you sent.")).not.toBeInTheDocument();
      await userEvent.click(screen.getByRole("button", { name: "I can't find it" }));
      await screen.findByText("No problem.");
      expect(bodyOf(fetchMock, 0).image).toBeUndefined();
    });

    it("shows a reassuring line on each step when there is no praise", async () => {
      render(<StepPlayer guide={seed()} />);
      expect(screen.getByTestId("reassurance")).toHaveTextContent("Let's do it together.");
      await done();
      expect(screen.queryByTestId("reassurance")).not.toBeInTheDocument();
      await userEvent.click(screen.getByRole("button", { name: "Previous step" }));
      await userEvent.click(screen.getByRole("button", { name: "I did it" }));
      await userEvent.click(screen.getByRole("button", { name: "Previous step" }));
      expect(screen.getByTestId("reassurance")).toHaveTextContent("Let's do it together.");
    });

    it("offers Teach me how to do this myself next time, which asks a teach-style question and opens the new guide", async () => {
      push.mockReset();
      const fetchMock = mockFetch({ ...answer, title: "Learn: Post a story" });
      render(<StepPlayer guide={seed()} />);
      for (let i = 0; i < 4; i++) await done();
      await userEvent.click(screen.getByRole("button", { name: "Teach me how to do this myself next time" }));
      await waitFor(() => expect(push).toHaveBeenCalledWith(expect.stringMatching(/^\/guide\//)));
      expect(bodyOf(fetchMock, 0)).toMatchObject({
        question: "Teach me how to do this myself next time: Post a story",
        mode: "teach",
      });
      expect(getSavedGuides().some((g) => g.title === "Learn: Post a story")).toBe(true);
    });
  });
});
