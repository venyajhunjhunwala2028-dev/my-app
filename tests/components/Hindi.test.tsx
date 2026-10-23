import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import Home from "@/app/app/page";
import ScamPage from "@/app/app/scam/page";
import GuidePage from "@/app/guide/[id]/page";
import AppPreferences from "@/components/AppPreferences";
import { STORAGE_KEY, getGuide, saveGuide, setGuideStep, setLevel, setUiLanguage } from "@/lib/store/localStore";

vi.mock("next/navigation", () => ({ useRouter: () => ({ push: vi.fn() }) }));

const step = (n: number, lang = "en") => ({
  instruction: lang === "hi" ? `काम ${n} करें` : `Do thing ${n}`,
  lookFor: `Button ${n}`,
  spoken: `Say ${n}`,
  encouragement: "",
});

const stepsAnswer = (lang: "en" | "hi", count = 3) => ({
  kind: "steps",
  language: lang,
  title: lang === "hi" ? "स्टोरी डालें" : "Post a story",
  device: "iPhone",
  app: null,
  safety: null,
  steps: Array.from({ length: count }, (_, i) => step(i + 1, lang)),
  screenshotHowTo: ["Press the side button"],
});

const explanation = (lang: "en" | "hi") => ({
  kind: "explanation",
  language: lang,
  title: lang === "hi" ? "चैटजीपीटी क्या है?" : "What is ChatGPT?",
  text: lang === "hi" ? "यह एक कंप्यूटर प्रोग्राम है।" : "ChatGPT is a computer program.",
  offerShowMeHow: true,
});

let fetchMock: ReturnType<typeof vi.fn>;
function answerWith(body: unknown) {
  fetchMock = vi.fn(async () => new Response(JSON.stringify(body), { status: 200 }));
  vi.stubGlobal("fetch", fetchMock);
}
const sentBody = (n = 0) => JSON.parse(String(((fetchMock.mock.calls[n] as unknown[])[1] as RequestInit).body));

async function openGuide(id: string) {
  await act(async () => {
    render(<GuidePage params={Promise.resolve({ id })} />);
  });
}

beforeEach(() => localStorage.setItem(STORAGE_KEY, "{}"));
afterEach(() => {
  vi.unstubAllGlobals();
  document.documentElement.removeAttribute("lang");
});

describe("Hindi interface", () => {
  it("shows the home screen in Hindi and sets html lang", async () => {
    setUiLanguage("hi");
    render(
      <>
        <AppPreferences />
        <Home />
      </>,
    );
    expect(await screen.findByRole("button", { name: "सवाल पूछें" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "क्या यह धोखा है?" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "सेटिंग्स" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "मेरी पिछली मदद" })).toBeInTheDocument();
    await waitFor(() => expect(document.documentElement.lang).toBe("hi"));
  });

  it("is English by default", () => {
    render(<Home />);
    expect(screen.getByRole("button", { name: "Ask a question" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "My previous help" })).toBeInTheDocument();
  });

  it("shows the step player controls in Hindi", async () => {
    setUiLanguage("hi");
    saveGuide({ id: "story", question: "How do I post a story?", title: "Post a story", answer: stepsAnswer("en") });
    await openGuide("story");
    expect(screen.getByText("कुल 3 में से चरण 1")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "हो गया, अगला चरण" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "मुझे दिक्कत आ रही है" })).toBeInTheDocument();
    // The AI's own text stays as it came.
    expect(screen.getByRole("heading", { level: 1, name: "Do thing 1" })).toBeInTheDocument();
  });

  it("shows the scam page in Hindi", () => {
    setUiLanguage("hi");
    render(<ScamPage />);
    expect(screen.getByRole("heading", { level: 1, name: "क्या यह धोखा है?" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "जाँच करें" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "होम पर वापस जाएँ" })).toBeInTheDocument();
  });

  it("sends the Hindi answer language and the saved level with step help", async () => {
    setUiLanguage("hi");
    setLevel("detailed");
    saveGuide({ id: "story", question: "How do I post a story?", title: "Post a story", answer: stepsAnswer("en") });
    answerWith({ kind: "explanation", language: "hi", title: "मदद", text: "नीला बटन दबाएँ।", offerShowMeHow: false });
    await openGuide("story");
    await userEvent.click(screen.getByRole("button", { name: "फिर से दिखाइए" }));
    await screen.findByText("नीला बटन दबाएँ।");
    expect(sentBody()).toMatchObject({ mode: "showAgain", language: "hi-IN", level: "detailed" });
  });
});

describe("Explain this in the other language", () => {
  it("re-asks a steps guide in Hindi and keeps the same guide at the same step", async () => {
    saveGuide({ id: "story", question: "How do I post a story?", title: "Post a story", answer: stepsAnswer("en") });
    setGuideStep("story", 2);
    answerWith(stepsAnswer("hi"));
    await openGuide("story");
    expect(screen.getByText("Step 2 of 3")).toBeInTheDocument();

    await userEvent.click(screen.getByRole("button", { name: "Explain this in Hindi" }));
    expect(await screen.findByRole("heading", { level: 1, name: "काम 2 करें" })).toBeInTheDocument();
    expect(screen.getByText("Step 2 of 3")).toBeInTheDocument();
    expect(sentBody()).toMatchObject({
      question: "How do I post a story?",
      mode: "showMeHow",
      language: "hi-IN",
      answerLanguage: "hi-IN",
    });
    const saved = getGuide("story");
    expect(saved?.answer).toMatchObject({ kind: "steps", language: "hi" });
    expect(saved?.step).toBe(2);
    // Already in Hindi, so the button is not offered again.
    expect(screen.queryByRole("button", { name: "Explain this in Hindi" })).not.toBeInTheDocument();
  });

  it("stays on the last step when the new guide is shorter", async () => {
    saveGuide({ id: "story", question: "How do I post a story?", title: "Post a story", answer: stepsAnswer("en", 4) });
    setGuideStep("story", 4);
    answerWith(stepsAnswer("hi", 3));
    await openGuide("story");
    await userEvent.click(screen.getByRole("button", { name: "Explain this in Hindi" }));
    expect(await screen.findByRole("heading", { level: 1, name: "काम 3 करें" })).toBeInTheDocument();
    expect(getGuide("story")?.step).toBe(3);
  });

  it("offers English when the interface is Hindi, for an explanation", async () => {
    setUiLanguage("hi");
    saveGuide({ id: "gpt", question: "ChatGPT क्या है?", title: "चैटजीपीटी", answer: explanation("hi") });
    answerWith(explanation("en"));
    await openGuide("gpt");
    await userEvent.click(screen.getByRole("button", { name: "इसे अंग्रेज़ी में समझाइए" }));
    expect(await screen.findByText("ChatGPT is a computer program.")).toBeInTheDocument();
    expect(sentBody()).toMatchObject({ question: "ChatGPT क्या है?", mode: "ask", language: "en-IN", answerLanguage: "en-IN" });
    expect(getGuide("gpt")?.answer).toMatchObject({ kind: "explanation", language: "en" });
  });

  it("re-asks an explanation in Hindi from the English interface", async () => {
    saveGuide({ id: "gpt", question: "What is ChatGPT?", title: "What is ChatGPT?", answer: explanation("en") });
    answerWith(explanation("hi"));
    await openGuide("gpt");
    await userEvent.click(screen.getByRole("button", { name: "Explain this in Hindi" }));
    expect(await screen.findByText("यह एक कंप्यूटर प्रोग्राम है।")).toBeInTheDocument();
    expect(sentBody()).toMatchObject({ question: "What is ChatGPT?", mode: "ask", language: "hi-IN" });
  });
});
