import { beforeEach, describe, expect, it, vi, afterEach } from "vitest";
import { render, screen, waitFor, within } from "@testing-library/react";
import { ALL_LESSONS } from "@/lib/content/lessons";
import { STORAGE_KEY, markLessonComplete, markPracticeComplete, saveGuide, setGuideStep, setUiLanguage } from "@/lib/store/localStore";
import LearnPage from "@/app/app/learn/page";

const push = vi.fn();
const replace = vi.fn();
const nav = vi.hoisted(() => ({ search: new URLSearchParams() }));
vi.mock("next/navigation", () => ({ useRouter: () => ({ push, replace }), useSearchParams: () => nav.search }));

describe("Teach me how this works page", () => {
  beforeEach(() => {
    push.mockReset();
    replace.mockReset();
    localStorage.setItem(STORAGE_KEY, "{}");
  });
  afterEach(() => vi.unstubAllGlobals());

  it("shows the lessons by topic, each linking to its own page, with progress at 0", () => {
    render(<LearnPage />);
    expect(screen.getByRole("heading", { level: 1, name: "Teach me how this works" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Back to home" })).toHaveAttribute("href", "/app");
    for (const group of [
      "WhatsApp",
      "Instagram",
      "Email",
      "Video calls",
      "Phone basics",
      "Online safety",
      "Google Search",
      "Maps",
      "Online shopping",
      "AI helpers",
    ]) {
      expect(screen.getByRole("heading", { level: 2, name: group })).toBeInTheDocument();
    }
    for (const lesson of ALL_LESSONS) {
      expect(screen.getByRole("link", { name: new RegExp(`^${lesson.title.en}`) })).toHaveAttribute("href", `/app/learn/${lesson.id}`);
    }
    expect(screen.getByText(`You've finished 0 of ${ALL_LESSONS.length} lessons`)).toBeInTheDocument();
    expect(screen.getByRole("progressbar", { name: /lessons/ })).toHaveAttribute("aria-valuenow", "0");
    expect(screen.queryByText("Done")).not.toBeInTheDocument();
  });

  it("keeps Help me do this apart, and links to Practice", () => {
    render(<LearnPage />);
    expect(screen.getByRole("link", { name: "Help me do this" })).toHaveAttribute("href", "/app#question");
    expect(screen.getByRole("link", { name: "Practice on a pretend phone" })).toHaveAttribute("href", "/app/practice");
    // Lessons with a practice screen say so.
    expect(screen.getByRole("link", { name: /^Send a photo on WhatsApp/ })).toHaveTextContent("With practice");
    expect(screen.getByRole("link", { name: /^Take a screenshot/ })).not.toHaveTextContent("With practice");
  });

  it("marks completed lessons Done and counts them", () => {
    markLessonComplete("screenshot");
    markLessonComplete("wifi");
    markLessonComplete("send-email");
    render(<LearnPage />);
    expect(screen.getByText(`You've finished 3 of ${ALL_LESSONS.length} lessons`)).toBeInTheDocument();
    expect(screen.getByRole("progressbar", { name: /lessons/ })).toHaveAttribute("aria-valuenow", "3");
    expect(within(screen.getByRole("link", { name: /Take a screenshot/ })).getByText("Done")).toBeInTheDocument();
    expect(within(screen.getByRole("link", { name: /Spot a scam message/ })).queryByText("Done")).not.toBeInTheDocument();
  });

  it("shows the lessons in Hindi when the interface is Hindi", () => {
    setUiLanguage("hi");
    render(<LearnPage />);
    expect(screen.getByRole("heading", { level: 1, name: "मुझे सिखाइए कि यह कैसे काम करता है" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { level: 2, name: "फ़ोन की बुनियादी बातें" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "होम पर वापस जाएँ" })).toBeInTheDocument();
  });

  it("?lesson= (older links) opens that lesson's own page in place of this address", async () => {
    nav.search = new URLSearchParams("lesson=spot-scam");
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
    render(<LearnPage />);
    await waitFor(() => expect(replace).toHaveBeenCalledWith("/app/learn/spot-scam"));
    expect(replace).toHaveBeenCalledTimes(1);
    expect(fetchMock).not.toHaveBeenCalled();
    nav.search = new URLSearchParams();
  });

  it("?lesson= with an unknown lesson just clears the address", async () => {
    window.history.replaceState(null, "", "/app/learn?lesson=nope");
    nav.search = new URLSearchParams("lesson=nope");
    render(<LearnPage />);
    await waitFor(() => expect(window.location.search).toBe(""));
    expect(replace).not.toHaveBeenCalled();
    nav.search = new URLSearchParams();
  });

  describe("Tech Confidence", () => {
    it("starts at 0% with a kind word, and Next opens the first topic's lesson", () => {
      render(<LearnPage />);
      const card = screen.getByRole("region", { name: "Your Tech Confidence" });
      expect(within(card).getByRole("progressbar", { name: "Your Tech Confidence" })).toHaveAttribute("aria-valuenow", "0");
      expect(card).toHaveTextContent("0%");
      expect(card).toHaveTextContent("Everyone starts somewhere.");
      expect(card).toHaveTextContent("Level 1");
      expect(card).toHaveTextContent("Just starting");
      expect(within(card).queryByText("You've learned:")).not.toBeInTheDocument();
      expect(within(card).getByRole("link", { name: "Next: Learn how to use WhatsApp" })).toHaveAttribute(
        "href",
        "/app/learn/whatsapp-video-call",
      );
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
      // WhatsApp, Video calls, Sending photos and Screenshots: 4 of 17 topics.
      expect(within(card).getByRole("progressbar", { name: "Your Tech Confidence" })).toHaveAttribute("aria-valuenow", "24");
      expect(card).toHaveTextContent("24%");
      expect(card).toHaveTextContent("4 of 17 topics learned");
      expect(card).toHaveTextContent("Level 3");
      const learned = within(card).getByRole("list", { name: "You've learned:" });
      expect(within(learned).getAllByRole("listitem").map((li) => li.textContent)).toEqual([
        "✓ WhatsApp",
        "✓ Video calls",
        "✓ Sending photos",
        "✓ Screenshots",
      ]);
      expect(within(card).getByRole("link", { name: /^Next: / })).toHaveAccessibleName("Next: Learn how to identify scams");
    });

    it("counts finished Practice exercises", () => {
      markPracticeComplete("spot-scam");
      render(<LearnPage />);
      const card = screen.getByRole("region", { name: "Your Tech Confidence" });
      expect(within(within(card).getByRole("list", { name: "You've learned:" })).getByText(/Spotting scams/)).toBeInTheDocument();
      expect(card).toHaveTextContent("Level 2");
    });

    it("celebrates when every topic is learned", () => {
      for (const lesson of ALL_LESSONS) markLessonComplete(lesson.id);
      for (const [i, question] of ["How do I copy and paste text?", "How do I watch YouTube on my TV?"].entries()) {
        saveGuide({ id: `g${i}`, question, title: "t", answer: { kind: "steps", steps: [{ instruction: "a" }] } });
        setGuideStep(`g${i}`, 2);
      }
      render(<LearnPage />);
      const card = screen.getByRole("region", { name: "Your Tech Confidence" });
      expect(card).toHaveTextContent("100%");
      expect(card).toHaveTextContent("Level 5");
      expect(card).toHaveTextContent("You've learned every topic. Wonderful!");
      expect(within(within(card).getByRole("list")).getAllByRole("listitem")).toHaveLength(17);
      expect(within(card).queryByRole("link")).not.toBeInTheDocument();
    });
  });
});
