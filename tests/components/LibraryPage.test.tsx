import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { LIBRARY } from "@/lib/content/library";
import { STORAGE_KEY, getCurrentGuide, setUiLanguage } from "@/lib/store/localStore";
import LibraryPage from "@/app/app/library/page";

const push = vi.fn();
vi.mock("next/navigation", () => ({ useRouter: () => ({ push }) }));

const stepsAnswer = {
  kind: "steps",
  language: "en",
  title: "Make a video call",
  device: null,
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

const bodyOf = (fetchMock: ReturnType<typeof vi.fn>, call = 0) =>
  JSON.parse(String((fetchMock.mock.calls[call] as unknown as [string, RequestInit])[1].body));

describe("Help library page", () => {
  beforeEach(() => {
    push.mockReset();
    localStorage.setItem(STORAGE_KEY, "{}");
  });
  afterEach(() => vi.unstubAllGlobals());

  it("shows every category as a big button and a back-to-home link", () => {
    render(<LibraryPage />);
    expect(screen.getByRole("heading", { level: 1, name: "Help library" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Back to home" })).toHaveAttribute("href", "/app");
    for (const category of LIBRARY) {
      expect(screen.getByRole("button", { name: category.title.en })).toBeInTheDocument();
    }
  });

  it("opens a category to show its questions, and goes back to all topics", async () => {
    render(<LibraryPage />);
    await userEvent.click(screen.getByRole("button", { name: "WhatsApp" }));
    expect(screen.getByRole("heading", { level: 2, name: "WhatsApp" })).toBeInTheDocument();
    const whatsapp = LIBRARY.find((c) => c.id === "whatsapp")!;
    for (const q of whatsapp.questions) expect(screen.getByRole("button", { name: q.en })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Smart TV" })).not.toBeInTheDocument();

    await userEvent.click(screen.getByRole("button", { name: "All topics" }));
    expect(screen.getByRole("button", { name: "Smart TV" })).toBeInTheDocument();
  });

  it("asks a tapped question through the normal ask flow and opens the guide", async () => {
    const fetchMock = mockFetch(stepsAnswer);
    render(<LibraryPage />);
    await userEvent.click(screen.getByRole("button", { name: "WhatsApp" }));
    await userEvent.click(screen.getByRole("button", { name: "How do I make a video call?" }));

    await waitFor(() => expect(push).toHaveBeenCalledWith(expect.stringMatching(/^\/guide\//)));
    const body = bodyOf(fetchMock);
    expect(body.question).toBe("How do I make a video call?");
    expect(body.mode).toBeUndefined();
    expect(getCurrentGuide()).toMatchObject({ question: "How do I make a video call?", title: "Make a video call" });
    expect(getCurrentGuide()?.lessonId).toBeUndefined();
  });

  it("shows a clarifying question with big answers, like the home page", async () => {
    mockFetch({ kind: "clarify", language: "en", prompt: "Which phone do you have?", options: ["iPhone", "Android phone"], about: "device" });
    render(<LibraryPage />);
    await userEvent.click(screen.getByRole("button", { name: "Phone" }));
    await userEvent.click(screen.getByRole("button", { name: LIBRARY[0].questions[0].en }));
    expect(await screen.findByText("Which phone do you have?")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Android phone" })).toBeInTheDocument();
  });

  it("shows categories and questions in Hindi when the interface is Hindi", async () => {
    setUiLanguage("hi");
    render(<LibraryPage />);
    const whatsapp = LIBRARY.find((c) => c.id === "whatsapp")!;
    await userEvent.click(screen.getByRole("button", { name: whatsapp.title.hi }));
    expect(screen.getByRole("button", { name: whatsapp.questions[0].hi })).toBeInTheDocument();
  });
});
