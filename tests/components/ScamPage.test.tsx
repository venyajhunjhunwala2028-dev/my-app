import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import ScamPage from "@/app/app/scam/page";
import { resizeScreenshot } from "@/lib/image/resize";
import { STORAGE_KEY, getUsage, requestAllowance, setFamilyContact, setSpeakingLanguage } from "@/lib/store/localStore";

const nav = vi.hoisted(() => ({ search: new URLSearchParams() }));
vi.mock("next/navigation", () => ({ useRouter: () => ({ push: vi.fn() }), useSearchParams: () => nav.search }));
vi.mock("@/lib/image/resize", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/lib/image/resize")>()),
  resizeScreenshot: vi.fn(async () => ({ base64: "BBBB", mediaType: "image/jpeg", width: 800, height: 1600 })),
}));

const NEVER_SHARE = "Never share OTPs, passwords, PINs or card numbers with anyone.";

const answer = (verdict: "safe" | "careful" | "scam") => ({
  kind: "scam_check",
  verdict,
  reasons: [`Reason for ${verdict}.`, "Second reason."],
  advice: `Advice for ${verdict}.`,
  language: "en",
});

let fetchMock: ReturnType<typeof vi.fn>;
function answerWith(body: unknown, status = 200) {
  fetchMock = vi.fn(async () => new Response(JSON.stringify(body), { status }));
  vi.stubGlobal("fetch", fetchMock);
}
const sentBody = (n = 0) => JSON.parse(fetchMock.mock.calls[n][1].body as string);
const user = () => userEvent.setup({ applyAccept: false });
const png = () => new File([new Uint8Array(10)], "shot.png", { type: "image/png" });

/** "Paste message" shows the text box; it stays open once shown. */
async function openPaste(u = user()) {
  if (!screen.queryByLabelText("Paste a message, email or link")) {
    await u.click(screen.getByRole("button", { name: "Paste message" }));
  }
  return screen.getByLabelText("Paste a message, email or link");
}

async function pasteAndCheck(text: string) {
  const u = user();
  await u.type(await openPaste(u), text);
  await u.click(screen.getByRole("button", { name: "Check it" }));
}

beforeEach(() => {
  localStorage.setItem(STORAGE_KEY, "{}");
  setSpeakingLanguage("en-IN");
  vi.mocked(resizeScreenshot).mockClear();
  answerWith(answer("safe"));
});
afterEach(() => vi.unstubAllGlobals());

describe("Is this a scam? page", () => {
  it("has a heading, a way home, the two big choices and the never-share line, and asks for nothing sensitive", () => {
    render(<ScamPage />);
    expect(screen.getByRole("heading", { level: 1, name: "Is this a scam?" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Back to home" })).toHaveAttribute("href", "/app");
    expect(screen.getByText("Not sure about a message? Send it to me. I'll help you check.")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Upload screenshot" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Paste message" })).toBeInTheDocument();
    expect(screen.getByText(NEVER_SHARE)).toBeInTheDocument();
    expect(screen.queryByLabelText(/OTP|password|PIN|card/i)).not.toBeInTheDocument();
  });

  it("Paste message reveals the text box and puts the cursor in it", async () => {
    render(<ScamPage />);
    expect(screen.queryByLabelText("Paste a message, email or link")).not.toBeInTheDocument();
    const paste = screen.getByRole("button", { name: "Paste message" });
    expect(paste).toHaveAttribute("aria-expanded", "false");
    await user().click(paste);
    expect(screen.getByLabelText("Paste a message, email or link")).toHaveFocus();
    expect(paste).toHaveAttribute("aria-expanded", "true");
  });

  it("Upload screenshot shows the privacy reminder before the picture can be chosen", async () => {
    render(<ScamPage />);
    expect(screen.queryByText(/This app doesn't save your screenshot/)).not.toBeInTheDocument();
    await user().click(screen.getByRole("button", { name: "Upload screenshot" }));
    expect(screen.getByText(/This app doesn't save your screenshot/)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Add a screenshot" })).toBeDisabled();
  });

  it("sends the pasted text and shows a scam result with icon and word, reasons, advice and Call family", async () => {
    answerWith(answer("scam"));
    setFamilyContact({ name: "Priya", phone: "+91 98765 43210" });
    render(<ScamPage />);
    await pasteAndCheck("You won a lottery, share OTP");

    const verdict = await screen.findByRole("heading", { name: "Potential scam" });
    expect(verdict).toHaveTextContent("🔴");
    expect(screen.getByText("🔴")).toHaveAttribute("aria-hidden", "true");
    expect(screen.getByTestId("mascot")).toHaveAttribute("data-mood", "warning");
    expect(screen.getByRole("heading", { name: "Why?" })).toBeInTheDocument();
    expect(screen.getByText("Reason for scam.")).toBeInTheDocument();
    expect(screen.getByText("Second reason.")).toBeInTheDocument();
    expect(screen.getByText("Advice for scam.")).toBeInTheDocument();
    expect(screen.getByText(NEVER_SHARE)).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Call" })).toHaveAttribute("href", "tel:+91 98765 43210");
    expect(sentBody()).toEqual({ text: "You won a lottery, share OTP", language: "en-IN" });
    expect(getUsage().count).toBe(1);
  });

  it("shows Be careful with a warning icon and Call family", async () => {
    answerWith(answer("careful"));
    render(<ScamPage />);
    await pasteAndCheck("http://bit.ly/x");
    const verdict = await screen.findByRole("heading", { name: "Be careful" });
    expect(verdict).toHaveTextContent("🟡");
    expect(screen.getByTestId("mascot")).toHaveAttribute("data-mood", "thinking");
    expect(screen.getByRole("heading", { name: "Who should we call for help?" })).toBeInTheDocument();
    expect(screen.getByText(NEVER_SHARE)).toBeInTheDocument();
  });

  it("shows Probably safe with a green sign, the never-share line, and no Call family", async () => {
    render(<ScamPage />);
    await pasteAndCheck("See you at dinner tonight");
    const verdict = await screen.findByRole("heading", { name: "Probably safe" });
    expect(verdict).toHaveTextContent("🟢");
    expect(screen.getByTestId("mascot")).toHaveAttribute("data-mood", "success");
    expect(screen.getByText("Advice for safe.")).toBeInTheDocument();
    expect(screen.getByText(NEVER_SHARE)).toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: "Who should we call for help?" })).not.toBeInTheDocument();
  });

  it("sends a screenshot after the privacy reminder, with or without text", async () => {
    render(<ScamPage />);
    const u = user();
    await u.click(screen.getByRole("button", { name: "Upload screenshot" }));
    expect(screen.getByText(/This app doesn't save your screenshot/)).toBeInTheDocument();
    await u.click(screen.getByRole("button", { name: "I understand" }));
    await u.upload(screen.getByTestId("scam-screenshot-input"), png());
    expect(await screen.findByText("Screenshot added.")).toBeInTheDocument();
    await u.click(screen.getByRole("button", { name: "Check it" }));
    await screen.findByRole("heading", { name: "Probably safe" });
    expect(sentBody()).toEqual({ image: "BBBB", mediaType: "image/jpeg", width: 800, height: 1600, language: "en-IN" });
  });

  it("sends text and screenshot together", async () => {
    render(<ScamPage />);
    const u = user();
    await u.click(screen.getByRole("button", { name: "Upload screenshot" }));
    await u.click(screen.getByRole("button", { name: "I understand" }));
    await u.upload(screen.getByTestId("scam-screenshot-input"), png());
    await screen.findByText("Screenshot added.");
    await pasteAndCheck("Is this real?");
    await screen.findByRole("heading", { name: "Probably safe" });
    expect(sentBody()).toMatchObject({ text: "Is this real?", image: "BBBB" });
  });

  it("asks for something to check instead of sending nothing", async () => {
    render(<ScamPage />);
    await user().click(screen.getByRole("button", { name: "Check it" }));
    expect(screen.getByRole("alert")).toHaveTextContent(/paste a message or add a screenshot/i);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("at 30 uses today, says ready tomorrow and sends nothing", async () => {
    for (let i = 0; i < 30; i++) requestAllowance();
    render(<ScamPage />);
    await pasteAndCheck("You won a lottery");
    expect(await screen.findByText(/ready again tomorrow/i)).toBeInTheDocument();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("shows an error with Try again, which sends the same check again", async () => {
    answerWith({ error: "retry", message: "Sorry, something went wrong. Please try again." }, 502);
    render(<ScamPage />);
    await pasteAndCheck("Hello");
    expect(await screen.findByText("Sorry, something went wrong. Please try again.")).toBeInTheDocument();
    fetchMock.mockResolvedValueOnce(new Response(JSON.stringify(answer("safe"))));
    await user().click(screen.getByRole("button", { name: "Try again" }));
    await screen.findByRole("heading", { name: "Probably safe" });
    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(2));
    expect(sentBody(1)).toEqual({ text: "Hello", language: "en-IN" });
  });

  it("can check something else after a result", async () => {
    render(<ScamPage />);
    await pasteAndCheck("Hello");
    await user().click(await screen.findByRole("button", { name: "Check something else" }));
    expect(await openPaste()).toHaveValue("");
  });

  describe("Verify before I do it", () => {
    const findings = [
      { signal: "sender", ok: true, text: "It is from a number you saved." },
      { signal: "links", ok: false, text: "It has a link you didn't expect." },
      { signal: "otp", ok: true, text: "It does not ask for a code." },
    ];

    it("offers the example questions as chips, and sends the chosen one with the message", async () => {
      answerWith({ ...answer("careful"), findings, recommendation: "Don't click the link." });
      render(<ScamPage />);
      expect(screen.getByRole("heading", { name: "Verify before I do it" })).toBeInTheDocument();
      for (const q of ["Is this message safe?", "Is this safe to click?", "Should I reply?", "Is this really from my bank?", "Can I trust this email?"]) {
        expect(screen.getByRole("button", { name: q })).toHaveAttribute("aria-pressed", "false");
      }
      const u = user();
      await u.click(screen.getByRole("button", { name: "Is this safe to click?" }));
      expect(screen.getByRole("button", { name: /Is this safe to click\?/ })).toHaveAttribute("aria-pressed", "true");
      await pasteAndCheck("Your parcel is waiting: http://bit.ly/x");

      await screen.findByRole("heading", { name: "Be careful" });
      expect(sentBody()).toEqual({ text: "Your parcel is waiting: http://bit.ly/x", question: "Is this safe to click?", language: "en-IN" });
      expect(screen.getByText("Is this safe to click?")).toBeInTheDocument();
      expect(screen.getByTestId("scam-recommendation")).toHaveTextContent("Don't click the link.");
    });

    it("shows a ✓ or ⚠ line per sign under the verdict, with words for screen readers", async () => {
      answerWith({ ...answer("careful"), findings, recommendation: "Don't click the link." });
      render(<ScamPage />);
      await pasteAndCheck("Hello http://x.co");
      expect(await screen.findByRole("heading", { name: "What I checked" })).toBeInTheDocument();
      const lines = screen.getAllByTestId("scam-finding");
      expect(lines.map((l) => l.dataset.ok)).toEqual(["true", "false", "true"]);
      expect(lines[0]).toHaveTextContent("Looks fine: Sender: It is from a number you saved.");
      expect(lines[1]).toHaveTextContent("Warning: Links: It has a link you didn't expect.");
      expect(lines[1].querySelector('[aria-hidden="true"]')).toHaveTextContent("⚠");
      // "Why?" stays, in simple words.
      expect(screen.getByRole("heading", { name: "Why?" })).toBeInTheDocument();
    });

    it("tapping a chosen question again removes it", async () => {
      render(<ScamPage />);
      const u = user();
      await u.click(screen.getByRole("button", { name: "Should I reply?" }));
      await u.click(screen.getByRole("button", { name: /Should I reply\?/ }));
      await pasteAndCheck("Hi");
      await screen.findByRole("heading", { name: "Probably safe" });
      expect(sentBody().question).toBeUndefined();
    });

    it("with only a question from the home screen, asks for the message instead of sending or failing", async () => {
      nav.search = new URLSearchParams("q=Should I reply to this text?");
      render(<ScamPage />);
      expect(screen.queryByRole("alert")).not.toBeInTheDocument();
      expect(screen.getByRole("button", { name: "Paste message" })).toBeInTheDocument();
      expect(screen.getByRole("button", { name: "Upload screenshot" })).toBeInTheDocument();
      await user().click(screen.getByRole("button", { name: "Check it" }));
      expect(screen.getByRole("alert")).toHaveTextContent(/paste a message or add a screenshot/i);
      expect(fetchMock).not.toHaveBeenCalled();
      expect(getUsage().count).toBe(0);
      await pasteAndCheck("Hi Mum, I lost my phone. Reply on this number.");
      await screen.findByRole("heading", { name: "Probably safe" });
      expect(sentBody().question).toBe("Should I reply to this text?");
      nav.search = new URLSearchParams();
    });

    it("picks up a safety question asked on the home screen", async () => {
      nav.search = new URLSearchParams("q=Is this really from my bank?");
      render(<ScamPage />);
      expect(screen.getByRole("button", { name: /Is this really from my bank\?/ })).toHaveAttribute("aria-pressed", "true");
      await pasteAndCheck("Dear customer, your account is fine.");
      await screen.findByRole("heading", { name: "Probably safe" });
      expect(sentBody().question).toBe("Is this really from my bank?");

      nav.search = new URLSearchParams("q=Is it safe to open this pdf?");
      render(<ScamPage />);
      expect(screen.getAllByText("Is it safe to open this pdf?").length).toBeGreaterThan(0);
      nav.search = new URLSearchParams();
    });
  });
});
