import { beforeEach, describe, expect, it, vi, afterEach } from "vitest";
import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ALL_LESSONS } from "@/lib/content/lessons";
import {
  STORAGE_KEY,
  getCurrentGuide,
  markLessonComplete,
  setDevices,
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
    expect(screen.getAllByRole("button", { name: /./ })).toHaveLength(ALL_LESSONS.length);
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
    await userEvent.click(screen.getByRole("button", { name: /Make a video call on WhatsApp/ }));

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
});
