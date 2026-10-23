import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import PressPage from "@/app/app/press/page";
import { STORAGE_KEY, getDevices, getUsage, requestAllowance, setDevices, setSpeakingLanguage } from "@/lib/store/localStore";

vi.mock("next/navigation", () => ({ useRouter: () => ({ push: vi.fn() }) }));
vi.mock("@/lib/image/resize", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/lib/image/resize")>()),
  resizeScreenshot: vi.fn(async () => ({ base64: "AAAA", mediaType: "image/jpeg", width: 1000, height: 2000 })),
}));

let fetchMock: ReturnType<typeof vi.fn>;
function answerWith(body: unknown) {
  fetchMock = vi.fn(async () => new Response(JSON.stringify(body), { status: 200 }));
  vi.stubGlobal("fetch", fetchMock);
}

const png = () => new File([new Uint8Array(10)], "shot.png", { type: "image/png" });
const user = () => userEvent.setup({ applyAccept: false });

async function chooseAndAsk(question = "How do I send this?") {
  const u = user();
  await u.click(screen.getByRole("button", { name: "I understand" }));
  await u.upload(screen.getByTestId("screenshot-input"), png());
  await u.type(await screen.findByLabelText("What do you want to do?"), question);
  await u.click(screen.getByRole("button", { name: "Show me" }));
}

class FakeRecognition {
  static instances: FakeRecognition[] = [];
  lang = "";
  continuous = false;
  interimResults = false;
  maxAlternatives = 1;
  onresult: ((e: unknown) => void) | null = null;
  onerror: ((e: unknown) => void) | null = null;
  onend: (() => void) | null = null;
  start = vi.fn();
  stop = vi.fn(() => this.onend?.());
  constructor() {
    FakeRecognition.instances.push(this);
  }
}

beforeEach(() => {
  localStorage.setItem(STORAGE_KEY, "{}");
  setDevices(["iPhone"]);
  setSpeakingLanguage("en-IN");
  FakeRecognition.instances = [];
  answerWith({ kind: "found", box: { x: 400, y: 1800, width: 200, height: 100 }, instruction: "Tap here." });
});
afterEach(() => vi.unstubAllGlobals());

describe("What do I press? page", () => {
  it("has a heading, a way home, the privacy reminder, and screenshot help for the saved device", () => {
    render(<PressPage />);
    expect(screen.getByRole("heading", { level: 1, name: "What do I press?" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Back to home" })).toHaveAttribute("href", "/app");
    expect(screen.getByText(/Don't send screenshots of bank apps, passwords or private messages/)).toBeInTheDocument();
    expect(screen.getByText(/side button and the volume up button/)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Choose your screenshot" })).toBeDisabled();
  });

  it("asks which device first when none is saved, and remembers it", async () => {
    localStorage.setItem(STORAGE_KEY, "{}");
    render(<PressPage />);
    await user().click(screen.getByRole("button", { name: "Android phone" }));
    expect(getDevices()[0]).toBe("Android phone");
    expect(screen.getByText(/power button and the volume down button/)).toBeInTheDocument();
  });

  it("sends only the question (no guide step) and shows the short instruction, circle and arrow", async () => {
    render(<PressPage />);
    await chooseAndAsk();

    expect(await screen.findByText("Tap here.")).toBeInTheDocument();
    expect(screen.getByTestId("tap-marker")).toBeInTheDocument();
    expect(screen.getByTestId("tap-circle")).toBeInTheDocument();
    expect(screen.getByTestId("tap-arrow")).toBeInTheDocument();
    expect(screen.getByRole("img", { name: "Your screenshot" })).toBeInTheDocument();

    const body = JSON.parse(fetchMock.mock.calls[0][1].body as string);
    expect(body).toEqual({
      image: "AAAA",
      mediaType: "image/jpeg",
      width: 1000,
      height: 2000,
      question: "How do I send this?",
      language: "en-IN",
    });
    expect(getUsage().count).toBe(1);
  });

  it("asks for the question before sending, and does not send an empty one", async () => {
    render(<PressPage />);
    const u = user();
    await u.click(screen.getByRole("button", { name: "I understand" }));
    await u.upload(screen.getByTestId("screenshot-input"), png());
    await u.click(await screen.findByRole("button", { name: "Show me" }));
    expect(screen.getByRole("alert")).toHaveTextContent(/what you want to do/i);
    expect(fetchMock).not.toHaveBeenCalled();
    expect(getUsage().count).toBe(0);
  });

  it("lets the learner say the question with the microphone", async () => {
    vi.stubGlobal("SpeechRecognition", FakeRecognition);
    render(<PressPage />);
    const u = user();
    await u.click(screen.getByRole("button", { name: "I understand" }));
    await u.upload(screen.getByTestId("screenshot-input"), png());
    await u.click(await screen.findByRole("button", { name: "Speak" }));
    expect(FakeRecognition.instances[0].lang).toBe("en-IN");
    act(() => {
      FakeRecognition.instances[0].onresult?.({ results: [[{ transcript: "turn on wifi" }]] });
      FakeRecognition.instances[0].onend?.();
    });
    expect(screen.getByLabelText("What do you want to do?")).toHaveValue("turn on wifi");
  });

  it("shows the not-found description without a circle", async () => {
    answerWith({ kind: "not_found", description: "Go back to the home screen and take a new screenshot." });
    render(<PressPage />);
    await chooseAndAsk();
    expect(await screen.findByText("Go back to the home screen and take a new screenshot.")).toBeInTheDocument();
    expect(screen.queryByTestId("tap-circle")).not.toBeInTheDocument();
  });

  it("shows the scam warning without a circle", async () => {
    answerWith({ kind: "scam_warning", message: "This screen asks for a code. Do not type it." });
    render(<PressPage />);
    await chooseAndAsk();
    expect(await screen.findByText("This screen asks for a code. Do not type it.")).toBeInTheDocument();
    expect(screen.getByText("Stop — this looks like a scam")).toBeInTheDocument();
    expect(screen.queryByTestId("tap-circle")).not.toBeInTheDocument();
  });

  it("at 30 uses today, says ready tomorrow and sends nothing", async () => {
    for (let i = 0; i < 30; i++) requestAllowance();
    render(<PressPage />);
    await chooseAndAsk();
    expect(await screen.findByText(/ready again tomorrow/i)).toBeInTheDocument();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("starts again for another screen after an answer", async () => {
    render(<PressPage />);
    await chooseAndAsk();
    await user().click(await screen.findByRole("button", { name: "Ask about another screen" }));
    await waitFor(() => expect(screen.getByRole("button", { name: "Choose your screenshot" })).toBeInTheDocument());
  });
});
