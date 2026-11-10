import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import SavedGuides from "@/components/SavedGuides";
import MyGuides from "@/components/MyGuides";
import ExplanationView, { type ExplanationAnswer } from "@/components/ExplanationView";
import StepPlayer, { type StepsAnswer } from "@/components/StepPlayer";
import SavedPage from "@/app/app/saved/page";
import {
  STORAGE_KEY,
  getBookmarkedGuides,
  getGuideStep,
  getSavedGuides,
  isGuideBookmarked,
  saveGuide,
  setGuideBookmarked,
  setGuideStep,
} from "@/lib/store/localStore";

const push = vi.fn();
vi.mock("next/navigation", () => ({ useRouter: () => ({ push }) }));

const steps: StepsAnswer = {
  kind: "steps",
  language: "en",
  title: "Post a story",
  device: null,
  app: null,
  safety: null,
  steps: [1, 2].map((n) => ({ instruction: `Do thing ${n}`, lookFor: "x", spoken: `Say ${n}`, encouragement: "" })),
  screenshotHowTo: [],
};

describe("Save this guide and My saved guides", () => {
  beforeEach(() => {
    push.mockReset();
    localStorage.setItem(STORAGE_KEY, "{}");
  });

  it("Save this guide on the step screen is a toggle that keeps it in My saved guides", async () => {
    const guide = saveGuide({ id: "story", question: "How do I post a story?", title: "Post a story", answer: steps });
    render(<StepPlayer guide={guide} />);
    const save = screen.getByRole("button", { name: "Save this guide" });
    expect(save).toHaveAttribute("aria-pressed", "false");
    await userEvent.click(save);
    expect(save).toHaveAttribute("aria-pressed", "true");
    expect(screen.getByText("Saved. You'll find it in My saved guides.")).toBeInTheDocument();
    expect(isGuideBookmarked("story")).toBe(true);
    await userEvent.click(save);
    expect(isGuideBookmarked("story")).toBe(false);
  });

  it("is offered on the success screen and under an explanation", async () => {
    const guide = saveGuide({ id: "story", question: "How do I post a story?", title: "Post a story", answer: steps });
    const { unmount } = render(<StepPlayer guide={{ ...guide, step: 3 }} />);
    expect(screen.getByRole("heading", { name: "You did it!" })).toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: "Save this guide" }));
    expect(isGuideBookmarked("story")).toBe(true);
    unmount();

    const explanation = saveGuide<ExplanationAnswer>({
      id: "gpt",
      question: "What is ChatGPT?",
      title: "What is ChatGPT?",
      answer: { kind: "explanation", language: "en", title: "What is ChatGPT?", text: "A program.", offerShowMeHow: false, alternative: null },
    });
    render(<ExplanationView guide={explanation} onSteps={() => {}} />);
    await userEvent.click(screen.getByRole("button", { name: "Save this guide" }));
    expect(isGuideBookmarked("gpt")).toBe(true);
  });

  it("lists saved guides on their page, reopens one at step 1, and removes one from saved only", async () => {
    saveGuide({ id: "a", question: "How do I send a photo?", title: "Send a photo", answer: steps });
    saveGuide({ id: "b", question: "How do I make a call?", title: "Make a call", answer: steps });
    saveGuide({ id: "c", question: "Not saved", title: "Not saved", answer: steps });
    setGuideBookmarked("a", true);
    setGuideBookmarked("b", true);
    setGuideStep("a", 2);
    render(<SavedPage />);
    expect(screen.getByRole("heading", { level: 1, name: "My saved guides" })).toBeInTheDocument();
    expect(screen.queryByText("Not saved")).not.toBeInTheDocument();

    await userEvent.click(screen.getByRole("button", { name: /^Send a photo/ }));
    expect(getGuideStep("a")).toBe(1);
    expect(push).toHaveBeenCalledWith("/guide/a");

    await userEvent.click(screen.getByRole("button", { name: "Remove from saved: How do I make a call?" }));
    expect(getBookmarkedGuides().map((g) => g.id)).toEqual(["a"]);
    expect(getSavedGuides().map((g) => g.id)).toContain("b");
    expect(screen.queryByRole("button", { name: /^Make a call/ })).not.toBeInTheDocument();
  });

  it("says how to save one when none are saved, and the home preview shows nothing", () => {
    const { unmount } = render(<SavedGuides />);
    expect(screen.getByText("Tap “Save this guide” on any help, and it stays here for next time.")).toBeInTheDocument();
    unmount();
    const { container } = render(<SavedGuides limit={3} />);
    expect(container).toBeEmptyDOMElement();
  });

  it("the home preview shows the newest few, with a link to all of them", () => {
    for (let i = 1; i <= 5; i++) {
      saveGuide({ id: `g${i}`, question: `Question ${i}`, title: `Title ${i}`, answer: steps });
      setGuideBookmarked(`g${i}`, true);
    }
    render(<SavedGuides limit={3} />);
    const section = screen.getByRole("region", { name: "My saved guides" });
    expect(within(section).getAllByRole("listitem")).toHaveLength(3);
    expect(within(section).getByRole("link", { name: "See all my saved guides" })).toHaveAttribute("href", "/app/saved");
  });

  it("Recent help shows 5 on home, marks saved guides, and shows the rest after Show more", async () => {
    for (let i = 1; i <= 7; i++) saveGuide({ id: `g${i}`, question: `Question ${i}`, title: "t", answer: steps });
    setGuideBookmarked("g7", true);
    render(<MyGuides initial={5} />);
    const list = screen.getByRole("list");
    expect(within(list).getAllByRole("listitem")).toHaveLength(5);
    expect(within(list).getAllByText("Saved")).toHaveLength(1);
    await userEvent.click(screen.getByRole("button", { name: "Show more" }));
    expect(within(screen.getByRole("list")).getAllByRole("listitem")).toHaveLength(7);
  });
});
