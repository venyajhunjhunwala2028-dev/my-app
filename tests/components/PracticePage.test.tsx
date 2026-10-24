import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { STORAGE_KEY, getCompletedPractice, setUiLanguage } from "@/lib/store/localStore";
import PracticePage from "@/app/app/practice/page";

vi.mock("next/navigation", () => ({ useRouter: () => ({ push: vi.fn() }), useSearchParams: () => new URLSearchParams() }));

const feedback = () => screen.queryByTestId("practice-feedback");
const instruction = () => screen.getByTestId("practice-instruction");

describe("Practice page", () => {
  beforeEach(() => {
    localStorage.setItem(STORAGE_KEY, "{}");
  });

  it("lists the exercises and says the screens are pretend", () => {
    render(<PracticePage />);
    expect(screen.getByRole("heading", { level: 1, name: "Practice" })).toBeInTheDocument();
    expect(screen.getByText("Practice screen — not the real app")).toBeInTheDocument();
    for (const name of ["Send a photo in a chat app", "Make a video call", "Post a photo", "Spot the scam message"]) {
      expect(screen.getByRole("button", { name })).toBeInTheDocument();
    }
    expect(screen.getByRole("button", { name: "Send a photo in a chat app" })).toHaveAccessibleDescription(
      "Open a chat, attach a photo and send it.",
    );
  });

  it("praises the right tap, hints after a wrong one, and makes the right place glow after two misses", async () => {
    const user = userEvent.setup();
    render(<PracticePage />);
    await user.click(screen.getByRole("button", { name: "Send a photo in a chat app" }));
    const phone = screen.getByRole("region", { name: "Pretend phone screen" });
    expect(instruction()).toHaveTextContent("tap Priya's chat");
    expect(screen.getByText("Screen 1 of 5")).toBeInTheDocument();

    await user.click(within(phone).getByRole("button", { name: "Chat with Priya" }));
    expect(feedback()).toHaveAttribute("data-kind", "correct");
    expect(feedback()).toHaveTextContent("Yes! That's right. That opens your chat with Priya.");
    expect(instruction()).toHaveTextContent("Tap where you think you should go to attach a photo.");
    // Keyboard and screen reader users land on the new instruction.
    expect(instruction()).toHaveFocus();

    // Every distractor is a real, named button too.
    const screen2 = screen.getByRole("region", { name: "Pretend phone screen" });
    for (const name of ["Back", "Video call", "Voice call", "Emoji", "Camera", "Voice message"]) {
      expect(within(screen2).getByRole("button", { name })).toBeInTheDocument();
    }
    await user.click(within(screen2).getByRole("button", { name: "Camera" }));
    expect(feedback()).toHaveAttribute("data-kind", "wrong");
    expect(feedback()).toHaveTextContent("Not quite — look for the paperclip at the bottom.");
    expect(within(screen2).getByRole("button", { name: "Attach" })).not.toHaveAttribute("data-reveal");
    expect(instruction()).toHaveTextContent("attach a photo");

    await user.click(within(screen2).getByRole("button", { name: "Voice message" }));
    expect(within(screen2).getByRole("button", { name: "Attach" })).toHaveAttribute("data-reveal", "true");
    expect(feedback()).toHaveTextContent("Look for the glowing circle.");

    // The keyboard works as well as a tap.
    within(screen2).getByRole("button", { name: "Attach" }).focus();
    await user.keyboard("{Enter}");
    expect(feedback()).toHaveAttribute("data-kind", "correct");
    expect(instruction()).toHaveTextContent("where your photos are kept");
    expect(screen.getByRole("button", { name: "Gallery" })).not.toHaveAttribute("data-reveal");
  });

  it("finishing saves it, says what was learned, and offers Practise again", async () => {
    const user = userEvent.setup();
    render(<PracticePage />);
    await user.click(screen.getByRole("button", { name: "Make a video call" }));
    for (const name of ["Chat with Raj", "Video call", "End call"]) await user.click(screen.getByRole("button", { name }));
    expect(screen.getByRole("heading", { name: "You did it!" })).toHaveFocus();
    expect(screen.getByText(/the video camera starts it, and the red button ends it/)).toBeInTheDocument();
    expect(screen.getByText("This counts towards your Tech Confidence.")).toBeInTheDocument();
    expect(getCompletedPractice()).toEqual(["video-call"]);
    expect(screen.getByRole("link", { name: "Learn more about this" })).toHaveAttribute("href", "/app/learn/whatsapp-video-call");

    await user.click(screen.getByRole("button", { name: "Practise again" }));
    expect(instruction()).toHaveTextContent("Tap Raj's chat");
    await user.click(screen.getAllByRole("button", { name: "All practice" })[0]);
    expect(within(screen.getByRole("button", { name: /^Make a video call/ })).getByText("Done")).toBeInTheDocument();
  });

  it("Spot the scam explains why after the suspicious message is found", async () => {
    const user = userEvent.setup();
    render(<PracticePage />);
    await user.click(screen.getByRole("button", { name: "Spot the scam message" }));
    await user.click(screen.getByRole("button", { name: "Message from City Pharmacy" }));
    expect(feedback()).toHaveTextContent(/rushes you, has a strange link or asks for a code/);
    await user.click(screen.getByRole("button", { name: "Message from BANK-ALERT" }));
    expect(screen.getByText(/It rushes you .* strange short link, and it asks for your OTP/)).toBeInTheDocument();
  });

  it("speaks Hinglish too", async () => {
    setUiLanguage("hinglish");
    render(<PracticePage />);
    expect(screen.getByText("Practice screen — asli app nahi")).toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: "Chat app mein photo bhejiye" }));
    await userEvent.click(screen.getByRole("button", { name: "Raj se chat" }));
    expect(feedback()).toHaveTextContent("Yeh nahi — list mein Priya ka naam dhoondhiye.");
  });
});
