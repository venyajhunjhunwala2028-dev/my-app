import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, waitFor } from "@testing-library/react";
import { STORAGE_KEY, saveGuide, setCurrentGuide, setGuideStep } from "@/lib/store/localStore";
import Home from "@/app/page";

const push = vi.fn();
vi.mock("next/navigation", () => ({ useRouter: () => ({ push }) }));

const step = (n: number) => ({ instruction: `Step ${n}`, lookFor: "A button", spoken: `Step ${n}` });

describe("Home page", () => {
  beforeEach(() => {
    push.mockReset();
    localStorage.setItem(STORAGE_KEY, "{}");
  });

  it("on a cold launch with an unfinished guide at step 3, goes straight back to that guide", async () => {
    saveGuide({
      id: "photo",
      question: "How do I send a photo?",
      title: "Send a photo",
      answer: { kind: "steps", language: "en", title: "Send a photo", device: null, steps: [1, 2, 3, 4, 5].map(step), screenshotHowTo: ["x"] },
    });
    setGuideStep("photo", 3);
    setCurrentGuide("photo");

    render(<Home />);
    await waitFor(() => expect(push).toHaveBeenCalledWith("/guide/photo"));
  });

  it("on a cold launch with a current explanation guide, stays on the home screen", async () => {
    vi.resetModules();
    const store = await import("@/lib/store/localStore");
    const { default: FreshHome } = await import("@/app/page");
    store.saveGuide({
      id: "wifi",
      question: "What is wifi?",
      title: "Wifi",
      answer: { kind: "explanation", language: "en", title: "Wifi", paragraphs: ["Wifi is wireless internet."] },
    });
    store.setCurrentGuide("wifi");

    const { findByRole } = render(<FreshHome />);
    await findByRole("heading", { name: "Tech Helper" });
    await new Promise((r) => setTimeout(r, 0));
    expect(push).not.toHaveBeenCalled();
  });
});
