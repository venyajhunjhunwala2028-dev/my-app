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
const nav = vi.hoisted(() => ({ search: new URLSearchParams() }));
vi.mock("next/navigation", () => ({ useRouter: () => ({ push }), useSearchParams: () => nav.search }));

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
    // One button per lesson, plus "Next:".
    expect(screen.getAllByRole("button", { name: /./ })).toHaveLength(ALL_LESSONS.length + 1);
    expect(screen.getByText(`You've finished 0 of ${ALL_LESSONS.length} lessons`)).toBeInTheDocument();
    expect(screen.getByRole("progressbar", { name: /lessons/ })).toHaveAttribute("aria-valuenow", "0");
    expect(screen.queryByText("Done")).not.toBeInTheDocument();
  });

  it("marks completed lessons Done and counts them", () => {
    markLessonComplete("screenshot");
    markLessonComplete("wifi");
    markLessonComplete("send-email");
    render(<LearnPage />);
    expect(screen.getByText(`You've finished 3 of ${ALL_LESSONS.length} lessons`)).toBeInTheDocument();
    expect(screen.getByRole("progressbar", { name: /lessons/ })).toHaveAttribute("aria-valuenow", "3");
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

  it("?lesson= starts that lesson once and clears the address", async () => {
    window.history.replaceState(null, "", "/app/learn?lesson=spot-scam");
    nav.search = new URLSearchParams("lesson=spot-scam");
    const fetchMock = mockFetch(stepsAnswer);
    render(<LearnPage />);
    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(1));
    const body = JSON.parse(String((fetchMock.mock.calls[0] as unknown as [string, RequestInit])[1].body));
    expect(body).toMatchObject({ question: "Teach me how to spot a scam message", mode: "showMeHow" });
    expect(window.location.search).toBe("");
    nav.search = new URLSearchParams();
  });

  describe("Tech Confidence", () => {
    it("starts at 0% with a kind word, and offers the first topic as Next", async () => {
      const fetchMock = mockFetch(stepsAnswer);
      render(<LearnPage />);
      const card = screen.getByRole("region", { name: "Your Tech Confidence" });
      expect(within(card).getByRole("progressbar", { name: "Your Tech Confidence" })).toHaveAttribute("aria-valuenow", "0");
      expect(card).toHaveTextContent("0%");
      expect(card).toHaveTextContent("Everyone starts somewhere.");
      expect(card).toHaveTextContent("Level 1");
      expect(card).toHaveTextContent("Just starting");
      expect(within(card).queryByText("You've learned:")).not.toBeInTheDocument();
      const next = within(card).getByRole("button", { name: "Next: Learn how to use WhatsApp" });
      await userEvent.click(next);
      await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(1));
      const body = JSON.parse(String((fetchMock.mock.calls[0] as unknown as [string, RequestInit])[1].body));
      expect(body).toMatchObject({ question: "Teach me how to make a video call on WhatsApp", mode: "showMeHow" });
    });

    it("lists the topics learned, leads with the percentage and offers the next topic", () => {
      markLessonComplete("whatsapp-video-call");
      markLessonComplete("screenshot");
      saveGuide({
        id: "done",
        question: "How do I send a photo on WhatsApp?",
        title: "Send a photo",
        answer: { kind: "steps", steps: [{ instruction: "a" }] },
      });
      setGuideStep("done", 2);
      render(<LearnPage />);
      const card = screen.getByRole("region", { name: "Your Tech Confidence" });
      // WhatsApp, Video calls, Sending photos and Screenshots: 4 of 15 topics.
      expect(within(card).getByRole("progressbar", { name: "Your Tech Confidence" })).toHaveAttribute("aria-valuenow", "27");
      expect(card).toHaveTextContent("27%");
      expect(card).toHaveTextContent("4 of 15 topics learned");
      expect(card).toHaveTextContent("Level 3");
      const learned = within(card).getByRole("list", { name: "You've learned:" });
      expect(within(learned).getAllByRole("listitem").map((li) => li.textContent)).toEqual([
        "✓ WhatsApp",
        "✓ Video calls",
        "✓ Sending photos",
        "✓ Screenshots",
      ]);
      expect(within(card).getByRole("button", { name: /^Next: / })).toHaveAccessibleName(
        "Next: Learn how to identify scams",
      );
    });

    it("celebrates when every topic is learned", () => {
      for (const lesson of ALL_LESSONS) markLessonComplete(lesson.id);
      for (const [i, question] of [
        "How do I post a photo on Instagram?",
        "How do I copy and paste text?",
        "How do I watch YouTube on my TV?",
        "How do I track my order?",
      ].entries()) {
        saveGuide({ id: `g${i}`, question, title: "t", answer: { kind: "steps", steps: [{ instruction: "a" }] } });
        setGuideStep(`g${i}`, 2);
      }
      render(<LearnPage />);
      const card = screen.getByRole("region", { name: "Your Tech Confidence" });
      expect(card).toHaveTextContent("100%");
      expect(card).toHaveTextContent("Level 5");
      expect(card).toHaveTextContent("You've learned every topic. Wonderful!");
      expect(within(within(card).getByRole("list")).getAllByRole("listitem")).toHaveLength(15);
      expect(within(card).queryByRole("button")).not.toBeInTheDocument();
    });
  });
});
