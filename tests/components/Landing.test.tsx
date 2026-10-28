import { describe, expect, it, vi } from "vitest";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import Landing from "@/app/page";

vi.mock("next/navigation", () => ({ useRouter: () => ({ push: vi.fn(), prefetch: vi.fn() }) }));

describe("Landing page", () => {
  it("shows the hero, the metadata row and a real question box that goes to /app?q=", () => {
    render(<Landing />);
    expect(screen.getByRole("heading", { level: 1, name: "Technology doesn't have to be confusing." })).toBeInTheDocument();
    expect(screen.getByText(/Tell me what you're trying to do, and I'll guide you one step at a time\./)).toBeInTheDocument();
    const meta = screen.getByRole("list", { name: "At a glance" });
    for (const item of ["(Free)", "No sign-up", "Works on any phone"]) expect(within(meta).getByText(item)).toBeInTheDocument();
    // The hero leads with the product on a phone, not the mascot.
    expect(screen.getByRole("img", { name: /Tech Helper on a phone: Step 2 of 4, Tap the \+ button/ })).toBeInTheDocument();
    expect(screen.queryByText(/Hi! I'm your Tech Helper/)).not.toBeInTheDocument();
    const input = screen.getByRole("textbox", { name: "What would you like help with?" });
    expect(input).toHaveAttribute("name", "q");
    const form = input.closest("form")!;
    expect(form.getAttribute("action")).toBe("/app");
    expect(within(form).getByRole("button", { name: "Help me" })).toHaveAttribute("type", "submit");
  });

  it("has Try asking chips that ask on /app", () => {
    render(<Landing />);
    expect(screen.getByRole("link", { name: "How do I post on Instagram?" })).toHaveAttribute(
      "href",
      "/app?q=How%20do%20I%20post%20on%20Instagram%3F",
    );
    expect(screen.getByRole("link", { name: "How do I send a photo on WhatsApp?" })).toHaveAttribute(
      "href",
      expect.stringMatching(/^\/app\?q=/),
    );
    expect(screen.getByRole("link", { name: "Why isn't my Wi-Fi working?" })).toHaveAttribute("href", expect.stringMatching(/^\/app\?q=/));
  });

  it("has a minimal top bar: the wordmark, section anchors that exist, and an underlined way into the app", () => {
    render(<Landing />);
    const header = screen.getByRole("banner");
    expect(within(header).getByRole("link", { name: "Tech Helper home" })).toHaveAttribute("href", "/");
    expect(within(header).getByTestId("wordmark")).toHaveTextContent("tech helper");
    const nav = screen.getByRole("navigation", { name: "Main" });
    for (const [name, href] of [
      ["How it works", "#how-it-works"],
      ["Safety", "#safety"],
      ["Learn", "#learn"],
      ["For families", "#families"],
    ]) {
      expect(within(nav).getByRole("link", { name })).toHaveAttribute("href", href);
      expect(document.getElementById(href.slice(1))).toBeInTheDocument();
    }
    // "Open the app →" (just "Open app" on phones); the arrow is decoration.
    const open = within(header).getByRole("link", { name: "Open the app" });
    expect(open).toHaveAttribute("href", "/app");
    expect(open).toHaveClass("link-cta");
  });

  it("links Ask, Speak and Show to the right places", () => {
    render(<Landing />);
    expect(screen.getByRole("link", { name: "Ask: Type your question" })).toHaveAttribute("href", "/app?start=ask");
    expect(screen.getByRole("link", { name: "Speak: Tell me what you need" })).toHaveAttribute("href", "/app?start=speak");
    expect(screen.getByRole("link", { name: "Show: Upload a screenshot" })).toHaveAttribute("href", "/app/press");
  });

  it("links the topic grid to library categories and the scam check", () => {
    render(<Landing />);
    const grid = screen.getByRole("heading", { name: "How can I help?" }).closest("section")!;
    for (const [name, id] of [["Phone", "phone"], ["WhatsApp", "whatsapp"], ["Instagram", "instagram"], ["Email", "email"], ["Computer", "computer"]]) {
      expect(within(grid).getByRole("link", { name })).toHaveAttribute("href", `/app/library?topic=${id}`);
    }
    expect(within(grid).getByRole("link", { name: "Scam Check" })).toHaveAttribute("href", "/app/scam");
  });

  it("has the magic lens demo, learn chips, scam check, families and privacy footer", () => {
    render(<Landing />);
    expect(screen.getByRole("img", { name: /glowing circle appears around the \+ button/ })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Try it →" })).toHaveAttribute("href", "/app/press");
    for (const name of ["Teach me WhatsApp", "Teach me Instagram", "Teach me online safety"]) {
      expect(screen.getByRole("link", { name })).toHaveAttribute("href", "/app/learn");
    }
    expect(screen.getByRole("link", { name: "Upload screenshot" })).toHaveAttribute("href", "/app/scam");
    expect(screen.getByRole("link", { name: "Paste message" })).toHaveAttribute("href", "/app/scam");
    for (const badge of ["Probably safe", "Be careful", "Potential scam"]) expect(screen.getByText(badge)).toBeInTheDocument();
    expect(screen.getByText(/Legitimate banks will never ask you to share your OTP\./)).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Technology help, without the phone call." })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Set it up for someone you love" })).toBeInTheDocument();
    expect(screen.getByText(/Nothing you ask is stored on our servers\. Questions are sent to an AI service to be answered\./)).toBeInTheDocument();
    // There are no accounts, so no account icon or family "Support Circle" dashboard.
    expect(screen.queryByText(/support circle/i)).not.toBeInTheDocument();
    expect(screen.queryByText("👤")).not.toBeInTheDocument();
  });

  it("answers common worries in an FAQ that opens and closes", async () => {
    render(<Landing />);
    const faq = screen.getByRole("heading", { name: "Good questions." }).closest("section")!;
    expect(faq).toHaveAttribute("id", "faq");
    const questions = ["Is it free?", "Do I need to sign up?", "Is my information safe?", "Which phones does it work on?", "Can it speak Hindi?", "What if I get stuck?"];
    const details = faq.querySelectorAll("details");
    expect(details).toHaveLength(questions.length);
    for (const q of questions) expect(within(faq).getByText(q).closest("summary")).not.toBeNull();

    const safe = within(faq).getByText("Is my information safe?").closest("details")!;
    expect(safe.open).toBe(false);
    await userEvent.click(within(faq).getByText("Is my information safe?"));
    expect(safe.open).toBe(true);
    expect(within(safe).getByText(/not saved on our servers/)).toBeInTheDocument();
    expect(within(safe).getByText(/sent to an AI service/)).toBeInTheDocument();
    expect(within(safe).getByText(/Never share an OTP, PIN or password/)).toBeInTheDocument();
    await userEvent.click(within(faq).getByText("Is my information safe?"));
    expect(safe.open).toBe(false);

    const hindi = within(faq).getByText("Can it speak Hindi?").closest("details")!;
    expect(within(hindi).getByText(/English, Hindi and Hinglish/)).toBeInTheDocument();
  });

  it("ends with a second question box on blue that also asks on /app", () => {
    render(<Landing />);
    const section = screen.getByRole("heading", { name: /Start asking/ }).closest("section")!;
    const input = within(section).getByRole("textbox", { name: "Ask your first question" });
    expect(input).toHaveAttribute("name", "q");
    expect(input).toBeRequired();
    const form = input.closest("form")!;
    expect(form.getAttribute("action")).toBe("/app");
    expect(within(form).getByRole("button", { name: "Start asking" })).toHaveAttribute("type", "submit");
    // Only one "Help me" button and one hero question box, so neither is ambiguous.
    expect(screen.getAllByRole("button", { name: "Help me" })).toHaveLength(1);
    expect(screen.getAllByRole("textbox", { name: "What would you like help with?" })).toHaveLength(1);
  });

  it("explains Ask my family and the practice phone, without invented social proof", () => {
    render(<Landing />);
    const families = document.getElementById("families")!;
    expect(within(families).getByRole("heading", { name: "Ask my family" })).toBeInTheDocument();
    expect(within(families).getByText(/which step they're on, with a picture of their screen/)).toBeInTheDocument();
    expect(within(families).getByText(/sent from their own phone/)).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Start practising →" })).toHaveAttribute("href", "/app/practice");
    // No testimonials, user counts or logos: we have none.
    expect(screen.queryByText(/\b\d[\d,.]*\s*(k|\+)?\s*(users|people|families|reviews)\b/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/testimonial|trusted by|as seen/i)).not.toBeInTheDocument();
  });
});
