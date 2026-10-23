import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import {
  STORAGE_KEY,
  getCurrentGuide,
  getDevices,
  getUsage,
  requestAllowance,
  setDevices,
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
    await userEvent.type(screen.getByLabelText("What would you like to do?"), "How do I send a photo?");
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
    await userEvent.type(screen.getByLabelText("What would you like to do?"), "How do I send a photo?");
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
    await userEvent.type(screen.getByLabelText("What would you like to do?"), "How do I send a photo?");
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
    expect(screen.getByLabelText("What would you like to do?")).toHaveValue("how do I send a photo");
    expect(fetchMock).not.toHaveBeenCalled();
    await userEvent.click(screen.getByRole("button", { name: "Ask" }));
    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(1));
  });

  it("covers AE8: at 30 uses today it says ready tomorrow, offers Call family and sends nothing", async () => {
    const fetchMock = mockFetch(stepsAnswer);
    setFamilyContact({ name: "Priya", phone: "+44 7700 900123" });
    for (let i = 0; i < 30; i++) requestAllowance();
    render(<AskBox />);
    await userEvent.type(screen.getByLabelText("What would you like to do?"), "How do I send a photo?");
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
    await userEvent.type(screen.getByLabelText("What would you like to do?"), "My bank called and asked for a code");
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
    expect(screen.getByLabelText("What would you like to do?")).toHaveValue("how do I send a photo");
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
    await userEvent.type(screen.getByLabelText("What would you like to do?"), "How do I send a photo?");
    await userEvent.click(screen.getByRole("button", { name: "Ask" }));
    expect(await screen.findByText(/ready again tomorrow/i)).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Try again" })).not.toBeInTheDocument();
  });

  it("asks one clarifying question about the app, then sends the chosen app with the same question", async () => {
    const fetchMock = vi.fn();
    fetchMock.mockResolvedValueOnce(
      new Response(
        JSON.stringify({
          kind: "clarify",
          language: "en",
          prompt: "Which app do you want to post the picture on?",
          options: ["Instagram", "WhatsApp", "Facebook"],
          about: "app",
        }),
      ),
    );
    fetchMock.mockResolvedValueOnce(new Response(JSON.stringify(stepsAnswer)));
    vi.stubGlobal("fetch", fetchMock);
    render(<AskBox />);
    await userEvent.type(screen.getByLabelText("What would you like to do?"), "How do I post a picture?");
    await userEvent.click(screen.getByRole("button", { name: "Ask" }));
    await userEvent.click(await screen.findByRole("button", { name: "WhatsApp" }));

    await waitFor(() => expect(push).toHaveBeenCalled());
    const second = JSON.parse(String(((fetchMock.mock.calls[1] as unknown[])[1] as RequestInit).body));
    expect(second).toMatchObject({ question: "How do I post a picture?", app: "WhatsApp" });
  });

  it("shows a kind message and example questions when the question is unclear", async () => {
    mockFetch({
      kind: "unclear",
      language: "en",
      message: "I'm not completely sure what you mean. Tell me what you are trying to do, and I'll help.",
      examples: ["How do I make a video call?", "How do I send a photo?", "How do I make the text bigger?"],
    });
    render(<AskBox />);
    await userEvent.type(screen.getByLabelText("What would you like to do?"), "help");
    await userEvent.click(screen.getByRole("button", { name: "Ask" }));

    expect(await screen.findByText(/not completely sure what you mean/)).toBeInTheDocument();
    expect(screen.getByText("How do I send a photo?")).toBeInTheDocument();
    expect(push).not.toHaveBeenCalled();
  });

  function answerInOrder(...bodies: unknown[]) {
    const fetchMock = vi.fn();
    for (const b of bodies) fetchMock.mockResolvedValueOnce(new Response(JSON.stringify(b)));
    vi.stubGlobal("fetch", fetchMock);
    return fetchMock;
  }
  const bodyOf = (fetchMock: ReturnType<typeof vi.fn>, n: number) =>
    JSON.parse(String(((fetchMock.mock.calls[n] as unknown[])[1] as RequestInit).body));

  it("asks which device as one question with big buttons, saves the choice first and asks again", async () => {
    setDevices(["Windows computer"]);
    const fetchMock = answerInOrder(
      { kind: "clarify", language: "en", prompt: "Which device are you using?", options: ["iPhone", "Android phone"], about: "device" },
      stepsAnswer,
    );
    render(<AskBox />);
    await userEvent.type(screen.getByLabelText("What would you like to do?"), "How do I take a screenshot?");
    await userEvent.click(screen.getByRole("button", { name: "Ask" }));

    expect(await screen.findByRole("heading", { name: "Which device are you using?" })).toBeInTheDocument();
    expect(screen.getByText("How do I take a screenshot?")).toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: "Android phone" }));
    await waitFor(() => expect(push).toHaveBeenCalled());
    expect(getDevices()).toEqual(["Android phone", "Windows computer"]);
    expect(bodyOf(fetchMock, 1)).toMatchObject({ question: "How do I take a screenshot?", devices: ["Android phone", "Windows computer"] });
  });

  it("adds an 'other' clarification choice to the same question", async () => {
    const fetchMock = answerInOrder(
      { kind: "clarify", language: "en", prompt: "Photo or video?", options: ["Photo", "Video"], about: "other" },
      stepsAnswer,
    );
    render(<AskBox />);
    await userEvent.type(screen.getByLabelText("What would you like to do?"), "How do I send it?");
    await userEvent.click(screen.getByRole("button", { name: "Ask" }));
    await userEvent.click(await screen.findByRole("button", { name: "Video" }));
    await waitFor(() => expect(push).toHaveBeenCalled());
    expect(bodyOf(fetchMock, 1).question).toBe("How do I send it? (Video)");
  });

  it("an example question for an unclear answer fills the box and asks it", async () => {
    const fetchMock = answerInOrder(
      {
        kind: "unclear",
        language: "en",
        message: "I'm not completely sure what you mean.",
        examples: ["How do I make a video call?", "How do I send a photo?"],
      },
      stepsAnswer,
    );
    render(<AskBox />);
    await userEvent.type(screen.getByLabelText("What would you like to do?"), "help");
    await userEvent.click(screen.getByRole("button", { name: "Ask" }));
    await userEvent.click(await screen.findByRole("button", { name: "How do I send a photo?" }));

    await waitFor(() => expect(push).toHaveBeenCalled());
    expect(bodyOf(fetchMock, 1).question).toBe("How do I send a photo?");
    expect(getCurrentGuide()?.question).toBe("How do I send a photo?");
  });

  describe("intent first", () => {
    it("asks What would you like to do?, with plain reassuring words under it", () => {
      render(<AskBox />);
      const box = screen.getByLabelText("What would you like to do?");
      expect(box).toHaveAccessibleDescription("Say it in your own words. There are no silly questions.");
    });

    it("opens the scam check for a safety question, without asking the helper or using a daily use", async () => {
      const fetchMock = mockFetch(stepsAnswer);
      render(<AskBox />);
      await userEvent.type(screen.getByLabelText("What would you like to do?"), "Is this message safe?");
      await userEvent.click(screen.getByRole("button", { name: "Ask" }));
      expect(push).toHaveBeenCalledWith("/app/scam?q=Is%20this%20message%20safe%3F");
      expect(fetchMock).not.toHaveBeenCalled();
      expect(getUsage().count).toBe(0);
    });

    it("opens the scam check when the helper says it is a safety question", async () => {
      mockFetch({ kind: "safety_check", language: "en", message: "Let's check it together." });
      render(<AskBox />);
      await userEvent.type(screen.getByLabelText("What would you like to do?"), "My grandson texted from a new number");
      await userEvent.click(screen.getByRole("button", { name: "Ask" }));
      await waitFor(() => expect(push).toHaveBeenCalledWith("/app/scam?q=My%20grandson%20texted%20from%20a%20new%20number"));
    });

    it("sends a goal in plain words to the helper as it is", async () => {
      const fetchMock = mockFetch(stepsAnswer);
      render(<AskBox />);
      await userEvent.type(screen.getByLabelText("What would you like to do?"), "I want to send a photo to my daughter");
      await userEvent.click(screen.getByRole("button", { name: "Ask" }));
      await waitFor(() => expect(push).toHaveBeenCalledWith(expect.stringMatching(/^\/guide\//)));
      expect(JSON.parse(String((fetchMock.mock.calls[0] as unknown as [string, RequestInit])[1].body)).question).toBe(
        "I want to send a photo to my daughter",
      );
    });
  });
});
