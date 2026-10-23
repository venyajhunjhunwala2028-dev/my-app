import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import {
  STORAGE_KEY,
  getCurrentGuide,
  getUsage,
  requestAllowance,
  setFamilyContact,
  setSpeakingLanguage,
} from "@/lib/store/localStore";
import AskBox from "@/components/AskBox";

const push = vi.fn();
vi.mock("next/navigation", () => ({ useRouter: () => ({ push }) }));

type Listener = ((e: unknown) => void) | null;
class FakeRecognition {
  static instances: FakeRecognition[] = [];
  lang = "";
  continuous = false;
  interimResults = false;
  maxAlternatives = 1;
  onresult: Listener = null;
  onerror: Listener = null;
  onend: (() => void) | null = null;
  start = vi.fn();
  stop = vi.fn(() => this.onend?.());
  abort = vi.fn();
  constructor() {
    FakeRecognition.instances.push(this);
  }
}

const stepsAnswer = {
  kind: "steps",
  language: "en",
  title: "Send a photo",
  device: "iPhone",
  steps: [{ instruction: "Open WhatsApp", lookFor: "Green icon", spoken: "Open WhatsApp" }],
  screenshotHowTo: ["Press the side button and volume up together"],
};

function mockFetch(body: unknown, status = 200) {
  const fetchMock = vi.fn(async () => new Response(JSON.stringify(body), { status }));
  vi.stubGlobal("fetch", fetchMock);
  return fetchMock;
}

const lastRecognition = () => FakeRecognition.instances[FakeRecognition.instances.length - 1];

describe("AskBox", () => {
  beforeEach(() => {
    push.mockReset();
    FakeRecognition.instances = [];
    localStorage.setItem(STORAGE_KEY, "{}");
  });
  afterEach(() => {
    vi.unstubAllGlobals();
    delete (window as unknown as Record<string, unknown>).SpeechRecognition;
  });

  it("sends a typed question and goes to the new guide", async () => {
    const fetchMock = mockFetch(stepsAnswer);
    render(<AskBox />);
    await userEvent.type(screen.getByLabelText("What do you need help with?"), "How do I send a photo?");
    await userEvent.click(screen.getByRole("button", { name: "Ask" }));

    await waitFor(() => expect(push).toHaveBeenCalled());
    const guide = getCurrentGuide();
    expect(guide?.question).toBe("How do I send a photo?");
    expect(guide?.title).toBe("Send a photo");
    expect(guide?.step).toBe(1);
    expect(push).toHaveBeenCalledWith(`/guide/${guide?.id}`);
    const body = JSON.parse(String(((fetchMock.mock.calls[0] as unknown[])[1] as RequestInit).body));
    expect(body).toMatchObject({ question: "How do I send a photo?" });
  });

  it("starts recognition in the saved speaking language, not the device language", async () => {
    vi.stubGlobal("SpeechRecognition", FakeRecognition);
    setSpeakingLanguage("hi-IN");
    render(<AskBox />);
    await userEvent.click(screen.getByRole("button", { name: "Speak" }));
    expect(lastRecognition().lang).toBe("hi-IN");
    expect(lastRecognition().start).toHaveBeenCalled();
    expect(screen.getByRole("button", { name: "Listening… tap to stop" })).toBeInTheDocument();
  });

  it("hides the mic when speech is not supported and typing still works", async () => {
    mockFetch(stepsAnswer);
    render(<AskBox />);
    expect(screen.queryByRole("button", { name: "Speak" })).not.toBeInTheDocument();
    await userEvent.type(screen.getByLabelText("What do you need help with?"), "How do I send a photo?");
    await userEvent.click(screen.getByRole("button", { name: "Ask" }));
    await waitFor(() => expect(push).toHaveBeenCalled());
  });

  it("explains when the microphone is not allowed and typing still works", async () => {
    vi.stubGlobal("SpeechRecognition", FakeRecognition);
    mockFetch(stepsAnswer);
    render(<AskBox />);
    await userEvent.click(screen.getByRole("button", { name: "Speak" }));
    act(() => {
      lastRecognition().onerror?.({ error: "not-allowed" });
      lastRecognition().onend?.();
    });
    expect(screen.getByText(/microphone is not allowed/i)).toBeInTheDocument();
    await userEvent.type(screen.getByLabelText("What do you need help with?"), "How do I send a photo?");
    await userEvent.click(screen.getByRole("button", { name: "Ask" }));
    await waitFor(() => expect(push).toHaveBeenCalled());
  });

  it("puts a recognized question in the box and waits for the learner to tap Ask", async () => {
    vi.stubGlobal("SpeechRecognition", FakeRecognition);
    const fetchMock = mockFetch(stepsAnswer);
    render(<AskBox />);
    await userEvent.click(screen.getByRole("button", { name: "Speak" }));
    act(() => {
      lastRecognition().onresult?.({ results: [[{ transcript: "how do I send a photo" }]] });
      lastRecognition().onend?.();
    });
    expect(screen.getByLabelText("What do you need help with?")).toHaveValue("how do I send a photo");
    expect(fetchMock).not.toHaveBeenCalled();
    await userEvent.click(screen.getByRole("button", { name: "Ask" }));
    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(1));
  });

  it("covers AE8: at 30 uses today it says ready tomorrow, offers Call family and sends nothing", async () => {
    const fetchMock = mockFetch(stepsAnswer);
    setFamilyContact({ name: "Priya", phone: "+44 7700 900123" });
    for (let i = 0; i < 30; i++) requestAllowance();
    render(<AskBox />);
    await userEvent.type(screen.getByLabelText("What do you need help with?"), "How do I send a photo?");
    await userEvent.click(screen.getByRole("button", { name: "Ask" }));

    expect(await screen.findByText(/ready again tomorrow/)).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Call" })).toHaveAttribute("href", "tel:+44 7700 900123");
    expect(fetchMock).not.toHaveBeenCalled();
    expect(getUsage().count).toBe(30);
  });

  it("shows a scam warning and Call family instead of steps", async () => {
    mockFetch({ kind: "scam_warning", language: "en", message: "Do not share the code. Call your family." });
    setFamilyContact({ name: "Priya", phone: "+44 7700 900123" });
    render(<AskBox />);
    await userEvent.type(screen.getByLabelText("What do you need help with?"), "My bank called and asked for a code");
    await userEvent.click(screen.getByRole("button", { name: "Ask" }));

    expect(await screen.findByText("Do not share the code. Call your family.")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Stop — this looks like a scam" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Call" })).toBeInTheDocument();
    expect(push).not.toHaveBeenCalled();
    expect(getCurrentGuide()).toBeNull();
  });

  it("stops listening when the learner taps Ask, and a late result does not change the sent question", async () => {
    vi.stubGlobal("SpeechRecognition", FakeRecognition);
    const fetchMock = vi.fn(() => new Promise<Response>(() => {}));
    vi.stubGlobal("fetch", fetchMock);
    render(<AskBox />);
    await userEvent.click(screen.getByRole("button", { name: "Speak" }));
    const rec = lastRecognition();
    rec.stop.mockImplementation(() => {}); // a real browser ends a little later
    act(() => {
      rec.onresult?.({ results: [[{ transcript: "how do I send a photo" }]] });
    });
    await userEvent.click(screen.getByRole("button", { name: "Ask" }));
    expect(rec.stop).toHaveBeenCalled();
    act(() => {
      rec.onresult?.({ results: [[{ transcript: "something else entirely" }]] });
      rec.onend?.();
    });
    expect(screen.getByLabelText("What do you need help with?")).toHaveValue("how do I send a photo");
    const body = JSON.parse(String(((fetchMock.mock.calls[0] as unknown[])[1] as RequestInit).body));
    expect(body).toMatchObject({ question: "how do I send a photo" });
  });

  it("stops listening when the ask box goes away", async () => {
    vi.stubGlobal("SpeechRecognition", FakeRecognition);
    const { unmount } = render(<AskBox />);
    await userEvent.click(screen.getByRole("button", { name: "Speak" }));
    unmount();
    expect(lastRecognition().stop).toHaveBeenCalled();
  });

  it("shows the ready-tomorrow message when the server rate-limits the request (HTTP 429)", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => new Response("Too Many Requests", { status: 429 })));
    render(<AskBox />);
    await userEvent.type(screen.getByLabelText("What do you need help with?"), "How do I send a photo?");
    await userEvent.click(screen.getByRole("button", { name: "Ask" }));
    expect(await screen.findByText(/ready again tomorrow/i)).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Try again" })).not.toBeInTheDocument();
  });
});
