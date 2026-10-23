import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import {
  STORAGE_KEY,
  getCurrentGuide,
  getGuide,
  getSavedGuides,
  requestAllowance,
  saveGuide,
  setCurrentGuide,
  type SavedGuide,
} from "@/lib/store/localStore";
import StepPlayer, { type StepsAnswer } from "@/components/StepPlayer";
import GuidePage from "@/app/guide/[id]/page";

vi.mock("next/navigation", () => ({ useRouter: () => ({ push: vi.fn() }) }));

const step = (n: number) => ({ instruction: `Do thing ${n}`, lookFor: `Button ${n}`, spoken: `Say thing ${n}` });

const answer: StepsAnswer = {
  kind: "steps",
  language: "hi",
  title: "Post a story",
  device: "iPhone",
  steps: [1, 2, 3, 4].map(step),
  screenshotHowTo: ["Press the side button and volume up"],
};

function seed(): SavedGuide<StepsAnswer> {
  const saved = saveGuide({ id: "story", question: "How do I post a story?", title: "Post a story", answer });
  setCurrentGuide("story");
  return saved;
}

const stored = () => getGuide("story") as SavedGuide<StepsAnswer>;
const done = () => userEvent.click(screen.getByRole("button", { name: "Done, next step" }));

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
    expect(screen.getByRole("link", { name: "Home" })).toHaveAttribute("href", "/app");
    expect(getSavedGuides().map((g) => g.id)).toContain("story");
    expect(getCurrentGuide()).toBeNull();
  });

  it("after tapping Read aloud once, the next step is read automatically in the answer's language", async () => {
    const speak = vi.fn();
    vi.stubGlobal("speechSynthesis", { speak, cancel: vi.fn() });
    vi.stubGlobal(
      "SpeechSynthesisUtterance",
      class {
        lang = "";
        constructor(public text: string) {}
      },
    );
    render(<StepPlayer guide={seed()} />);
    await userEvent.click(screen.getByRole("button", { name: "Read aloud" }));
    expect(speak).toHaveBeenLastCalledWith(expect.objectContaining({ text: "Say thing 1", lang: "hi" }));

    await done();
    expect(speak).toHaveBeenCalledTimes(2);
    expect(speak).toHaveBeenLastCalledWith(expect.objectContaining({ text: "Say thing 2", lang: "hi" }));
    expect(screen.getByRole("button", { name: "Stop reading aloud" })).toBeInTheDocument();
  });

  it("hides Read aloud when the phone cannot speak", () => {
    render(<StepPlayer guide={seed()} />);
    expect(screen.queryByRole("button", { name: "Read aloud" })).not.toBeInTheDocument();
  });

  it("I don't understand asks about the current step with no typing and keeps the same step", async () => {
    const fetchMock = mockFetch({ kind: "explanation", language: "hi", title: "Help", text: "It is the blue button.", offerShowMeHow: false });
    render(<StepPlayer guide={seed()} />);
    await done();
    await userEvent.click(screen.getByRole("button", { name: "I don't understand" }));

    expect(await screen.findByText("It is the blue button.")).toBeInTheDocument();
    expect(screen.getByText("Step 2 of 4")).toBeInTheDocument();
    expect(screen.getByText("Do thing 2")).toBeInTheDocument();
    const body = JSON.parse(String(((fetchMock.mock.calls[0] as unknown[])[1] as RequestInit).body));
    expect(body).toMatchObject({
      question: "Do thing 2",
      mode: "followup",
      guideContext: { title: "Post a story", steps: ["Do thing 1", "Do thing 2", "Do thing 3", "Do thing 4"], stepIndex: 1 },
    });

    await userEvent.click(screen.getByRole("button", { name: "Back to the step" }));
    expect(screen.queryByText("It is the blue button.")).not.toBeInTheDocument();
    expect(screen.getByText("Step 2 of 4")).toBeInTheDocument();
  });

  it("at 30 uses today, I don't understand shows the ready-tomorrow message and sends nothing", async () => {
    const fetchMock = mockFetch({});
    for (let i = 0; i < 30; i++) requestAllowance();
    render(<StepPlayer guide={seed()} />);
    await userEvent.click(screen.getByRole("button", { name: "I don't understand" }));
    await waitFor(() => expect(screen.getByText(/ready again tomorrow/i)).toBeInTheDocument());
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("drops a late follow-up answer after moving to the next step, and I don't understand works again", async () => {
    let resolveFirst: (r: Response) => void = () => {};
    const json = (text: string) =>
      new Response(JSON.stringify({ kind: "explanation", language: "hi", title: "Help", text, offerShowMeHow: false }), { status: 200 });
    const fetchMock = vi
      .fn()
      .mockImplementationOnce(() => new Promise<Response>((r) => (resolveFirst = r)))
      .mockImplementation(async () => json("Second answer"));
    vi.stubGlobal("fetch", fetchMock);
    render(<StepPlayer guide={seed()} />);
    await userEvent.click(screen.getByRole("button", { name: "I don't understand" }));
    await done();
    expect(screen.getByText("Step 2 of 4")).toBeInTheDocument();

    await act(async () => {
      resolveFirst(json("Late answer for step 1"));
    });
    expect(screen.queryByText("Late answer for step 1")).not.toBeInTheDocument();
    expect(screen.queryByRole("region", { name: "Help with this step" })).not.toBeInTheDocument();

    await userEvent.click(screen.getByRole("button", { name: "I don't understand" }));
    expect(await screen.findByText("Second answer")).toBeInTheDocument();
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it("drops a late follow-up answer after Back to the step", async () => {
    let resolveFirst: (r: Response) => void = () => {};
    vi.stubGlobal("fetch", vi.fn(() => new Promise<Response>((r) => (resolveFirst = r))));
    render(<StepPlayer guide={seed()} />);
    await userEvent.click(screen.getByRole("button", { name: "I don't understand" }));
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
    await userEvent.click(screen.getByRole("button", { name: "I don't understand" }));
    await screen.findByText("It is the blue button.");
    await userEvent.click(screen.getByRole("button", { name: "Speak" }));
    expect(stops).toHaveLength(1);
    await done();
    expect(stops[0]).toHaveBeenCalled();

    await userEvent.click(screen.getByRole("button", { name: "I don't understand" }));
    await screen.findByText("It is the blue button.");
    await userEvent.click(screen.getByRole("button", { name: "Speak" }));
    unmount();
    expect(stops[1]).toHaveBeenCalled();
  });
});
