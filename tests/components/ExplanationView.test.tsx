import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { STORAGE_KEY, getGuide, saveGuide } from "@/lib/store/localStore";
import GuidePage from "@/app/guide/[id]/page";

vi.mock("next/navigation", () => ({ useRouter: () => ({ push: vi.fn() }) }));

const explanation = {
  kind: "explanation",
  language: "en",
  title: "What is ChatGPT?",
  text: "ChatGPT is a computer program you can talk to.",
  offerShowMeHow: true,
};

const steps = {
  kind: "steps",
  language: "en",
  title: "Start using ChatGPT",
  device: "iPhone",
  steps: [
    { instruction: "Open the App Store", lookFor: "Blue icon with an A", spoken: "Open the App Store" },
    { instruction: "Search for ChatGPT", lookFor: "Magnifying glass at the bottom", spoken: "Search for ChatGPT" },
  ],
  screenshotHowTo: ["Press the side button and volume up"],
};

describe("ExplanationView (AE6)", () => {
  beforeEach(() => {
    localStorage.setItem(STORAGE_KEY, "{}");
  });
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("shows the explanation and a Show me how button that loads steps", async () => {
    const fetchMock = vi.fn(async () => new Response(JSON.stringify(steps), { status: 200 }));
    vi.stubGlobal("fetch", fetchMock);
    saveGuide({ id: "gpt", question: "What is ChatGPT?", title: explanation.title, answer: explanation });

    await act(async () => {
      render(<GuidePage params={Promise.resolve({ id: "gpt" })} />);
    });
    expect(await screen.findByRole("heading", { name: "What is ChatGPT?" })).toBeInTheDocument();
    expect(screen.getByText("ChatGPT is a computer program you can talk to.")).toBeInTheDocument();
    expect(screen.queryByText(/Step 1 of/)).not.toBeInTheDocument();

    await userEvent.click(screen.getByRole("button", { name: "Show me how" }));
    expect(await screen.findByText("Step 1 of 2")).toBeInTheDocument();
    expect(screen.getByText("Open the App Store")).toBeInTheDocument();

    const body = JSON.parse(String(((fetchMock.mock.calls[0] as unknown[])[1] as RequestInit).body));
    expect(body).toMatchObject({ question: "What is ChatGPT?", mode: "showMeHow" });
    expect(getGuide("gpt")?.answer).toMatchObject({ kind: "steps", title: "Start using ChatGPT" });
  });

  it("offers Ask my family for help with the explanation's title and no step", async () => {
    saveGuide({ id: "gpt", question: "What is ChatGPT?", title: explanation.title, answer: explanation });
    await act(async () => {
      render(<GuidePage params={Promise.resolve({ id: "gpt" })} />);
    });
    await userEvent.click(await screen.findByRole("button", { name: "Ask my family for help" }));
    const lines = [...screen.getByTestId("family-message").querySelectorAll("p")].map((p) => p.textContent);
    expect(lines).toEqual(["I need help with: What is ChatGPT?", "Sent from Tech Helper"]);
  });
});
