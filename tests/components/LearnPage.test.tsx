import { beforeEach, describe, expect, it, vi, afterEach } from "vitest";
import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ALL_LESSONS } from "@/lib/content/lessons";
import {
  STORAGE_KEY,
  getCurrentGuide,
  markLessonComplete,
  saveGuide,
  setDevices,
  setGuideStep,
  setLevel,
  setUiLanguage,
} from "@/lib/store/localStore";
import LearnPage from "@/app/app/learn/page";

const push = vi.fn();
vi.mock("next/navigation", () => ({ useRouter: () => ({ push }) }));

const stepsAnswer = {
  kind: "steps",
  language: "en",
  title: "Make a video call on WhatsApp",
  device: "Android phone",
  app: "WhatsApp",
  safety: null,
  steps: [{ instruction: "Open WhatsApp.", lookFor: "A green icon.", spoken: "Open WhatsApp.", encouragement: "" }],
  screenshotHowTo: ["Press power and volume down."],
};

function mockFetch(body: unknown) {
  const fetchMock = vi.fn(async () => new Response(JSON.stringify(body), { status: 200 }));
  vi.stubGlobal("fetch", fetchMock);
  return fetchMock;
}

describe("Teach me page", () => {
  beforeEach(() => {
    push.mockReset();
    localStorage.setItem(STORAGE_KEY, "{}");
  });
  afterEach(() => vi.unstubAllGlobals());

  it("shows the lessons in groups, a back-to-home link and progress at 0", () => {
    render(<LearnPage />);
    expect(screen.getByRole("heading", { level: 1, name: "Teach me" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Back to home" })).toHaveAttribute("href", "/app");
    for (const group of ["Using your phone", "Staying safe", "AI helpers", "Email", "Online payments"]) {
      expect(screen.getByRole("heading", { level: 2, name: group })).toBeInTheDocument();
    }
    // One button per lesson, plus "Next up".
    expect(screen.getAllByRole("button", { name: /./ })).toHaveLength(ALL_LESSONS.length + 1);
    expect(screen.getByText(`You've finished 0 of ${ALL_LESSONS.length} lessons`)).toBeInTheDocument();
    expect(screen.getByRole("progressbar")).toHaveAttribute("aria-valuenow", "0");
    expect(screen.queryByText("Done")).not.toBeInTheDocument();
  });

  it("marks completed lessons Done and counts them", () => {
    markLessonComplete("screenshot");
    markLessonComplete("wifi");
    markLessonComplete("send-email");
    render(<LearnPage />);
    expect(screen.getByText(`You've finished 3 of ${ALL_LESSONS.length} lessons`)).toBeInTheDocument();
    expect(screen.getByRole("progressbar")).toHaveAttribute("aria-valuenow", "3");
    const screenshot = screen.getByRole("button", { name: /Take a screenshot/ });
    expect(within(screenshot).getByText("Done")).toBeInTheDocument();
    expect(within(screen.getByRole("button", { name: /Spot a scam message/ })).queryByText("Done")).not.toBeInTheDocument();
  });

  it("asks for the lesson in Show me how mode with the saved device and level, then opens the guide", async () => {
    setDevices(["Android phone"]);
    setLevel("very_simple");
    const fetchMock = mockFetch(stepsAnswer);
    render(<LearnPage />);
    await userEvent.click(screen.getByRole("button", { name: "Make a video call on WhatsApp" }));

    await waitFor(() => expect(push).toHaveBeenCalledWith(expect.stringMatching(/^\/guide\//)));
    const body = JSON.parse(String((fetchMock.mock.calls[0] as unknown as [string, RequestInit])[1].body));
    expect(body).toMatchObject({
      question: "Teach me how to make a video call on WhatsApp",
      mode: "showMeHow",
      devices: ["Android phone"],
      level: "very_simple",
    });
    const guide = getCurrentGuide();
    expect(guide).toMatchObject({ lessonId: "whatsapp-video-call", title: "Make a video call on WhatsApp" });
    expect(push).toHaveBeenCalledWith(`/guide/${guide?.id}`);
  });

  it("shows the lessons in Hindi when the interface is Hindi", () => {
    setUiLanguage("hi");
    render(<LearnPage />);
    expect(screen.getByRole("heading", { level: 1, name: "मुझे सिखाइए" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { level: 2, name: "अपना फ़ोन चलाना" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "होम पर वापस जाएँ" })).toBeInTheDocument();
  });

  describe("Tech Confidence", () => {
    it("starts at Level 1 and offers the first lesson as Next up", async () => {
      const fetchMock = mockFetch(stepsAnswer);
      render(<LearnPage />);
      const card = screen.getByRole("region", { name: "Your Tech Confidence" });
      expect(card).toHaveTextContent("Level 1");
      expect(card).toHaveTextContent("Just starting");
      expect(within(card).queryByText("You've learned:")).not.toBeInTheDocument();
      const next = within(card).getByRole("button", { name: "Next up: Make a video call on WhatsApp" });
      await userEvent.click(next);
      await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(1));
      const body = JSON.parse(String((fetchMock.mock.calls[0] as unknown as [string, RequestInit])[1].body));
      expect(body).toMatchObject({ question: "Teach me how to make a video call on WhatsApp", mode: "showMeHow" });
    });

    it("lists what was learned and grows the level with finished lessons and guides", () => {
      markLessonComplete("whatsapp-video-call");
      markLessonComplete("screenshot");
      saveGuide({
        id: "done",
        question: "q",
        title: "t",
        answer: { kind: "steps", steps: [{ instruction: "a" }] },
      });
      setGuideStep("done", 2);
      render(<LearnPage />);
      const card = screen.getByRole("region", { name: "Your Tech Confidence" });
      expect(card).toHaveTextContent("Level 3");
      expect(card).toHaveTextContent("Getting comfortable");
      const learned = within(card).getByRole("list", { name: "You've learned:" });
      expect(within(learned).getAllByRole("listitem").map((li) => li.textContent)).toEqual([
        "✓ Make a video call on WhatsApp",
        "✓ Take a screenshot",
      ]);
      expect(within(card).getByRole("button", { name: /^Next up: / })).toHaveAccessibleName(
        "Next up: Send a photo on WhatsApp",
      );
    });

    it("says every lesson is finished when none is left", () => {
      for (const lesson of ALL_LESSONS) markLessonComplete(lesson.id);
      render(<LearnPage />);
      const card = screen.getByRole("region", { name: "Your Tech Confidence" });
      expect(card).toHaveTextContent("Level 5");
      expect(card).toHaveTextContent("Tech expert");
      expect(card).toHaveTextContent("You've finished every lesson!");
      expect(within(card).getAllByRole("listitem")).toHaveLength(5);
      expect(within(card).queryByRole("button")).not.toBeInTheDocument();
    });
  });
});
