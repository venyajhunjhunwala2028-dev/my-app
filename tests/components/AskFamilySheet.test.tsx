import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { STORAGE_KEY, getFamilyContact, setFamilyContact } from "@/lib/store/localStore";
import AskFamilySheet from "@/components/AskFamilySheet";

vi.mock("@/lib/image/prepare", () => ({
  prepareScreenshot: vi.fn(async () => ({ image: { base64: "AAAA", mediaType: "image/jpeg", width: 10, height: 20 } })),
}));

const inGuide = {
  goal: "Send a photo on WhatsApp",
  step: { number: 2, total: 5, instruction: "Tap the paperclip." },
};

const messageLines = () =>
  [...screen.getByTestId("family-message").querySelectorAll("p")].map((p) => p.textContent);

describe("AskFamilySheet", () => {
  beforeEach(() => {
    localStorage.setItem(STORAGE_KEY, "{}");
  });
  afterEach(() => vi.unstubAllGlobals());

  it("shows exactly what will be shared and who it goes to", () => {
    setFamilyContact({ name: "Priya", phone: "+44 7700 900123" });
    render(<AskFamilySheet context={inGuide} onClose={() => {}} />);

    const dialog = screen.getByRole("dialog", { name: "Ask my family" });
    expect(within(dialog).getByText("This message will be sent to Priya:")).toBeInTheDocument();
    expect(messageLines()).toEqual([
      "I need help with: Send a photo on WhatsApp",
      "I'm on step 2 of 5: Tap the paperclip.",
      "Sent from Tech Helper",
    ]);
    const text = "I need help with: Send a photo on WhatsApp\nI'm on step 2 of 5: Tap the paperclip.\nSent from Tech Helper";
    expect(screen.getByRole("link", { name: "Send on WhatsApp" })).toHaveAttribute(
      "href",
      `https://wa.me/447700900123?text=${encodeURIComponent(text)}`,
    );
    expect(screen.getByRole("link", { name: "Send a text message" })).toHaveAttribute(
      "href",
      `sms:+447700900123?body=${encodeURIComponent(text)}`,
    );
    // No phone number or settings in the message itself.
    expect(screen.getByTestId("family-message")).not.toHaveTextContent("7700");
  });

  it("replaces a question about an OTP with the generic line", () => {
    render(<AskFamilySheet context={{ goal: "my otp is 482913 what now" }} onClose={() => {}} />);
    expect(messageLines()).toEqual(["I need help with my phone", "Sent from Tech Helper"]);
    expect(screen.getByRole("link", { name: "Send on WhatsApp" }).getAttribute("href")).not.toContain("482913");
  });

  it("with no family contact, offers to add one but still lets them send and choose who", async () => {
    const user = userEvent.setup();
    render(<AskFamilySheet context={{ goal: "Make a video call" }} onClose={() => {}} />);

    expect(screen.getByText("This message will be sent to the person you choose:")).toBeInTheDocument();
    expect(screen.getByText(/You haven't saved a family contact yet/)).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Send on WhatsApp" }).getAttribute("href")).toMatch(/^https:\/\/wa\.me\/\?text=/);
    expect(screen.getByRole("link", { name: "Send a text message" }).getAttribute("href")).toMatch(/^sms:\?body=/);

    await user.type(screen.getByLabelText("Name"), "Priya");
    await user.type(screen.getByLabelText(/Phone number/), "+91 98765 43210");
    await user.click(screen.getByRole("button", { name: "Save" }));

    expect(getFamilyContact()).toEqual({ name: "Priya", phone: "+91 98765 43210" });
    expect(screen.getByText("This message will be sent to Priya:")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Send on WhatsApp" }).getAttribute("href")).toMatch(/^https:\/\/wa\.me\/919876543210\?text=/);
  });

  it("uses &body= for text messages on an iPhone", () => {
    vi.stubGlobal("navigator", { ...navigator, userAgent: "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X)" });
    render(<AskFamilySheet context={{ goal: "Make a video call" }} onClose={() => {}} />);
    expect(screen.getByRole("link", { name: "Send a text message" }).getAttribute("href")).toMatch(/^sms:&body=/);
  });

  it("has no Share or picture option when the phone cannot share", () => {
    render(<AskFamilySheet context={inGuide} onClose={() => {}} />);
    expect(screen.queryByRole("button", { name: "Share another way" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Add a picture of my screen" })).not.toBeInTheDocument();
  });

  it("offers text-only sharing when files cannot be shared", async () => {
    const share = vi.fn(async () => {});
    vi.stubGlobal("navigator", { ...navigator, share, canShare: () => false });
    render(<AskFamilySheet context={inGuide} onClose={() => {}} />);
    expect(screen.queryByRole("button", { name: "Add a picture of my screen" })).not.toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: "Share another way" }));
    expect(share).toHaveBeenCalledWith({
      text: "I need help with: Send a photo on WhatsApp\nI'm on step 2 of 5: Tap the paperclip.\nSent from Tech Helper",
    });
  });

  it("keeps the screenshot off by default, and shows the privacy reminder before one can be added", async () => {
    const user = userEvent.setup();
    const share = vi.fn<(data: ShareData) => Promise<void>>(async () => {});
    const fetchSpy = vi.fn();
    vi.stubGlobal("fetch", fetchSpy);
    vi.stubGlobal("navigator", { ...navigator, share, canShare: () => true });
    render(<AskFamilySheet context={inGuide} onClose={() => {}} />);

    const toggle = screen.getByRole("button", { name: "Add a picture of my screen" });
    expect(toggle).toHaveAttribute("aria-pressed", "false");
    expect(screen.queryByText(/Don't add screenshots of bank apps/)).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Choose your screenshot" })).not.toBeInTheDocument();

    await user.click(toggle);
    expect(toggle).toHaveAttribute("aria-pressed", "true");
    expect(screen.getByText(/Don't add screenshots of bank apps, passwords, OTPs or private messages/)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Choose your screenshot" })).toBeDisabled();

    await user.click(screen.getByRole("button", { name: "I understand" }));
    const file = new File(["x"], "screen.png", { type: "image/png" });
    await user.upload(screen.getByTestId("family-screenshot-input"), file);

    expect(await screen.findByText(/Picture added/)).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Send with my picture" }));
    await waitFor(() => expect(share).toHaveBeenCalledTimes(1));
    const data = share.mock.calls[0][0];
    expect(data.text).toContain("I need help with: Send a photo on WhatsApp");
    expect(data.files).toHaveLength(1);
    expect(data.files?.[0].type).toBe("image/jpeg");
    // Shared straight from the phone: nothing is uploaded.
    expect(fetchSpy).not.toHaveBeenCalled();

    await user.click(screen.getByRole("button", { name: "Remove the picture" }));
    expect(screen.getByRole("button", { name: "Share another way" })).toBeInTheDocument();
  });

  it("closes with the Close button and with Escape", async () => {
    const onClose = vi.fn();
    render(<AskFamilySheet context={inGuide} onClose={onClose} />);
    await userEvent.click(screen.getByRole("button", { name: "Close" }));
    await userEvent.keyboard("{Escape}");
    expect(onClose).toHaveBeenCalledTimes(2);
  });

  it("shows the message in Hindi for the Hindi interface", () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ uiLanguage: "hi" }));
    render(<AskFamilySheet context={{ goal: "फ़ोटो कैसे भेजें" }} onClose={() => {}} />);
    expect(messageLines()).toEqual(["मुझे इसमें मदद चाहिए: फ़ोटो कैसे भेजें", "Tech Helper से भेजा गया"]);
    expect(screen.getByRole("link", { name: "WhatsApp पर भेजें" }).getAttribute("href")).toBe(
      `https://wa.me/?text=${encodeURIComponent("मुझे इसमें मदद चाहिए: फ़ोटो कैसे भेजें\nTech Helper से भेजा गया")}`,
    );
  });
});
