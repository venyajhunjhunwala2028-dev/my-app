import { describe, expect, it, vi } from "vitest";
import { render, screen, within } from "@testing-library/react";
import Landing from "@/app/page";

vi.mock("next/navigation", () => ({ useRouter: () => ({ push: vi.fn(), prefetch: vi.fn() }) }));

describe("Landing page", () => {
  it("shows the hero, the mascot greeting and a real question box that goes to /app?q=", () => {
    render(<Landing />);
    expect(screen.getByRole("heading", { level: 1, name: "Technology doesn't have to be confusing." })).toBeInTheDocument();
    expect(screen.getByText(/Tell me what you're trying to do, and I'll guide you one step at a time\./)).toBeInTheDocument();
    expect(screen.getByText(/Hi! I'm your Tech Helper/)).toBeInTheDocument();
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

  it("has a minimal top bar with section anchors and a way into the app", () => {
    render(<Landing />);
    const nav = screen.getByRole("navigation", { name: "Main" });
    expect(within(nav).getByRole("link", { name: "How it works" })).toHaveAttribute("href", "#how-it-works");
    expect(within(nav).getByRole("link", { name: "Safety" })).toHaveAttribute("href", "#safety");
    expect(document.getElementById("how-it-works")).toBeInTheDocument();
    expect(document.getElementById("safety")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Open app" })).toHaveAttribute("href", "/app");
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
});
