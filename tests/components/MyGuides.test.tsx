import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import {
  STORAGE_KEY,
  getCurrentGuide,
  getGuideStep,
  getSavedGuides,
  saveGuide,
  setCurrentGuide,
  setGuideStep,
  setUiLanguage,
} from "@/lib/store/localStore";
import MyGuides from "@/components/MyGuides";

const push = vi.fn();
vi.mock("next/navigation", () => ({ useRouter: () => ({ push }) }));

function seedAt(id: string, question: string, when: Date) {
  vi.setSystemTime(when);
  saveGuide({ id, question, title: `Title ${id}`, answer: {} });
}

describe("My previous help", () => {
  beforeEach(() => {
    push.mockReset();
    localStorage.setItem(STORAGE_KEY, "{}");
    vi.useFakeTimers({ toFake: ["Date"] });
    vi.setSystemTime(new Date(2026, 9, 23, 12, 0));
  });
  afterEach(() => vi.useRealTimers());

  it("lists the questions newest first with a simple date, and reopens one at step 1", async () => {
    seedAt("photo", "How do I send a photo?", new Date(2026, 9, 1, 9, 0));
    seedAt("call", "How do I make a video call?", new Date(2026, 9, 22, 9, 0));
    seedAt("wifi", "How do I turn on wifi?", new Date(2026, 9, 23, 9, 0));
    vi.setSystemTime(new Date(2026, 9, 23, 12, 0));
    setGuideStep("photo", 3);

    render(<MyGuides />);
    expect(screen.getByRole("heading", { name: "My previous help" })).toBeInTheDocument();
    const items = within(screen.getByRole("list")).getAllByRole("listitem");
    expect(items.map((li) => within(li).getAllByRole("button")[0].textContent)).toEqual([
      expect.stringContaining("How do I turn on wifi?"),
      expect.stringContaining("How do I make a video call?"),
      expect.stringContaining("How do I send a photo?"),
    ]);
    expect(within(items[0]).getByText("Today")).toBeInTheDocument();
    expect(within(items[1]).getByText("Yesterday")).toBeInTheDocument();
    expect(within(items[2]).getByText("1 October 2026")).toBeInTheDocument();

    await userEvent.click(screen.getByRole("button", { name: /^How do I send a photo\?/ }));
    expect(getGuideStep("photo")).toBe(1);
    expect(getCurrentGuide()?.id).toBe("photo");
    expect(push).toHaveBeenCalledWith("/guide/photo");
  });

  it("shows a friendly hint when nothing is saved", () => {
    render(<MyGuides />);
    expect(screen.getByText("Help you ask for will appear here, so you can use it again.")).toBeInTheDocument();
    expect(screen.queryByRole("button")).not.toBeInTheDocument();
  });

  it("deletes one item after Yes, and clears it as the current guide", async () => {
    saveGuide({ id: "photo", question: "How do I send a photo?", title: "Send a photo", answer: {} });
    saveGuide({ id: "call", question: "How do I make a video call?", title: "Video call", answer: {} });
    setCurrentGuide("photo");
    render(<MyGuides />);

    await userEvent.click(screen.getByRole("button", { name: "Delete: How do I send a photo?" }));
    expect(screen.getByText("Are you sure? This can't be undone.")).toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: "No" }));
    expect(getSavedGuides()).toHaveLength(2);

    await userEvent.click(screen.getByRole("button", { name: "Delete: How do I send a photo?" }));
    await userEvent.click(screen.getByRole("button", { name: "Yes" }));
    expect(getSavedGuides().map((g) => g.id)).toEqual(["call"]);
    expect(getCurrentGuide()).toBeNull();
    expect(screen.queryByText(/How do I send a photo\?/)).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: /^How do I make a video call\?/ })).toBeInTheDocument();
  });

  it("deletes all history only after confirming", async () => {
    saveGuide({ id: "photo", question: "How do I send a photo?", title: "Send a photo", answer: {} });
    saveGuide({ id: "call", question: "How do I make a video call?", title: "Video call", answer: {} });
    setCurrentGuide("call");
    render(<MyGuides />);

    await userEvent.click(screen.getByRole("button", { name: "Delete all my history" }));
    await userEvent.click(screen.getByRole("button", { name: "No" }));
    expect(getSavedGuides()).toHaveLength(2);

    await userEvent.click(screen.getByRole("button", { name: "Delete all my history" }));
    expect(screen.getByText("Are you sure? This can't be undone.")).toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: "Yes" }));
    expect(getSavedGuides()).toEqual([]);
    expect(getCurrentGuide()).toBeNull();
    expect(screen.getByText("Help you ask for will appear here, so you can use it again.")).toBeInTheDocument();
  });

  it("shows 10 at first and the rest after Show more", async () => {
    for (let i = 1; i <= 12; i++) seedAt(`g${i}`, `Question ${i}`, new Date(2026, 9, 23, 9, i));
    render(<MyGuides />);
    expect(within(screen.getByRole("list")).getAllByRole("listitem")).toHaveLength(10);
    expect(screen.queryByText("Question 1")).not.toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: "Show more" }));
    expect(within(screen.getByRole("list")).getAllByRole("listitem")).toHaveLength(12);
    expect(screen.queryByRole("button", { name: "Show more" })).not.toBeInTheDocument();
  });

  it("is in Hindi when the interface language is Hindi", () => {
    setUiLanguage("hi");
    saveGuide({ id: "photo", question: "फोटो कैसे भेजूँ?", title: "फोटो", answer: {} });
    render(<MyGuides />);
    expect(screen.getByRole("heading", { name: "मेरी पिछली मदद" })).toBeInTheDocument();
    expect(screen.getByText("आज")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "मेरी पूरी हिस्ट्री मिटाएँ" })).toBeInTheDocument();
  });
});
