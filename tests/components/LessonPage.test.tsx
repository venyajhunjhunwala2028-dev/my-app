import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import {
  STORAGE_KEY,
  getCompletedLessons,
  getCompletedPractice,
  getSavedGuides,
  markLessonComplete,
  setDevices,
  setLevel,
  setUiLanguage,
} from "@/lib/store/localStore";
import { LESSON_STAGES, nextLessonAfter, nextStage, previousStage, stageState } from "@/lib/learn/lessonFlow";
import { ALL_LESSONS } from "@/lib/content/lessons";
import LessonPage from "@/app/app/learn/[id]/page";

const push = vi.fn();
vi.mock("next/navigation", () => ({ useRouter: () => ({ push, replace: vi.fn() }), useSearchParams: () => new URLSearchParams() }));

const stepsAnswer = (title: string) => ({
  kind: "steps",
  language: "en",
  title,
  device: "Android phone",
  app: "WhatsApp",
  safety: null,
  steps: [
    { instruction: "Open WhatsApp.", lookFor: "A green icon.", spoken: "Open WhatsApp.", encouragement: "Good." },
    { instruction: "Tap the chat.", lookFor: "The name.", spoken: "Tap the chat.", encouragement: "" },
  ],
  screenshotHowTo: ["Press power and volume down."],
});

function mockFetch(body: unknown) {
  const fetchMock = vi.fn(async () => new Response(JSON.stringify(body), { status: 200 }));
  vi.stubGlobal("fetch", fetchMock);
  return fetchMock;
}

async function open(id: string) {
  await act(async () => {
    render(<LessonPage params={Promise.resolve({ id })} />);
  });
}

const stages = () => screen.getAllByTestId("lesson-stage").map((li) => `${li.textContent}:${li.dataset.state}`);
const didIt = () => userEvent.click(screen.getByRole("button", { name: "I did it" }));

describe("lesson stage flow", () => {
  it("goes Explain → Show → Try → Done, and no further", () => {
    expect(LESSON_STAGES).toEqual(["explain", "show", "try", "done"]);
    expect(nextStage("explain")).toBe("show");
    expect(nextStage("show")).toBe("try");
    expect(nextStage("try")).toBe("done");
    expect(nextStage("done")).toBe("done");
    expect(previousStage("explain")).toBe("explain");
    expect(previousStage("try")).toBe("show");
  });

  it("marks earlier stages done, the current one current, and the rest to do", () => {
    expect(LESSON_STAGES.map((s) => stageState(s, "show"))).toEqual(["done", "current", "todo", "todo"]);
    expect(LESSON_STAGES.map((s) => stageState(s, "done"))).toEqual(["done", "done", "done", "done"]);
  });

  it("suggests the next lesson not finished yet, going round, and none when all are done", () => {
    expect(nextLessonAfter("whatsapp-photo", [])?.id).toBe("whatsapp-voice-message");
    expect(nextLessonAfter("whatsapp-photo", ["whatsapp-voice-message"])?.id).toBe("instagram-post");
    const last = ALL_LESSONS[ALL_LESSONS.length - 1].id;
    expect(nextLessonAfter(last, [])?.id).toBe(ALL_LESSONS[0].id);
    expect(nextLessonAfter("wifi", ALL_LESSONS.map((l) => l.id))).toBeNull();
  });
});

describe("lesson page", () => {
  beforeEach(() => {
    push.mockReset();
    localStorage.setItem(STORAGE_KEY, "{}");
    setDevices(["Android phone"]);
  });
  afterEach(() => vi.unstubAllGlobals());

  it("starts with EXPLAIN: what it is and why it's useful, and the four stages", async () => {
    await open("whatsapp-photo");
    expect(screen.getByRole("heading", { level: 1, name: "Send a photo on WhatsApp" })).toBeInTheDocument();
    const strip = screen.getByRole("navigation", { name: "Lesson stages" });
    expect(strip).toHaveTextContent("Stage 1 of 4: Explain");
    expect(stages()).toEqual(["1Explain:current", "2Show:todo", "3Try:todo", "4Done:todo"]);
    expect(within(strip).getAllByRole("listitem")[0]).toHaveAttribute("aria-current", "step");
    expect(screen.getByRole("heading", { name: "What is this?" })).toBeInTheDocument();
    expect(screen.getByTestId("lesson-explain")).toHaveTextContent(/^WhatsApp lets you send photos/);
    expect(screen.getByRole("link", { name: "All lessons" })).toHaveAttribute("href", "/app/learn");
  });

  it("runs all four stages: the helper's steps, the practice screen, then warm feedback and the next lesson", async () => {
    setLevel("very_simple");
    const fetchMock = mockFetch(stepsAnswer("Send a photo on WhatsApp"));
    await open("whatsapp-photo");

    // SHOW: asked in Show me how mode for this device, and played here in the step player.
    await userEvent.click(screen.getByRole("button", { name: "Show me how, step by step" }));
    expect(await screen.findByText("Step 1 of 2")).toBeInTheDocument();
    expect(JSON.parse(String((fetchMock.mock.calls[0] as unknown as [string, RequestInit])[1].body))).toMatchObject({
      question: "Teach me how to send a photo on WhatsApp",
      mode: "showMeHow",
      devices: ["Android phone"],
      level: "very_simple",
    });
    expect(push).not.toHaveBeenCalled();
    expect(getSavedGuides()[0]).toMatchObject({ lessonId: "whatsapp-photo" });
    expect(stages()).toEqual(["✓Explain:done", "2Show:current", "3Try:todo", "4Done:todo"]);
    await didIt();
    await didIt();
    // Not marked complete yet: the lesson still has Try and Done.
    expect(getCompletedLessons()).toEqual([]);

    // LET ME TRY: the lesson's practice exercise.
    expect(screen.getByRole("heading", { level: 1, name: "Now you try" })).toBeInTheDocument();
    expect(stages()).toEqual(["✓Explain:done", "✓Show:done", "3Try:current", "4Done:todo"]);
    expect(screen.getByText("Practice screen — not the real app")).toBeInTheDocument();
    for (const name of ["Chat with Priya", "Attach", "Gallery", "Photo of pink flowers", "Send"]) {
      await userEvent.click(screen.getByRole("button", { name }));
    }
    await userEvent.click(screen.getByRole("button", { name: "Continue" }));

    // FEEDBACK
    expect(screen.getByRole("heading", { level: 1, name: "You've got it!" })).toBeInTheDocument();
    expect(screen.getByText("Well done. You learned: Send a photo on WhatsApp")).toBeInTheDocument();
    expect(screen.getByText("Your Tech Confidence went up.")).toBeInTheDocument();
    expect(stages().every((s) => s.endsWith(":done"))).toBe(true);
    expect(getCompletedLessons()).toEqual(["whatsapp-photo"]);
    expect(getCompletedPractice()).toEqual(["send-photo"]);
    expect(screen.getByRole("link", { name: /^Next lesson:/ })).toHaveAttribute("href", "/app/learn/whatsapp-voice-message");
    expect(screen.getByRole("link", { name: /^Next lesson:/ })).toHaveTextContent("Send a voice message on WhatsApp");
  });

  it("without a practice screen, asks to try it on the phone, with I did it and I'm stuck", async () => {
    mockFetch(stepsAnswer("Take a screenshot"));
    await open("screenshot");
    await userEvent.click(screen.getByRole("button", { name: "Show me how, step by step" }));
    await screen.findByText("Step 1 of 2");
    await didIt();
    await didIt();
    expect(screen.getByText(/Now try it on your phone/)).toBeInTheDocument();

    const stuck = screen.getByRole("button", { name: "I'm stuck" });
    await userEvent.click(stuck);
    expect(stuck).toHaveAttribute("aria-expanded", "true");
    await userEvent.click(screen.getByRole("button", { name: "Ask my family to help with this" }));
    const dialog = screen.getByRole("dialog", { name: "Ask my family" });
    expect(within(dialog).getByTestId("family-message")).toHaveTextContent("I'm stuck while trying to take a screenshot.");
    await userEvent.click(within(dialog).getByRole("button", { name: "Close" }));

    // Show me the steps again goes back to SHOW at step 1, without asking the helper again.
    await userEvent.click(screen.getByRole("button", { name: "Show me the steps again" }));
    expect(screen.getByText("Step 1 of 2")).toBeInTheDocument();
    expect(vi.mocked(fetch)).toHaveBeenCalledTimes(1);
    await didIt();
    await didIt();
    await didIt();
    expect(screen.getByRole("heading", { level: 1, name: "You've got it!" })).toBeInTheDocument();
    expect(getCompletedLessons()).toEqual(["screenshot"]);
  });

  it("plays the saved steps again for free when the lesson is opened again", async () => {
    const fetchMock = mockFetch(stepsAnswer("Take a screenshot"));
    await open("screenshot");
    await userEvent.click(screen.getByRole("button", { name: "Show me how, step by step" }));
    await screen.findByText("Step 1 of 2");
    await didIt();
    document.body.innerHTML = "";
    await open("screenshot");
    await userEvent.click(screen.getByRole("button", { name: "Show me how, step by step" }));
    expect(screen.getByText("Step 1 of 2")).toBeInTheDocument();
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("I know this already goes straight to Try, asking nothing", async () => {
    const fetchMock = mockFetch({});
    await open("spot-scam");
    await userEvent.click(screen.getByRole("button", { name: "I know this already. Let me try" }));
    expect(screen.getByRole("heading", { level: 1, name: "Now you try" })).toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: "Message from BANK-ALERT" }));
    expect(screen.getByText(/A real bank never asks for your OTP/)).toBeInTheDocument();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("says when every lesson is finished", async () => {
    for (const lesson of ALL_LESSONS) if (lesson.id !== "wifi") markLessonComplete(lesson.id);
    await open("wifi");
    await userEvent.click(screen.getByRole("button", { name: "I know this already. Let me try" }));
    await didIt();
    expect(screen.getByText("You've finished every lesson!")).toBeInTheDocument();
    expect(screen.queryByRole("link", { name: /^Next lesson:/ })).not.toBeInTheDocument();
  });

  it("explains in Hindi and Hinglish too", async () => {
    setUiLanguage("hi");
    await open("wifi");
    expect(screen.getByRole("heading", { level: 1, name: "Wi‑Fi से जुड़ें" })).toBeInTheDocument();
    expect(screen.getByTestId("lesson-explain")).toHaveTextContent(/बिना तार का इंटरनेट/);
    expect(stages()[0]).toBe("1समझें:current");
    document.body.innerHTML = "";
    setUiLanguage("hinglish");
    await open("wifi");
    expect(screen.getByTestId("lesson-explain")).toHaveTextContent(/bina taar ka internet/);
  });

  it("says kindly when the lesson does not exist", async () => {
    await open("nope");
    expect(screen.getByRole("heading", { name: "I couldn't find that lesson" })).toBeInTheDocument();
    await waitFor(() => expect(screen.getByRole("link", { name: "All lessons" })).toHaveAttribute("href", "/app/learn"));
  });
});
